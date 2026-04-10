import { NextResponse } from "next/server";
import { incrementViewCount } from "@/lib/services/feed";

/**
 * POST /api/apps/[id]/view - Increment view count (public, fire-and-forget)
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: appId } = await params;

  // Fire-and-forget - don't block the response
  incrementViewCount(appId);

  return NextResponse.json({ ok: true });
}
