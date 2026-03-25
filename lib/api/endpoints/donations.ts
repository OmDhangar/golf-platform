import { apiFetch } from "@/lib/api/client";

export type DonationType = "independent" | "subscription_share";

export interface DonationHistoryRow {
    id: string;
    charity_id: string;
    amount_paise: number;
    amount_inr: string;
    type: DonationType;
    notes: string | null;
    created_at: string;
    charities?: {
        name?: string | null;
        logo_url?: string | null;
    } | null;
}

export interface DonationHistoryResponse {
    donations: DonationHistoryRow[];
    total_donated_inr: string;
    count: number;
}

export interface IndependentDonationPayload {
    charity_id: string;
    amount_paise: number;
    notes?: string;
}

export interface CharityContributionPayload {
    charity_percent: number;
    charity_id?: string;
}

export interface IndependentDonationResponse {
    donation_id: string;
    charity_name: string;
    amount_inr: string;
    type: "independent";
}

export interface CharityContributionResponse {
    charity_percent: number;
    charity_id: string | null;
    charity_name?: string;
}

export const donations = {
    list(): Promise<DonationHistoryResponse> {
        return apiFetch<DonationHistoryResponse>("/api/donations", {
            method: "GET",
            protectedRoute: true,
        });
    },


    create(payload: IndependentDonationPayload): Promise<IndependentDonationResponse> {
        return apiFetch<IndependentDonationResponse>("/api/donations", {
            method: "POST",
            body: payload,
            protectedRoute: true,
        });
    },

    update(payload: CharityContributionPayload): Promise<CharityContributionResponse> {
        return apiFetch<CharityContributionResponse>("/api/donations", {
            method: "PATCH",
            body: payload,
            protectedRoute: true,
        });
    },
};
