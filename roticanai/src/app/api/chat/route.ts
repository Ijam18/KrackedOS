import {
  convertToModelMessages,
  generateId,
  stepCountIs,
  UI_MESSAGE_STREAM_HEADERS,
  type UIMessage,
} from "ai";
import { Effect } from "effect";
import { headers } from "next/headers";
import { after, NextResponse } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { calculateCost, getModel, streamText } from "@/lib/core/ai";
import { auth } from "@/lib/core/auth/server";
import { getPublisher, getSubscriber } from "@/lib/core/redis-pubsub";
import {
  getUsageActor,
  incrementDailyUsageForActor,
  updateAppUsage,
  verifyAppOwnership,
} from "@/lib/services";
import { buildSystemPrompt } from "@/lib/services/ai/prompts";
import { createSpritesTools } from "@/lib/services/ai/tools";
import { getGuestIdFromCookie } from "@/lib/services/guest";
import {
  getMessagesForApp,
  saveAssistantMessage,
  saveUserMessage,
} from "@/lib/services/message";
import { getSandbox } from "@/lib/services/sandbox";
import { createSnapshot } from "@/lib/services/sandbox/snapshots";
import { scheduleScreenshotCapture } from "@/lib/services/screenshot";
import { appMetrics, logger } from "@/lib/telemetry";
import { getTextFromMessage, validatePrompt } from "@/lib/validation/prompt";

/** Redis key for tracking active stream ID per app */
const activeStreamKey = (appId: string) => `stream:${appId}:active`;

/**
 * GET /api/chat?appId={appId}
 *   - With ?resume=true: resumes an active stream from Redis
 *   - Without: returns message history as JSON
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get("appId");
  const isResume = searchParams.get("resume") === "true";

  if (!appId) {
    return new Response("appId required", { status: 400 });
  }

  // Verify authentication
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user.id ?? (await getGuestIdFromCookie());

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify ownership
  const ownershipResult = await Effect.runPromise(
    verifyAppOwnership(appId, userId).pipe(Effect.either),
  );
  if (ownershipResult._tag === "Left") {
    return new Response("App not found", { status: 404 });
  }

  if (isResume) {
    const pub = await getPublisher();
    const streamId = await pub.get(activeStreamKey(appId));

    if (!streamId) {
      return new Response(null, { status: 204 });
    }

    const sub = await getSubscriber();
    const ctx = createResumableStreamContext({
      waitUntil: after,
      publisher: pub,
      subscriber: sub,
    });

    const stream = await ctx.resumeExistingStream(streamId);
    if (!stream) {
      return new Response(null, { status: 204 });
    }

    logger.info("Chat stream resumed", { appId, streamId, userId });
    return new Response(stream, { headers: UI_MESSAGE_STREAM_HEADERS });
  }

  // Return message history as JSON (for page load)
  const messages = await getMessagesForApp(appId);
  return NextResponse.json(messages);
}

/**
 * POST /api/chat
 *
 * Returns a streaming SSE response directly. The stream is also stored in
 * Redis via resumable-stream so clients can reconnect after a page refresh.
 */
export async function POST(req: Request) {
  const startTime = Date.now();

  // Verify authentication
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user.id ?? (await getGuestIdFromCookie());

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { sessionId: appId, messages: bodyMessages } = body as {
    sessionId: string;
    messages?: UIMessage[];
  };

  if (!appId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 },
    );
  }

  const lastMessage = bodyMessages?.[bodyMessages.length - 1];
  if (!lastMessage) {
    return NextResponse.json(
      { error: "messages array is required" },
      { status: 400 },
    );
  }

  const promptText = getTextFromMessage(lastMessage);
  const validationError = validatePrompt(promptText ?? "");

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Verify ownership and get sandbox info
  const validationResult = await Effect.runPromise(
    Effect.gen(function* () {
      const app = yield* verifyAppOwnership(appId, userId);
      const sandbox = yield* getSandbox(appId);
      return { app, previewUrl: sandbox.previewUrl };
    }).pipe(Effect.either),
  );

  if (validationResult._tag === "Left") {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const usageActor = await Effect.runPromise(getUsageActor(userId));

  // Save user message and load full history
  await saveUserMessage(appId, lastMessage);
  const storedMessages = await getMessagesForApp(appId);
  const tools = createSpritesTools(appId);
  const assistantMessageId = generateId();

  // First generation: inject design direction into system prompt
  const isFirstGeneration =
    storedMessages.filter((m) => m.role === "user").length <= 1;
  let designDirection: string | null = null;
  if (isFirstGeneration) {
    const { getApp } = await import("@/lib/services/app");
    const freshApp = await getApp(appId);
    designDirection = freshApp?.enhancedPrompt ?? null;
  }
  let system = buildSystemPrompt();
  if (designDirection && isFirstGeneration) {
    system += `\n\n# Design Direction for This App\n\n${designDirection}`;
  }

  let streamUsage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } = {};
  let streamModelId: string | undefined;
  let streamFinishReason: string | undefined;

  logger.info("AI generation started", { appId, userId });

  const result = streamText({
    model: getModel("openai", "best"),
    system,
    messages: await convertToModelMessages(storedMessages),
    tools,
    stopWhen: stepCountIs(30),
    onFinish: async ({ usage, response, finishReason }) => {
      streamUsage = {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
      };
      streamModelId = response.modelId;
      streamFinishReason = finishReason;
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: storedMessages,
    generateMessageId: () => assistantMessageId,
    onFinish: async ({ responseMessage }) => {
      const durationMs = Date.now() - startTime;

      await saveAssistantMessage(appId, responseMessage, {
        inputTokens: streamUsage.inputTokens,
        outputTokens: streamUsage.outputTokens,
        totalTokens: streamUsage.totalTokens,
        modelId: streamModelId,
        durationMs,
        finishReason: streamFinishReason,
      });

      // Increment daily usage (fire-and-forget)
      Effect.runPromise(
        incrementDailyUsageForActor(usageActor).pipe(
          Effect.catchAll((error) =>
            Effect.sync(() =>
              logger.error("Failed to increment daily usage", error, {
                userId,
              }),
            ),
          ),
        ),
      );

      const cost = calculateCost(
        streamModelId ?? "",
        streamUsage.inputTokens ?? 0,
        streamUsage.outputTokens ?? 0,
      );

      await updateAppUsage(appId, {
        inputTokens: streamUsage.inputTokens ?? 0,
        outputTokens: streamUsage.outputTokens ?? 0,
        cost,
      });

      scheduleScreenshotCapture(appId);

      await Effect.runPromise(
        createSnapshot(appId).pipe(Effect.catchAll(() => Effect.void)),
      );

      // Clear active stream ID so GET resume returns 204 after completion
      const pub = await getPublisher();
      await pub.del(activeStreamKey(appId));

      const modelName = streamModelId ?? "unknown";
      appMetrics.recordAiGeneration({
        model: modelName,
        success: true,
        userId,
        appId,
      });
      appMetrics.recordAiDuration(durationMs, {
        model: modelName,
        success: true,
      });
      if (
        streamUsage.inputTokens &&
        streamUsage.outputTokens &&
        streamUsage.totalTokens
      ) {
        appMetrics.recordTokens({
          model: modelName,
          promptTokens: streamUsage.inputTokens,
          completionTokens: streamUsage.outputTokens,
          totalTokens: streamUsage.totalTokens,
        });
      }

      logger.info("AI generation completed", {
        appId,
        inputTokens: streamUsage.inputTokens,
        outputTokens: streamUsage.outputTokens,
        durationMs,
      });
    },
    async consumeSseStream({ stream }) {
      const streamId = generateId();
      const [pub, sub] = await Promise.all([getPublisher(), getSubscriber()]);
      const ctx = createResumableStreamContext({
        waitUntil: after,
        publisher: pub,
        subscriber: sub,
      });
      await ctx.createNewResumableStream(streamId, () => stream);
      await pub.set(activeStreamKey(appId), streamId, { EX: 3600 });
    },
  });
}
