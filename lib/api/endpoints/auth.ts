import { apiFetch } from "@/lib/api/client";
import { setAuthContext, setAuthTokens, type AuthTokens } from "@/lib/auth/store";
import type { SubscriptionStatus } from "@/types";

export interface LoginInput {
    email: string;
    password: string;
}

export interface SignupInput {
    email: string;
    password: string;
    full_name: string;
    plan_type: "monthly" | "yearly";
    charity_id: string;
    charity_percent: number;
}

export interface LoginResponse extends AuthTokens {
    user: unknown;
    subscription: {
        id: string;
        status: SubscriptionStatus;
        plan_type: "monthly" | "yearly";
        renewal_date: string | null;
    } | null;
    has_active_subscription: boolean;

}

export const auth = {
    async login(payload: LoginInput): Promise<LoginResponse> {
        const data = await apiFetch<LoginResponse>("/api/auth/login", {
            method: "POST",
            body: payload,
        });

        setAuthTokens({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at,
        });

        setAuthContext({
            has_active_subscription: data.has_active_subscription,
            subscription_status: data.subscription?.status ?? null,
        });

        return data;
    },

    signup(payload: SignupInput): Promise<unknown> {
        return apiFetch("/api/auth/signup", {
            method: "POST",
            body: payload,
        });
    },

    async adminLogin(payload: LoginInput): Promise<LoginResponse> {
        const data = await apiFetch<LoginResponse>("/api/admin/auth/login", {
            method: "POST",
            body: payload,
        });

        setAuthTokens({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at,
        });

        setAuthContext({
            has_active_subscription: data.has_active_subscription,
            subscription_status: data.subscription?.status ?? null,
        });




        return data;
    },

    adminSignup(payload: SignupInput): Promise<unknown> {
        return apiFetch("/api/admin/auth/signup", {
            method: "POST",
            body: payload,
        });
    },
};
