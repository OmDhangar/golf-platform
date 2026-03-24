import { apiFetch } from "@/lib/api/client";

export const scores = {
    list(): Promise<unknown> {
        return apiFetch("/api/scores", { method: "GET", protectedRoute: true });
    },

    create(payload: unknown): Promise<unknown> {
        return apiFetch("/api/scores", {
            method: "POST",
            body: payload,
            protectedRoute: true,
        });
    },

    update(payload: unknown): Promise<unknown> {
        return apiFetch("/api/scores", {
            method: "PATCH",
            body: payload,
            protectedRoute: true,
        });
    },
};
