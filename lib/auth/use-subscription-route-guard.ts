"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SubscriptionStatus } from "@/types";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { getAuthContext, hydrateAuthStore, useClientAuthStore } from "@/lib/auth/store";
import { isActiveSubscription } from "@/lib/auth/subscriptions";

interface DashboardResponse {
    subscription: {
        status: SubscriptionStatus;
        is_active: boolean;
    } | null;
}

type GuardState = "checking" | "authorized";

export function useSubscriptionRouteGuard(): { state: GuardState } {
    const router = useRouter();
    const pathname = usePathname();
    const { tokens } = useClientAuthStore();
    const [state, setState] = useState<GuardState>("checking");

    useEffect(() => {
        hydrateAuthStore();
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function resolveSubscription(): Promise<void> {
            if (!tokens?.access_token) {
                router.replace("/login");
                return;
            }

            const loginContext = getAuthContext();
            if (loginContext) {
                if (loginContext.has_active_subscription || isActiveSubscription(loginContext.subscription_status)) {
                    if (!cancelled) setState("authorized");
                    return;
                }

                router.replace(`/subscribe?from=${encodeURIComponent(pathname || "/dashboard")}`);
                return;
            }

            try {
                const dashboard = await apiFetch<DashboardResponse>("/api/dashboard", {
                    method: "GET",
                    protectedRoute: true,
                    skipRedirect: true,
                });

                if (dashboard.subscription?.is_active || isActiveSubscription(dashboard.subscription?.status)) {
                    if (!cancelled) setState("authorized");
                    return;
                }

                router.replace(`/subscribe?from=${encodeURIComponent(pathname || "/dashboard")}`);
            } catch (error) {
                if (error instanceof ApiClientError && error.status === 401) {
                    router.replace("/login");
                    return;
                }

                if (error instanceof ApiClientError && error.status === 403) {
                    router.replace(`/subscribe?from=${encodeURIComponent(pathname || "/dashboard")}`);
                    return;
                }

                router.replace("/subscribe");
            }
        }

        void resolveSubscription();

        return () => {
            cancelled = true;
        };
    }, [pathname, router, tokens?.access_token]);

    return { state };
}
