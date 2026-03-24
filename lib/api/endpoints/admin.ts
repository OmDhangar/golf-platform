import { apiFetch } from "@/lib/api/client";

export const admin = {
    reports(): Promise<unknown> {
        return apiFetch("/api/admin/reports", { method: "GET", protectedRoute: true });
    },

    users(params?: Record<string, string | number | undefined>): Promise<unknown> {
        const search = new URLSearchParams();

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) search.set(key, String(value));
            });
        }

        const query = search.toString();
        const url = query ? `/api/admin/users?${query}` : "/api/admin/users";

        return apiFetch(url, { method: "GET", protectedRoute: true });
    },

    updateUser(payload: unknown): Promise<unknown> {
        return apiFetch("/api/admin/users", {
            method: "PATCH",
            body: payload,
            protectedRoute: true,
        });
    },

    deleteUser(id: string): Promise<unknown> {
        return apiFetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
            protectedRoute: true,
        });
    },
};
