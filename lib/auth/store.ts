"use client";

import { useSyncExternalStore } from "react";

const AUTH_STORAGE_KEY = "golf_platform_auth";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthSession extends AuthTokens {
  role: string;
}

interface ClientAuthState {
  session: AuthSession | null;
}

type Listener = () => void;

let state: ClientAuthState = { session: null };
const listeners = new Set<Listener>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function writeStorage(session: AuthSession | null): void {
  if (typeof window === "undefined") return;

  if (!session) {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function readStorage(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>;

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
      role: typeof parsed.role === "string" ? parsed.role : "user",
    };
  } catch {
    return null;
  }
}

export function hydrateAuthStore(): void {
  state = { session: readStorage() };
  notifyListeners();
}

export function setAuthSession(session: AuthSession): void {
  state = { session };
  writeStorage(session);
  notifyListeners();
}

export function setAuthTokens(tokens: AuthTokens): void {
  setAuthSession({ ...tokens, role: "user" });
}

export function clearAuthTokens(): void {
  state = { session: null };
  writeStorage(null);
  notifyListeners();
}

export function getAuthSession(): AuthSession | null {
  if (!state.session) {
    state = { session: readStorage() };
  }

  return state.session;
}

export function getAuthTokens(): AuthTokens | null {
  const session = getAuthSession();
  if (!session) return null;

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };
}

export function getAccessToken(): string | null {
  return getAuthSession()?.access_token ?? null;
}

export function getUserRole(): string | null {
  return getAuthSession()?.role ?? null;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ClientAuthState {
  return state;
}

function getServerSnapshot(): ClientAuthState {
  return { session: null };
}

export function useClientAuthStore(): ClientAuthState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
