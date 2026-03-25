import { apiFetch } from "@/lib/api/client";

export interface DashboardSubscription {
    id: string;
    status: string;
    plan_type: "monthly" | "yearly";
    is_active: boolean;
    current_period_start: string | null;
    renewal_date: string | null;
    prize_pool_contribution_inr: string;
    charity_contribution_inr: string;
}

export interface DashboardScore {
    id: string;
    value: number;
    played_at: string;
    course_name: string | null;
    created_at: string;
}

export interface DashboardCharity {
    selected: {
        id: string;
        name: string;
        description: string;
        logo_url: string | null;
        is_featured: boolean;
    } | null;
    contribution_percent: number;
    min_percent: number;
}

export interface DashboardDrawRow {
    draw_id: string;
    draw_month: string;
    status: "draft" | "published" | "simulation";
    winning_numbers: number[] | null;
    prize_pool_total_inr: string | null;
    published_at: string | null;
    user_won: boolean;
    winner_tier: string | null;
    prize_amount_inr: string | null;
    winner_status: string | null;
}

export interface DashboardWinningsRow {
    id: string;
    tier: string;
    prize_amount_inr: string;
    status: string;
    draw_month: string;
    proof_submitted: boolean;
    proof_submitted_at: string | null;
    payout_completed_at: string | null;
}

export interface DashboardResponse {
    subscription: DashboardSubscription | null;
    scores: DashboardScore[];
    scores_count: number;
    scores_max: number;
    charity: DashboardCharity | null;
    participations: {
        total_draws_participated: number;
        draws: DashboardDrawRow[];
        upcoming_draw: {
            draw_month: string;
            message: string;
        } | null;
    };
    winnings: {
        total_won_paise: number;
        total_won_inr: string;
        paid_out_paise: number;
        paid_out_inr: string;
        pending_paise: number;
        pending_inr: string;
        winners: DashboardWinningsRow[];
    };
    user: {
        id: string;
        email: string;
        full_name: string;
        role: string;
        charity_id: string | null;
        charity_percent: number;
        created_at: string;
    };
}

export const dashboard = {
    get(): Promise<DashboardResponse> {
        return apiFetch<DashboardResponse>("/api/dashboard", {
            method: "GET",
            protectedRoute: true,
        });
    },
};
