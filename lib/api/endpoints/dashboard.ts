import { apiFetch } from "@/lib/api/client";

export const dashboard = {
    get(): Promise<unknown> {
        return apiFetch("/api/dashboard", { method: "GET", protectedRoute: true });
    },
};
