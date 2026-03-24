import { apiFetch } from "@/lib/api/client";

export const donations = {
    list(): Promise<unknown> {
        return apiFetch("/api/donations", { method: "GET", protectedRoute: true });
    },

    create(payload: unknown): Promise<unknown> {
        return apiFetch("/api/donations", {
            method: "POST",
            body: payload,
            protectedRoute: true,
        });
    },

    update(payload: unknown): Promise<unknown> {
        return apiFetch("/api/donations", {
            method: "PATCH",
            body: payload,
            protectedRoute: true,
        });
    },
};
