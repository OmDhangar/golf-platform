"use client";

const ONBOARDING_STORAGE_KEY = "golf_platform_onboarding";

export interface OnboardingState {
    email: string;
    plan_type: "monthly" | "yearly";
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
