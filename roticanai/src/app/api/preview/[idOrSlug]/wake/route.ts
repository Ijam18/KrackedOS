import { Effect } from "effect";
import { NextResponse } from "next/server";
import { getAppByIdOrSlug } from "@/lib/services/app";
import { createSandbox } from "@/lib/services/sandbox/lifecycle";
import { getWakeEntry, setWakeEntry } from "@/lib/services/sandbox/wake-state";

type RouteContext = {
  params: Promise<{ idOrSlug: string }>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * OPTIONS /api/preview/[idOrSlug]/wake - CORS preflight
 */
export const OPTIONS = () => new NextResponse(null, { headers: corsHeaders });

const doWake = async (appId: string) => {
  try {
    const sandboxInfo = await Effect.runPromise(createSandbox(appId));
    await setWakeEntry(appId, {
      status: "live",
      previewUrl: sandboxInfo.previewUrl,
    });
  } catch (err) {
    await setWakeEntry(appId, { status: "error", error: String(err) });
  }
};

/**
 * POST /api/preview/[idOrSlug]/wake - Wake up a sandbox from snapshot (public, no auth)
 * Returns 202 immediately and performs the restore async.
 * Poll /api/preview/[idOrSlug]/status for progress.
 */
export const POST = async (_req: Request, context: RouteContext) => {
  const { idOrSlug } = await context.params;

  const app = await getAppByIdOrSlug(idOrSlug);
  if (!app) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders },
    );
  }
  if (!app.snapshotId) {
    return NextResponse.json(
      { error: "No snapshot" },
      { status: 422, headers: corsHeaders },
    );
  }

  const existing = await getWakeEntry(app.id);
  if (existing?.status === "waking") {
    return NextResponse.json(
      { status: "waking" },
      { status: 202, headers: corsHeaders },
    );
  }

  setWakeEntry(app.id, { status: "waking" });
  doWake(app.id); // fire and forget
  return NextResponse.json(
    { status: "waking" },
    { status: 202, headers: corsHeaders },
  );
};
