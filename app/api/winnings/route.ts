import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, getUserFromHeader } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
    const log = createRouteLogger("GET /api/winnings");

    try {
        const authHeader = req.headers.get("Authorization");
        const user = await getUserFromHeader(authHeader);

        if (!user) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("winners")
            .select("id, tier, prize_amount_paise, status, proof_url, proof_submitted_at, payout_completed_at, draws(draw_month)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            log.error("Failed to fetch winnings", { userId: user.id, error: error.message });
            return NextResponse.json({ success: false, error: "Failed to fetch winnings" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                winners: (data ?? []).map((winner) => ({
                    id: winner.id,
                    tier: winner.tier,
                    prize_amount_inr: ((winner.prize_amount_paise ?? 0) / 100).toFixed(2),
                    status: winner.status,
                    draw_month: (winner.draws as { draw_month?: string } | null)?.draw_month ?? "—",
                    proof_submitted: !!winner.proof_url,
                    proof_submitted_at: winner.proof_submitted_at,
                    payout_completed_at: winner.payout_completed_at,
                })),
            },
        });
    } catch (error) {
        const err = logAndBuildError(log, error, "Failed to list winnings");
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
