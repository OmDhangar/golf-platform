import { apiFetch } from "@/lib/api/client";

export const charities = {
    list(): Promise<unknown> {
        return apiFetch("/api/charities", { method: "GET" });
    },

    create(payload: unknown): Promise<unknown> {
        return apiFetch("/api/charities", {
            method: "POST",
            body: payload,
            protectedRoute: true,
        });
    },

    update(payload: unknown): Promise<unknown> {
        return apiFetch("/api/charities", {
            method: "PATCH",
            body: payload,
            protectedRoute: true,
        });
    },

    remove(id: string): Promise<unknown> {
        return apiFetch(`/api/charities?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
            protectedRoute: true,
        });
    },
};
