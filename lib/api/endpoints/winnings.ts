import { apiFetch } from "@/lib/api/client";

export type WinnerStatus = "pending" | "proof_submitted" | "approved" | "rejected" | "paid";

export interface WinningsEntry {
    id: string;
    tier: string;
    prize_amount_inr: string;
    status: WinnerStatus;
    draw_month: string;
    proof_submitted: boolean;
    proof_submitted_at: string | null;
    payout_completed_at: string | null;
}

export interface UploadProofPayload {
    winner_id: string;
    proof_url: string;
    notes?: string;
}

interface WinningsResponse {
    winners: WinningsEntry[];
}

interface UploadProofResponse {
    winner_id: string;
    status: WinnerStatus;
    proof_url: string;
    message: string;
}

export const winnings = {
    async list(): Promise<WinningsEntry[]> {
        const payload = await apiFetch<WinningsResponse>("/api/winnings", {
            method: "GET",
            protectedRoute: true,
        });

        return payload.winners;
    },

    uploadProof(body: UploadProofPayload): Promise<UploadProofResponse> {
        return apiFetch<UploadProofResponse>("/api/winners/upload-proof", {
            method: "POST",
            protectedRoute: true,
            body,
        });
    },
};
