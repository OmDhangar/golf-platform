import { apiFetch } from "@/lib/api/client";

export const draws = {
    published(): Promise<unknown> {
        return apiFetch("/api/draws/publish", { method: "GET" });
    },

    publish(payload: unknown): Promise<unknown> {
        return apiFetch("/api/draws/publish", {
            method: "POST",
            body: payload,
            protectedRoute: true,
        });
    },

    simulate(payload: unknown): Promise<unknown> {
        return apiFetch("/api/draws/simulate", {
            method: "POST",
            body: payload,
            protectedRoute: true,
        });
    },
};
