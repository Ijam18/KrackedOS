import { NextResponse } from "next/server";
import { getAppByIdOrSlug } from "@/lib/services/app";
import { getWakeEntry } from "@/lib/services/sandbox/wake-state";

type RouteContext = {
  params: Promise<{ idOrSlug: string }>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * OPTIONS /api/preview/[idOrSlug]/status - CORS preflight
 */
export const OPTIONS = () => new NextResponse(null, { headers: corsHeaders });

/**
 * GET /api/preview/[idOrSlug]/status - Poll wake status (public, no auth)
 * Returns in-memory wake state if available, falls back to DB state.
 *
 * Possible statuses:
 *   "waking"      — restore is in progress
 *   "live"        — sandbox is ready
 *   "error"       — restore failed
 *   "dead"        — no in-memory state, has snapshot but no sandbox
 *   "no-snapshot" — cannot be started
 */
export const GET = async (_req: Request, context: RouteContext) => {
  const { idOrSlug } = await context.params;

  const app = await getAppByIdOrSlug(idOrSlug);
  if (!app) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders },
    );
  }

  const entry = await getWakeEntry(app.id);
  if (entry) {
    return NextResponse.json(
      {
        status: entry.status,
        ...(entry.previewUrl ? { previewUrl: entry.previewUrl } : {}),
        ...(entry.error ? { error: entry.error } : {}),
      },
      { status: 200, headers: corsHeaders },
    );
  }

  // Fall back to DB state
  let status: "live" | "dead" | "no-snapshot";
  if (app.sandboxId && app.previewUrl) {
    status = "live";
  } else if (app.snapshotId) {
    status = "dead";
  } else {
    status = "no-snapshot";
  }

  return NextResponse.json(
    { status, ...(app.previewUrl ? { previewUrl: app.previewUrl } : {}) },
    { status: 200, headers: corsHeaders },
  );
};
