import { apiFetch } from "@/lib/api/client";

export interface ScoreItem {
    id: string;
    value: number;
    played_at: string;
    course_name: string | null;
    created_at: string;
}

export interface ScoresListResponse {
    scores: ScoreItem[];
    count: number;
    max_allowed: number;
}

export interface ScoreCreateInput {
    value: number;
    played_at: string;
    course_name?: string;
}

export interface ScoreUpdateInput extends ScoreCreateInput {
    score_id: string;
}

interface ScoreRequestOptions {
    skipRedirect?: boolean;
}

export const scores = {
    list(options: ScoreRequestOptions = {}): Promise<ScoresListResponse> {
        return apiFetch<ScoresListResponse>("/api/scores", {
            method: "GET",
            protectedRoute: true,
            skipRedirect: options.skipRedirect,
        });
    },

    create(payload: ScoreCreateInput, options: ScoreRequestOptions = {}): Promise<unknown> {
        return apiFetch("/api/scores", {
            method: "POST",
            body: payload,
            protectedRoute: true,
            skipRedirect: options.skipRedirect,
        });
    },

    update(payload: ScoreUpdateInput, options: ScoreRequestOptions = {}): Promise<unknown> {
        return apiFetch("/api/scores", {
            method: "PATCH",
            body: payload,
            protectedRoute: true,
            skipRedirect: options.skipRedirect,
        });
    },
};
