"use client";
import { useSyncExternalStore } from "react";
import type { SubscriptionStatus } from "@/types";

const AUTH_STORAGE_KEY = "golf_platform_auth";
const AUTH_CONTEXT_KEY = "golf_platform_auth_context";

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

export interface AuthContext {
    has_active_subscription: boolean;
    subscription_status: SubscriptionStatus | null;
}


interface ClientAuthState {
    tokens: AuthTokens | null;
    context: AuthContext | null;
}

type Listener = () => void;

let state: ClientAuthState = { tokens: null, context: null };
const listeners = new Set<Listener>();

function notifyListeners(): void {
    listeners.forEach((listener) => listener());
}

function writeStorage(tokens: AuthTokens | null): void {
    if (typeof window === "undefined") return;

    if (!tokens) {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return;
    }

    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
}

function writeContextStorage(context: AuthContext | null): void {
    if (typeof window === "undefined") return;

    if (!context) {
        sessionStorage.removeItem(AUTH_CONTEXT_KEY);
        return;
    }

    sessionStorage.setItem(AUTH_CONTEXT_KEY, JSON.stringify(context));
}

function readStorage(): AuthTokens | null {
    if (typeof window === "undefined") return null;

    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as Partial<AuthTokens>;

        if (
            typeof parsed.access_token !== "string" ||
            typeof parsed.refresh_token !== "string" ||
            typeof parsed.expires_at !== "number"
        ) {
            return null;
        }

        return {
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
            expires_at: parsed.expires_at,
        };
    } catch {
        return null;
    }
}
function readContextStorage(): AuthContext | null {
    if (typeof window === "undefined") return null;

    const raw = sessionStorage.getItem(AUTH_CONTEXT_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as Partial<AuthContext>;

        if (
            typeof parsed.has_active_subscription !== "boolean" ||
            (parsed.subscription_status !== null && typeof parsed.subscription_status !== "string")
        ) {
            return null;
        }

        return {
            has_active_subscription: parsed.has_active_subscription,
            subscription_status: parsed.subscription_status as SubscriptionStatus | null,
        };
    } catch {
        return null;
    }
}

export function hydrateAuthStore(): void {
    state = {
        tokens: readStorage(),
        context: readContextStorage(),
    };
    notifyListeners();
}

export function setAuthTokens(tokens: AuthTokens): void {
    state = { ...state, tokens };
    writeStorage(tokens);
    notifyListeners();
}

export function setAuthContext(context: AuthContext): void {
    state = { ...state, context };
    writeContextStorage(context);
    notifyListeners();
}


export function clearAuthTokens(): void {
    state = { tokens: null, context: null };
    writeStorage(null);
    notifyListeners();
}

export function getAuthTokens(): AuthTokens | null {
    if (!state.tokens) {
        state = { ...state, tokens: readStorage() };
    }

    return state.tokens;
}

export function getAuthContext(): AuthContext | null {
    if (!state.context) {
        state = { ...state, context: readContextStorage() };
    }

    return state.context;
}

export function getAccessToken(): string | null {
    const tokens = getAuthTokens();
    return tokens?.access_token ?? null;
}

function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): ClientAuthState {
    return state;
}

function getServerSnapshot(): ClientAuthState {
    return { tokens: null, context: null };
}

export function useClientAuthStore(): ClientAuthState {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
