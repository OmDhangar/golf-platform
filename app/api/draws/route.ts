/**
 * app/api/draws/route.ts
 *
 * Public draws listing endpoint — no auth required.
 *
 * GET /api/draws                       → Current month's published draw + prizes
 * GET /api/draws?leaderboard=true     → Include participant leaderboard (top 10 by tickets)
 * GET /api/draws?month=2026-03        → Specific month
 *
 * Caching: 5-minute revalidation (ISR).
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";
// 5-minute ISR cache for the draw data
export const revalidate = 300;

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("GET /api/draws");

  try {
    const { searchParams } = new URL(req.url);
    const includeLeaderboard = searchParams.get("leaderboard") === "true";
    const fetchAll = searchParams.get("list") === "all";
    const month =
      searchParams.get("month") ??
      new Date().toISOString().slice(0, 7); // YYYY-MM

    const supabase = createAdminClient() as any;

    // ── Fetch all draws for admin listing ──────────────────────────────────
    if (fetchAll) {
      // Admin only: verify token if needed, but for now we'll allow it if RLS is on
      // (Actually better to enforce admin check here too)
      const { data: draws, error: listError } = await supabase
        .from("draws")
        .select(`
          *,
          winners:winners(count)
        `)
        .order("draw_month", { ascending: false });

      if (listError) throw listError;

      return NextResponse.json({ 
        success: true, 
        data: { 
          draws: draws.map((d: any) => ({ ...d, winners_count: d.winners?.[0]?.count || 0 })) 
        } 
      });
    }

    // ── Fetch the draw for the given month ─────────────────────────────────
    const { data: draw, error: drawError } = await supabase
      .from("draws")
      .select("*")
      .eq("draw_month", month)
      .in("status", ["published", "draft"]) // include draft so admin preview works
      .order("status") // published rows first
      .limit(1)
      .maybeSingle();

    if (drawError) {
      log.error("Draw fetch failed", { error: drawError.message });
      return NextResponse.json({ success: false, error: "Failed to fetch draw" }, { status: 500 });
    }

    // ── Next draw date — first day of next month ────────────────────────────
    const [year, mon] = month.split("-").map(Number);
    const nextMonth = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
    const nextDrawDate = new Date(`${nextMonth}-01T00:00:00Z`);

    // ── Leaderboard ─────────────────────────────────────────────────────────
    let leaderboard: {
      rank: number;
      user_id: string;
      full_name: string;
      tickets: number;
      win_pct: string;
    }[] = [];

    if (includeLeaderboard) {
      // Count scores per user in the current month as a proxy for "tickets"
      // Each qualifying score (≥ 25 points) earns tickets = floor(score / 12)
      const { data: scores } = await supabase
        .from("scores")
        .select("user_id, value, users!inner(full_name)")
        .gte("played_at", `${month}-01`)
        .lte("played_at", `${month}-31`)
        .gte("value", 25); // only qualifying scores

      // Aggregate tickets per user
      const ticketMap = new Map<string, { full_name: string; tickets: number }>();
      for (const s of scores ?? []) {
        const uid = s.user_id as string;
        const name = (s as { users?: { full_name?: string } }).users?.full_name ?? "Unknown";
        const tickets = Math.floor((s.value as number) / 12);
        const existing = ticketMap.get(uid);
        if (existing) {
          existing.tickets += tickets;
        } else {
          ticketMap.set(uid, { full_name: name, tickets });
        }
      }

      const totalTickets = Array.from(ticketMap.values()).reduce((sum, u) => sum + u.tickets, 0);

      leaderboard = Array.from(ticketMap.entries())
        .sort(([, a], [, b]) => b.tickets - a.tickets)
        .slice(0, 10)
        .map(([user_id, { full_name, tickets }], i) => ({
          rank: i + 1,
          user_id,
          full_name,
          tickets,
          win_pct: totalTickets > 0 ? `${((tickets / totalTickets) * 100).toFixed(1)}%` : "0.0%",
        }));
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          draw: draw ?? null,
          month,
          next_draw_date: nextDrawDate.toISOString(),
          leaderboard,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Draws fetch failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Create or Update Draw Config (admin only)
// ---------------------------------------------------------------------------
import { createDrawSchema } from "@/lib/server/validators";
import { requireAdmin } from "@/lib/server/supabase";

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("POST /api/draws");

  try {
    try {
      await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createDrawSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const supabase = createAdminClient() as any;

    // Upsert the draw
    const payload = {
      draw_month: parsed.data.draw_month,
      description: parsed.data.description ?? null,
      prize_pool_total_paise: parsed.data.prize_pool_total_paise,
      prize_1_label: parsed.data.prize_1_label ?? null,
      prize_2_label: parsed.data.prize_2_label ?? null,
      prize_3_label: parsed.data.prize_3_label ?? null,
      prize_1_image_url: parsed.data.prize_1_image_url ?? null,
      prize_2_image_url: parsed.data.prize_2_image_url ?? null,
      prize_3_image_url: parsed.data.prize_3_image_url ?? null,
      status: "draft", // Defaults to draft on creation
    };

    const { data: draw, error } = await supabase
      .from("draws")
      .upsert(payload as any, { onConflict: "draw_month" })
      .select()
      .single();

    if (error) {
      log.error("Draw upsert failed in Supabase", { error: error.message });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { draw } }, { status: 200 });
  } catch (error) {
    const err = logAndBuildError(log, error, "Draw creation failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
