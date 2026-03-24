/**
 * app/api/admin/reports/route.ts
 *
 * PRD §11 (Admin Dashboard): Reports & Analytics
 *  - Total users
 *  - Total prize pool
 *  - Charity contribution totals
 *  - Draw statistics
 *
 * ADMIN ONLY
 *
 * GET /api/admin/reports?include[]=users&include[]=prize_pool&include[]=charity&include[]=draw_stats
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import { reportsQuerySchema } from "@/lib/server/validators";
import type { ApiResponse, AdminReportData } from "@/types/index";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("GET /api/admin/reports");

  try {
    // --- 1. Require admin ---
    let admin;
    try {
      admin = await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    log.info("Report requested", { adminId: admin.id });

    // --- 2. Parse query params ---
    const { searchParams } = new URL(req.url);
    const rawInclude = searchParams.getAll("include");
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const parsed = reportsQuerySchema.safeParse({
      from,
      to,
      include: rawInclude.length > 0 ? rawInclude : undefined,
    });

    const include = parsed.success
      ? parsed.data.include
      : ["users", "prize_pool", "charity", "draw_stats"];

    const supabase = createAdminClient();

    // Run all requested report sections in parallel for performance
    const reportPromises: Promise<[string, any]>[] = [];

    // -------------------------------------------------------------------------
    // SECTION: Users — PRD §11 "Total users"
    // -------------------------------------------------------------------------
    if (include.includes("users")) {
      reportPromises.push(
        (async (): Promise<[string, any]> => {
          const [totalResult, activeResult, newResult] = await Promise.all([
            // Total registered users
            supabase.from("users").select("id", { count: "exact", head: true }),
            // Active subscribers
            supabase
              .from("subscriptions")
              .select("id", { count: "exact", head: true })
              .eq("status", "active"),
            // New users this month
            supabase
              .from("users")
              .select("id", { count: "exact", head: true })
              .gte("created_at", new Date(new Date().setDate(1)).toISOString()),
          ]);

          return [
            "users",
            {
              total: totalResult.count ?? 0,
              active_subscribers: activeResult.count ?? 0,
              new_this_month: newResult.count ?? 0,
            },
          ];
        })()
      );
    }

    // -------------------------------------------------------------------------
    // SECTION: Prize Pool — PRD §07 + §11 "Total prize pool"
    // -------------------------------------------------------------------------
    if (include.includes("prize_pool")) {
      reportPromises.push(
        (async (): Promise<[string, any]> => {
          // Sum prize_pool_contribution from all active subscriptions
          const { data: subs } = await supabase
            .from("subscriptions")
            .select("prize_pool_contribution_paise")
            .eq("status", "active");

          const totalPrizePoolPaise = (subs ?? []).reduce(
            (sum, s) => sum + (s.prize_pool_contribution_paise ?? 0),
            0
          );

          // Jackpot rollover from settings
          const { data: rolloverSetting } = await supabase
            .from("settings")
            .select("value")
            .eq("key", "jackpot_rollover_paise")
            .maybeSingle();

          const rolledOverPaise = parseInt(rolloverSetting?.value ?? "0");

          // Total paid out to winners
          const { data: winners } = await supabase
            .from("winners")
            .select("prize_amount_paise")
            .eq("status", "paid");

          const totalPaidOutPaise = (winners ?? []).reduce(
            (sum, w) => sum + (w.prize_amount_paise ?? 0),
            0
          );

          return [
            "prize_pool",
            {
              current_pool_paise: totalPrizePoolPaise,
              current_pool_inr: (totalPrizePoolPaise / 100).toFixed(2),
              jackpot_rollover_paise: rolledOverPaise,
              jackpot_rollover_inr: (rolledOverPaise / 100).toFixed(2),
              total_paid_out_paise: totalPaidOutPaise,
              total_paid_out_inr: (totalPaidOutPaise / 100).toFixed(2),
            },
          ];
        })()
      );
    }

    // -------------------------------------------------------------------------
    // SECTION: Charity — PRD §08 + §11 "Charity contribution totals"
    // -------------------------------------------------------------------------
    if (include.includes("charity")) {
      reportPromises.push(
        (async (): Promise<[string, any]> => {
          // Total charity contributions (all time)
          const { data: donations } = await supabase
            .from("donations")
            .select("amount_paise, charity_id, charities(name)");

          const totalCharityPaise = (donations ?? []).reduce(
            (sum, d) => sum + (d.amount_paise ?? 0),
            0
          );

          // Group by charity for breakdown
          const charityMap = new Map<string, { name: string; total: number }>();
          for (const d of donations ?? []) {
            const charityId = d.charity_id;
            const charityName = (d.charities as any)?.name ?? "Unknown";
            if (!charityMap.has(charityId)) {
              charityMap.set(charityId, { name: charityName, total: 0 });
            }
            charityMap.get(charityId)!.total += d.amount_paise ?? 0;
          }

          const breakdown = Array.from(charityMap.entries())
            .map(([charity_id, { name, total }]) => ({
              charity_id,
              charity_name: name,
              total_paise: total,
              total_inr: (total / 100).toFixed(2),
            }))
            .sort((a, b) => b.total_paise - a.total_paise);

          return [
            "charity",
            {
              total_contributed_paise: totalCharityPaise,
              total_contributed_inr: (totalCharityPaise / 100).toFixed(2),
              charity_breakdown: breakdown,
            },
          ];
        })()
      );
    }

    // -------------------------------------------------------------------------
    // SECTION: Draw Stats — PRD §11 "Draw statistics"
    // -------------------------------------------------------------------------
    if (include.includes("draw_stats")) {
      reportPromises.push(
        (async (): Promise<[string, any]> => {
          const [drawsResult, winnersResult, pendingWinnersResult] = await Promise.all([
            supabase.from("draws").select("id, status, draw_month, winning_numbers", { count: "exact" }),
            supabase.from("winners").select("id, tier, status", { count: "exact" }),
            supabase
              .from("winners")
              .select("id", { count: "exact", head: true })
              .in("status", ["pending", "proof_submitted"]),
          ]);

          const draws = drawsResult.data ?? [];
          const winners = winnersResult.data ?? [];

          const tierCounts = {
            five_match: winners.filter((w) => w.tier === "five").length,
            four_match: winners.filter((w) => w.tier === "four").length,
            three_match: winners.filter((w) => w.tier === "three").length,
          };

          return [
            "draw_stats",
            {
              total_draws: drawsResult.count ?? 0,
              published_draws: draws.filter((d) => d.status === "published").length,
              draft_draws: draws.filter((d) => d.status === "draft").length,
              total_winners: winnersResult.count ?? 0,
              pending_verification: pendingWinnersResult.count ?? 0,
              winner_tier_breakdown: tierCounts,
              recent_draws: draws
                .filter((d) => d.status === "published")
                .sort((a, b) => b.draw_month.localeCompare(a.draw_month))
                .slice(0, 6)
                .map((d) => ({
                  draw_month: d.draw_month,
                  winning_numbers: d.winning_numbers,
                })),
            },
          ];
        })()
      );
    }

    // --- 3. Await all report sections in parallel ---
    const results = await Promise.allSettled(reportPromises);

    const report: Record<string, any> = {
      generated_at: new Date().toISOString(),
    };

    for (const result of results) {
      if (result.status === "fulfilled") {
        const [section, data] = result.value;
        report[section] = data;
      } else {
        log.error("Report section failed", { reason: result.reason });
      }
    }

    log.info("Report generated", { sections: Object.keys(report) });

    return NextResponse.json(
      { success: true, data: report },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Report generation failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
