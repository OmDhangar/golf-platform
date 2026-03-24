import { apiFetch } from "@/lib/api/client";

export interface CreateSubscriptionInput {
    plan_type: "monthly" | "yearly";
    charity_id: string;
    charity_percent: number;
}

export const subscriptions = {
    create(payload: CreateSubscriptionInput): Promise<unknown> {
        return apiFetch("/api/subscriptions/create", {
            method: "POST",
            body: payload,
            protectedRoute: true,
        });
    },
};
