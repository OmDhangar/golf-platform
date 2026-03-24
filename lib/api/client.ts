"use client";

import { getAccessToken } from "@/lib/auth/store";

export interface ApiEnvelope<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    details?: unknown;
    code?: string;
}

export class ApiClientError extends Error {
    status: number;
    code?: string;
    details?: unknown;

    constructor(message: string, status: number, code?: string, details?: unknown) {
        super(message);
        this.name = "ApiClientError";
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
    body?: unknown;
    protectedRoute?: boolean;
    skipRedirect?: boolean;
}

function maybeRedirect(url: string, skipRedirect: boolean): void {
    if (skipRedirect || typeof window === "undefined") return;
    window.location.assign(url);
}

function isAdminAccessError(envelope: ApiEnvelope | null): boolean {
    if (!envelope) return false;

    if (envelope.code === "ADMIN_ACCESS_REQUIRED") return true;

    const errorMessage = (envelope.error ?? "").toLowerCase();
    return errorMessage.includes("admin access required");
}

export async function apiFetch<T>(
    input: string,
    options: ApiFetchOptions = {}
): Promise<T> {
    const { protectedRoute = false, skipRedirect = false, headers, body, ...rest } = options;

    const mergedHeaders = new Headers(headers);

    if (!mergedHeaders.has("Content-Type") && body !== undefined) {
        mergedHeaders.set("Content-Type", "application/json");
    }

    if (protectedRoute) {
        const token = getAccessToken();

        if (!token) {
            maybeRedirect("/login", skipRedirect);
            throw new ApiClientError("Authentication required", 401);
        }

        mergedHeaders.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(input, {
        ...rest,
        headers: mergedHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    let envelope: ApiEnvelope<T> | null = null;

    try {
        envelope = (await response.json()) as ApiEnvelope<T>;
    } catch {
        if (!response.ok) {
            throw new ApiClientError("Request failed", response.status);
        }

        throw new ApiClientError("Invalid server response", response.status);
    }

    if (response.status === 401) {
        maybeRedirect("/login", skipRedirect);
    }

    if (response.status === 403) {
        if (envelope.code === "SUBSCRIPTION_REQUIRED") {
            maybeRedirect("/subscribe", skipRedirect);
        } else if (isAdminAccessError(envelope)) {
            maybeRedirect("/unauthorized", skipRedirect);
        }
    }

    if (!response.ok || !envelope.success) {
        throw new ApiClientError(
            envelope.error ?? "Request failed",
            response.status,
            envelope.code,
            envelope.details
        );
    }

    return envelope.data as T;
}
