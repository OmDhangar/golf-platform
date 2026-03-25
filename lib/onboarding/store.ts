"use client";

const ONBOARDING_STORAGE_KEY = "golf_platform_onboarding";

export interface OnboardingState {
    email: string;
    plan_type: "free" | "monthly" | "yearly";
    charity_id: string;
    charity_percent: number;
    created_at: string;
}

export function saveOnboardingState(
    state: Omit<OnboardingState, "created_at">
): void {
    if (typeof window === "undefined") return;

    const payload: OnboardingState = {
        ...state,
        created_at: new Date().toISOString(),
    };

    sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
}

export function getOnboardingState(): OnboardingState | null {
    if (typeof window === "undefined") return null;

    const stored = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) return null;

    try {
        return JSON.parse(stored) as OnboardingState;
    } catch (err) {
        console.error("Failed to parse onboarding state:", err);
        return null;
    }
}
