import { apiFetch } from "@/lib/api/client";

export interface CreateSubscriptionInput {
    plan_type: "monthly" | "yearly";
    charity_id: string;
    charity_percent: number;
}

export interface CreateSubscriptionResponse {
    subscription_id: string;
    razorpay_subscription_id: string;
    payment_url: string;
    plan: {
        type: "monthly" | "yearly";
        label: string;
        amount_paise: number;
    };
    contributions: {
        prize_pool_paise: number;
        charity_paise: number;
        charity_name: string;
    };
}

export const subscriptions = {
    create(payload: CreateSubscriptionInput): Promise<CreateSubscriptionResponse> {
        return apiFetch<CreateSubscriptionResponse>("/api/subscriptions/create", {
            method: "POST",
            body: payload,
            protectedRoute: true,
        });
    },
};
