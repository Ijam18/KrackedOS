import { convertToModelMessages, type UIMessage } from "ai";
import { Effect } from "effect";
import { headers } from "next/headers";
import { getModel, streamText } from "@/lib/core/ai";
import { auth } from "@/lib/core/auth/server";
import { getUsageActor, incrementDailyUsageForActor } from "@/lib/services";
import { getGuestIdFromCookie } from "@/lib/services/guest";
import { logger } from "@/lib/telemetry";
import { getTextFromMessage, validatePrompt } from "@/lib/validation/prompt";

/**
 * Lightweight general assistant system prompt for ephemeral chat.
 * No tools, no sandbox context, no app-building instructions.
 */
function buildEphemeralSystemPrompt(): string {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `Current date: ${today}

You are a helpful AI assistant having a casual conversation with the user.

# Guidelines
- Be friendly, concise, and helpful
- Answer questions, brainstorm ideas, explain concepts, or chat casually
- This is a text-only conversation with no code execution or file access
- If the user wants to build an app, suggest they switch to Build Mode
- Keep responses relatively brief unless the user asks for detail
- Maintain context across the conversation
- If the user writes in Bahasa Melayu, reply in Bahasa Melayu

# About rotican.ai
rotican.ai is a vibe coding platform for Malaysians. Describe any app you want and the AI builds it for you instantly.

## Two Modes:

1. **Chat Mode** (where you are now): Just chatting. Ask questions, brainstorm ideas, or get advice. No building happens here.

2. **Build Mode**: This is where the magic happens. Describe any app idea and watch it come to life with a working preview you can interact with.

## How to Build Something
1. Click the **Build** toggle above the chat input
2. Describe what you want (keep it simple!)
3. The AI builds it and shows you a live preview
4. Keep chatting to make changes, or publish it when you're happy

## What You Can Build
- Personal tools (habit trackers, timers, calculators)
- Games (trivia, puzzles, word games)
- Websites (portfolio, event pages, fan pages)
- Creative stuff (color palettes, quote generators, memes)
- Pretty much anything you can describe

# Context
This chat is ephemeral — it exists only in the current browser session and will be cleared on refresh or navigation.

If the user asks about building something, creating an app, or what rotican.ai can do, explain Build Mode and suggest they toggle to it.`;
}

/**
 * POST /api/chat/ephemeral
 *
 * Ephemeral chat endpoint for home page chat mode.
 * - No DB persistence
 * - No sandbox/app creation
 * - No tools
 * - No Redis resumable streams
 * - Simple streaming text response
 */
export async function POST(req: Request) {
  const startTime = Date.now();

  // Verify authentication (same as build mode)
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user.id ?? (await getGuestIdFromCookie());

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const { messages } = body as { messages?: UIMessage[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages array is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const lastMessage = messages[messages.length - 1];
  const promptText = getTextFromMessage(lastMessage);
  const validationError = validatePrompt(promptText ?? "");

  if (validationError) {
    return new Response(JSON.stringify({ error: validationError }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const usageActor = await Effect.runPromise(getUsageActor(userId));

  const system = buildEphemeralSystemPrompt();

  let streamUsage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } = {};

  logger.info("Ephemeral chat started", { userId });

  const result = streamText({
    model: getModel("openai", "chat"),
    system,
    messages: await convertToModelMessages(messages),
    onFinish: async ({ usage }) => {
      streamUsage = {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
      };
    },
  });

  // Use toUIMessageStreamResponse for streaming
  return result.toUIMessageStreamResponse({
    onError: (error: unknown) => {
      logger.error("Ephemeral chat error", { error, userId });
      return error instanceof Error ? error.message : "Unknown error";
    },
    onFinish: async () => {
      const durationMs = Date.now() - startTime;

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

      logger.info("Ephemeral chat completed", {
        userId,
        inputTokens: streamUsage.inputTokens,
        outputTokens: streamUsage.outputTokens,
        durationMs,
      });
    },
  });
}
