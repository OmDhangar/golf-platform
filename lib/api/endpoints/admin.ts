import { apiFetch } from "@/lib/api/client";

interface ReportParams {
  include?: string[];
}

export const admin = {
  reports(params?: ReportParams): Promise<unknown> {
    const search = new URLSearchParams();

    params?.include?.forEach((section) => search.append("include", section));

    const query = search.toString();
    const url = query ? `/api/admin/reports?${query}` : "/api/admin/reports";

    return apiFetch(url, { method: "GET", protectedRoute: true });
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

  cancelSubscription(id: string): Promise<unknown> {
    return apiFetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      protectedRoute: true,
    });
  },

  createCharity(payload: unknown): Promise<unknown> {
    return apiFetch("/api/charities", { method: "POST", body: payload, protectedRoute: true });
  },

  updateCharity(payload: unknown): Promise<unknown> {
    return apiFetch("/api/charities", { method: "PATCH", body: payload, protectedRoute: true });
  },

  deleteCharity(id: string): Promise<unknown> {
    return apiFetch(`/api/charities?id=${encodeURIComponent(id)}`, { method: "DELETE", protectedRoute: true });
  },

  listCharities(search?: string): Promise<unknown> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiFetch(`/api/charities${query}`, { method: "GET", protectedRoute: true });
  },

  simulateDraw(payload: unknown): Promise<unknown> {
    return apiFetch("/api/draws/simulate", { method: "POST", body: payload, protectedRoute: true });
  },

  publishDraw(payload: unknown): Promise<unknown> {
    return apiFetch("/api/draws/publish", { method: "POST", body: payload, protectedRoute: true });
  },

  reviewWinner(payload: unknown): Promise<unknown> {
    return apiFetch("/api/winners/upload-proof", { method: "PATCH", body: payload, protectedRoute: true });
  },

  markWinnerPaid(payload: unknown): Promise<unknown> {
    return apiFetch("/api/winners/upload-proof", { method: "PUT", body: payload, protectedRoute: true });
  },
};
