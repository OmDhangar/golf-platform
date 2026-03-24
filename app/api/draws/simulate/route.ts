/**
 * app/api/draws/simulate/route.ts
 *
 * PRD §06: "Simulation / pre-analysis mode before official publish"
 * PRD §11 (Admin Dashboard): "Run simulations"
 *
 * ADMIN ONLY — Simulates a draw without persisting winners.
 * Used to preview results before committing to official publish.
 *
 * Testing checklist: "Draw system logic and simulation"
 *
 * POST /api/draws/simulate
 * Headers: Authorization: Bearer <admin_token>
 * Body: { draw_id, mode: "random"|"algorithmic", weight_by?: "most"|"least" }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import { simulateDrawSchema } from "@/lib/server/validators";
import { runDraw } from "@/lib/server/drawEngine";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("POST /api/draws/simulate");

  try {
    // --- 1. Require admin role ---
    // PRD §11: Draw management is admin-only
    let admin;
    try {
      admin = await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    log.info("Draw simulation requested", { adminId: admin.id });

    // --- 2. Validate request body ---
    const body = await req.json().catch(() => ({}));
    const parsed = simulateDrawSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { draw_id, mode, weight_by } = parsed.data;

    // --- 3. Verify the draw exists and is not already published ---
    const supabase = createAdminClient();

    const { data: draw, error: drawError } = await supabase
      .from("draws")
      .select("id, status, draw_month, jackpot_rollover_paise")
      .eq("id", draw_id)
      .single();

    if (drawError || !draw) {
      return NextResponse.json(
        { success: false, error: "Draw not found" },
        { status: 404 }
      );
    }

    if (draw.status === "published") {
      return NextResponse.json(
        { success: false, error: "Draw is already published and cannot be simulated again" },
        { status: 409 }
      );
    }

    // --- 4. Update draw status to 'simulation' (non-committed) ---
    await supabase
      .from("draws")
      .update({ status: "simulation", draw_mode: mode })
      .eq("id", draw_id);

    // --- 5. Run draw engine in simulation mode ---
    // PRD §06: simulate: true means NO DB persistence of winners
    const result = await runDraw({
      drawId: draw_id,
      mode,
      simulate: true,   // KEY: Does NOT persist to DB
      rolledOverJackpotPaise: draw.jackpot_rollover_paise ?? 0,
    });

    log.info("Draw simulation complete", {
      drawId: draw_id,
      mode,
      winningNumbers: result.winningNumbers,
      totalWinners: result.winners.length,
      rolledOver: result.prizePool.rolledOver,
    });

    // --- 6. Return simulation results for admin preview ---
    return NextResponse.json(
      {
        success: true,
        data: {
          simulation: true,
          draw_id,
          draw_month: draw.draw_month,
          mode,
          winning_numbers: result.winningNumbers,
          prize_pool: result.prizePool,
          active_subscriber_count: result.activeSubscriberCount,
          winners: result.winners.map((w) => ({
            user_id: w.userId,
            email: w.email,
            tier: w.tier,
            prize_amount_paise: w.prizeAmountPaise,
            prize_amount_inr: (w.prizeAmountPaise / 100).toFixed(2),
          })),
          winner_counts: {
            five_match: result.winners.filter((w) => w.tier === "five").length,
            four_match: result.winners.filter((w) => w.tier === "four").length,
            three_match: result.winners.filter((w) => w.tier === "three").length,
          },
          jackpot_rollover_paise: result.prizePool.rolledOver,
          note: "This is a simulation only. Call /api/draws/publish to commit results.",
        },
        message: "Simulation complete — no results have been published",
      },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Draw simulation failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
