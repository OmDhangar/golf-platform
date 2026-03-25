"use client";

import { useSubscriptionRouteGuard } from "@/lib/auth/use-subscription-route-guard";

export default function ScoresPage() {
    const { state } = useSubscriptionRouteGuard();

    if (state === "checking") {
        return <main className="p-8">Checking subscription access…</main>;
    }

    return <main className="p-8 text-2xl font-semibold">Scores</main>;
}
