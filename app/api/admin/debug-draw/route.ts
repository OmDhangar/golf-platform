/**
 * Debug endpoint for draw winners issue
 * TEMPORARY - Remove after fixing the issue
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import { matchScores } from "@/lib/server/drawEngine";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const log = createRouteLogger("GET /api/admin/debug-draw");

  try {
    // Require admin
    try {
      await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Get latest published draw
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (drawError || !draw) {
      return NextResponse.json({ success: false, error: "No published draw found" }, { status: 404 });
    }

    // Get all active subscribers with scores
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        subscriptions!inner(status),
        scores(value, created_at)
      `)
      .eq('subscriptions.status', 'active');

    if (usersError) {
      return NextResponse.json({ success: false, error: usersError.message }, { status: 500 });
    }

    // Analyze each user
    const winningNumbers = (draw as any).winning_numbers;
    const analysis = [];

    for (const user of (users as any[]) || []) {
      const latestScores = ((user.scores as any[]) || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((s: any) => s.value);

      const qualified = latestScores.length >= 3;
      const { tier, matched } = qualified ? matchScores(latestScores, winningNumbers) : { tier: null, matched: [] };

      analysis.push({
        userId: user.id,
        email: user.email,
        totalScores: user.scores?.length || 0,
        latestScores,
        qualified,
        matchedNumbers: matched,
        matchCount: matched.length,
        winnerTier: tier
      });
    }

    // Get winners from database
    const { data: winners, error: winnersError } = await supabase
      .from('winners')
      .select('*')
      .eq('draw_id', (draw as any).id);

    return NextResponse.json({
      success: true,
      data: {
        draw: {
          id: (draw as any).id,
          month: (draw as any).draw_month,
          winningNumbers: (draw as any).winning_numbers,
          activeSubscriberCount: (draw as any).active_subscriber_count
        },
        userAnalysis: analysis,
        databaseWinners: winners || [],
        summary: {
          totalActiveUsers: users?.length || 0,
          qualifiedUsers: analysis.filter(u => u.qualified).length,
          usersWithMatches: analysis.filter(u => u.matchCount > 0).length,
          actualWinners: winners?.length || 0
        }
      }
    });
  } catch (error) {
    const err = logAndBuildError(log, error, "Debug draw failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
