"use client";

import { useSyncExternalStore } from "react";

const AUTH_STORAGE_KEY = "golf_platform_auth";

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

interface ClientAuthState {
    tokens: AuthTokens | null;
}

type Listener = () => void;

let state: ClientAuthState = { tokens: null };
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

export function hydrateAuthStore(): void {
    state = { tokens: readStorage() };
    notifyListeners();
}

export function setAuthTokens(tokens: AuthTokens): void {
    state = { tokens };
    writeStorage(tokens);
    notifyListeners();
}

export function clearAuthTokens(): void {
    state = { tokens: null };
    writeStorage(null);
    notifyListeners();
}

export function getAuthTokens(): AuthTokens | null {
    if (!state.tokens) {
        state = { tokens: readStorage() };
    }

    return state.tokens;
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
    return { tokens: null };
}

export function useClientAuthStore(): ClientAuthState {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
