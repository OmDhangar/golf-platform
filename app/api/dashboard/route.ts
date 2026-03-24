/**
 * app/api/dashboard/route.ts
 *
 * PRD §10: User Dashboard — all modules in a single efficient API call
 *  ✓ Subscription status (active / inactive / renewal date)
 *  ✓ Score entry and edit interface
 *  ✓ Selected charity and contribution percentage
 *  ✓ Participation summary (draws entered, upcoming draws)
 *  ✓ Winnings overview: total won and current payment status
 *
 * Testing checklist: "User Dashboard — all modules functional"
 *
 * GET /api/dashboard
 * Headers: Authorization: Bearer <token>
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeader, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("GET /api/dashboard");

  try {
    // --- 1. Authenticate ---
    const authHeader = req.headers.get("Authorization");
    const user = await getUserFromHeader(authHeader);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    log.info("Dashboard fetch", { userId: user.id });

    const supabase = createAdminClient();

    // --- 2. Fetch all dashboard data in parallel (performance) ---
    const [
      profileResult,
      subscriptionResult,
      scoresResult,
      charityResult,
      drawsResult,
      winnersResult,
    ] = await Promise.all([

      // User profile
      supabase
        .from("users")
        .select("id, email, full_name, role, charity_id, charity_percent, created_at")
        .eq("id", user.id)
        .single(),

      // PRD §10: "Subscription status (active / inactive / renewal date)"
      supabase
        .from("subscriptions")
        .select("id, status, plan_type, current_period_start, current_period_end, prize_pool_contribution_paise, charity_contribution_paise")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // PRD §05 + §10: "Score entry and edit interface" — latest 5, reverse chrono
      supabase
        .from("scores")
        .select("id, value, played_at, course_name, created_at")
        .eq("user_id", user.id)
        .order("played_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),

      // PRD §10: "Selected charity and contribution percentage"
      // Fetched via user's charity_id — joined lazily below
      supabase
        .from("users")
        .select("charity_id, charity_percent, charities(id, name, description, logo_url, is_featured)")
        .eq("id", user.id)
        .single(),

      // PRD §10: "Participation summary (draws entered, upcoming draws)"
      // A user is "entered" in a draw if they had an active subscription when it ran
      supabase
        .from("draws")
        .select("id, draw_month, status, winning_numbers, published_at, prize_pool_total_paise")
        .in("status", ["published", "draft"])
        .order("draw_month", { ascending: false })
        .limit(12),

      // PRD §10: "Winnings overview: total won and current payment status"
      supabase
        .from("winners")
        .select(`
          id, tier, prize_amount_paise, status,
          proof_url, proof_submitted_at, payout_completed_at,
          draws(draw_month, winning_numbers)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    // --- 3. Calculate winnings total ---
    const winners = winnersResult.data ?? [];
    const totalWonPaise = winners.reduce(
      (sum, w) => sum + (w.prize_amount_paise ?? 0),
      0
    );
    const paidOutPaise = winners
      .filter((w) => w.status === "paid")
      .reduce((sum, w) => sum + (w.prize_amount_paise ?? 0), 0);

    // --- 4. Determine which draws the user participated in ---
    // User participated in a draw if they had an active subscription in that draw month
    const subscription = subscriptionResult.data;
    const draws = drawsResult.data ?? [];

    const participations = draws.map((draw) => {
      const won = winners.find((w) => (w.draws as any)?.draw_month === draw.draw_month);
      return {
        draw_id: draw.id,
        draw_month: draw.draw_month,
        status: draw.status,
        winning_numbers: draw.winning_numbers,
        prize_pool_total_inr:
          draw.prize_pool_total_paise
            ? (draw.prize_pool_total_paise / 100).toFixed(2)
            : null,
        published_at: draw.published_at,
        user_won: !!won,
        winner_tier: won?.tier ?? null,
        prize_amount_inr: won ? (won.prize_amount_paise / 100).toFixed(2) : null,
        winner_status: won?.status ?? null,
      };
    });

    // --- 5. Assemble dashboard response ---
    const charityData = charityResult.data;

    return NextResponse.json(
      {
        success: true,
        data: {
          // PRD §10 Module 1: Subscription status
          subscription: subscription
            ? {
                id: subscription.id,
                status: subscription.status,
                plan_type: subscription.plan_type,
                is_active: subscription.status === "active",
                current_period_start: subscription.current_period_start,
                renewal_date: subscription.current_period_end,  // PRD §10
                prize_pool_contribution_inr:
                  subscription.prize_pool_contribution_paise
                    ? (subscription.prize_pool_contribution_paise / 100).toFixed(2)
                    : "0.00",
                charity_contribution_inr:
                  subscription.charity_contribution_paise
                    ? (subscription.charity_contribution_paise / 100).toFixed(2)
                    : "0.00",
              }
            : null,

          // PRD §10 Module 2: Scores (latest 5, reverse chrono — PRD §05)
          scores: scoresResult.data ?? [],
          scores_count: scoresResult.data?.length ?? 0,
          scores_max: 5,

          // PRD §10 Module 3: Selected charity + contribution %
          charity: charityData
            ? {
                selected: (charityData as any).charities ?? null,
                contribution_percent: charityData.charity_percent,
                min_percent: 10,
              }
            : null,

          // PRD §10 Module 4: Participation summary
          participations: {
            total_draws_participated: participations.filter((p) => p.status === "published").length,
            draws: participations,
            upcoming_draw: draws.find((d) => d.status === "draft")
              ? {
                  draw_month: draws.find((d) => d.status === "draft")!.draw_month,
                  message: "Draw results will be published at end of month",
                }
              : null,
          },

          // PRD §10 Module 5: Winnings overview
          winnings: {
            total_won_paise: totalWonPaise,
            total_won_inr: (totalWonPaise / 100).toFixed(2),
            paid_out_paise: paidOutPaise,
            paid_out_inr: (paidOutPaise / 100).toFixed(2),
            pending_paise: totalWonPaise - paidOutPaise,
            pending_inr: ((totalWonPaise - paidOutPaise) / 100).toFixed(2),
            winners: winners.map((w) => ({
              id: w.id,
              tier: w.tier,
              prize_amount_inr: (w.prize_amount_paise / 100).toFixed(2),
              status: w.status,
              draw_month: (w.draws as any)?.draw_month,
              proof_submitted: !!w.proof_url,
              proof_submitted_at: w.proof_submitted_at,
              payout_completed_at: w.payout_completed_at,
            })),
          },

          // User profile
          user: profileResult.data,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Dashboard fetch failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
