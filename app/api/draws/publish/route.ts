/**
 * app/api/draws/publish/route.ts
 *
 * PRD §06: "Admin controls publishing of draw results"
 * PRD §07: Prize pool auto-calculation + 40/35/25 split + rollover
 * PRD §09: Winner records created with status 'pending'
 * PRD §13: Email notifications to all winners
 *
 * ADMIN ONLY — Official draw publication. Persists winners to DB.
 * Requires explicit confirm: true to prevent accidental triggers.
 *
 * Testing checklist: "Draw system logic and simulation"
 *
 * POST /api/draws/publish
 * Headers: Authorization: Bearer <admin_token>
 * Body: { draw_id, mode, weight_by?, override_numbers?, confirm: true }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import { publishDrawSchema } from "@/lib/server/validators";
import { runDraw } from "@/lib/server/drawEngine";
import { sendWinnerAlert, sendDrawResultsNotification } from "@/lib/server/mailer";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("POST /api/draws/publish");

  try {
    // --- 1. Require admin ---
    let admin;
    try {
      admin = await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    log.info("Draw publish requested", { adminId: admin.id });

    // --- 2. Validate request ---
    const body = await req.json().catch(() => ({}));
    const parsed = publishDrawSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { draw_id, mode, weight_by, override_numbers, confirm } = parsed.data;

    // confirm: true is mandatory (schema enforces literal true)
    if (!confirm) {
      return NextResponse.json(
        { success: false, error: "Must include confirm: true to publish" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // --- 3. Verify draw exists and is not already published ---
    const { data: draw, error: drawError } = await supabase
      .from("draws")
      .select("*")
      .eq("id", draw_id)
      .single();

    if (drawError || !draw) {
      return NextResponse.json({ success: false, error: "Draw not found" }, { status: 404 });
    }

    if (draw.status === "published") {
      return NextResponse.json(
        { success: false, error: "Draw already published" },
        { status: 409 }
      );
    }

    // --- 4. Run the official draw ---
    // simulate: false → WILL persist winners to DB
    // PRD §06: "Monthly cadence — draws executed once per month"
    const result = await runDraw({
      drawId: draw_id,
      mode,
      simulate: false,   // OFFICIAL: persists to DB
      rolledOverJackpotPaise: draw.jackpot_rollover_paise ?? 0,
    });

    log.info("Draw published", {
      drawId: draw_id,
      winningNumbers: result.winningNumbers,
      totalWinners: result.winners.length,
      rolledOver: result.prizePool.rolledOver,
    });

    // --- 5. Fetch winner details for email notifications ---
    // PRD §13: "Email notifications — draw results, winner alerts"
    const { data: winners } = await supabase
      .from("winners")
      .select("*, users(email, full_name)")
      .eq("draw_id", draw_id);

    // Notify individual winners
    for (const winner of winners ?? []) {
      const user = winner.users as any;
      if (user?.email) {
        await sendWinnerAlert(
          user.email,
          user.full_name ?? "Subscriber",
          winner.prize_amount_paise,
          winner.tier === "five"
            ? "5 Numbers"
            : winner.tier === "four"
            ? "4 Numbers"
            : "3 Numbers"
        );
      }
    }

    // Notify all active subscribers of draw results (bulk)
    const { data: allSubscribers } = await supabase
      .from("users")
      .select("email, subscriptions!inner(status)")
      .eq("subscriptions.status", "active");

    const allEmails = (allSubscribers ?? [])
      .map((u) => u.email)
      .filter(Boolean) as string[];

    if (allEmails.length > 0) {
      // PRD §13: Batch notify — split into chunks to avoid email provider limits
      const CHUNK_SIZE = 50;
      for (let i = 0; i < allEmails.length; i += CHUNK_SIZE) {
        const chunk = allEmails.slice(i, i + CHUNK_SIZE);
        await sendDrawResultsNotification(
          chunk,
          draw.draw_month,
          result.winningNumbers
        );
      }
    }

    // --- 6. Return published result summary ---
    return NextResponse.json(
      {
        success: true,
        data: {
          draw_id,
          draw_month: draw.draw_month,
          status: "published",
          mode,
          winning_numbers: result.winningNumbers,
          prize_pool: result.prizePool,
          active_subscriber_count: result.activeSubscriberCount,
          winners_count: {
            five_match: result.winners.filter((w) => w.tier === "five").length,
            four_match: result.winners.filter((w) => w.tier === "four").length,
            three_match: result.winners.filter((w) => w.tier === "three").length,
            total: result.winners.length,
          },
          jackpot_rollover_paise: result.prizePool.rolledOver,
          emails_sent: allEmails.length,
        },
        message: "Draw published successfully. Winners notified by email.",
      },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Draw publish failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET — Fetch published draw results (public + authenticated)
// PRD §06: "Anyone can view published draws" (via RLS policy)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("GET /api/draws/publish");

  try {
    const { searchParams } = new URL(req.url);
    const drawId = searchParams.get("draw_id");
    const month = searchParams.get("month");  // e.g. "2026-03"

    const supabase = createAdminClient();

    let query = supabase
      .from("draws")
      .select("*")
      .eq("status", "published")
      .order("draw_month", { ascending: false });

    if (drawId) query = query.eq("id", drawId);
    if (month) query = query.eq("draw_month", month);

    const { data: draws, error } = drawId
      ? await supabase
          .from("draws")
          .select("*")
          .eq("id", drawId)
          .eq("status", "published")
          .single()
          .then((r) => ({ data: r.data ? [r.data] : [], error: r.error }))
      : await query;

    if (error) {
      return NextResponse.json({ success: false, error: "Failed to fetch draws" }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, data: { draws: draws ?? [] } },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Draw fetch failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
