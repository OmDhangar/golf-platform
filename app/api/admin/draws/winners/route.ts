import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("GET /api/admin/draws/winners");

  try {
    try {
      await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const drawId = searchParams.get("draw_id");

    if (!drawId) {
      return NextResponse.json({ success: false, error: "Missing draw_id" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: winners, error } = await supabase
      .from("winners")
      .select(`
        *,
        users(full_name, email)
      `)
      .eq("draw_id", drawId)
      .order("tier", { ascending: false });

    if (error) {
      log.error("Failed to fetch winners", { error: error.message });
      return NextResponse.json({ success: false, error: "Failed to fetch winners" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { winners } }, { status: 200 });
  } catch (error) {
    const err = logAndBuildError(log, error, "Winners fetch failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
