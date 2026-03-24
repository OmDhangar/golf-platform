import { apiFetch } from "@/lib/api/client";
import { setAuthTokens, type AuthTokens } from "@/lib/auth/store";

export interface LoginInput {
    email: string;
    password: string;
}

export interface SignupInput {
    email: string;
    password: string;
    full_name: string;
}

export interface LoginResponse extends AuthTokens {
    user: unknown;
    subscription: unknown;
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

        return data;
    },

    adminSignup(payload: SignupInput): Promise<unknown> {
        return apiFetch("/api/admin/auth/signup", {
            method: "POST",
            body: payload,
        });
    },
};
