"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SubscriptionStatusBadge } from "@/components/subscription-status-badge";
import type { SubscriptionStatus } from "@/types";
import { apiFetch, ApiClientError } from "@/lib/api/client";

interface DashboardResponse {
    subscription: {
        status: SubscriptionStatus;
        renewal_date: string | null;
    } | null;
}

export default function SubscribePage() {
    const [status, setStatus] = useState<SubscriptionStatus | null>("created");

    useEffect(() => {
        async function loadStatus() {
            try {
                const dashboard = await apiFetch<DashboardResponse>("/api/dashboard", {
                    method: "GET",
                    protectedRoute: true,
                    skipRedirect: true,
                });

                setStatus(dashboard.subscription?.status ?? "created");
            } catch (error) {
                if (error instanceof ApiClientError && error.status === 401) {
                    setStatus("created");
                    return;
                }

                setStatus("expired");
            }
        }

        void loadStatus();
    }, []);

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
            <h1 className="text-3xl font-bold">Subscription required</h1>
            <p className="text-zinc-600">
                Your account needs an active subscription before you can access dashboard tools.
            </p>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-medium text-zinc-500">Current subscription status</p>
                <SubscriptionStatusBadge status={status} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <Link
                    href="/payment/pending"
                    className="rounded-lg bg-black px-4 py-3 text-center font-semibold text-white"
                >
                    Start subscription checkout
                </Link>
                <Link
                    href="/payment/success"
                    className="rounded-lg border border-zinc-300 px-4 py-3 text-center font-semibold"
                >
                    I already paid
                </Link>
            </div>

            <p className="text-xs text-zinc-500">
                Supported lifecycle states: <strong>created</strong>, <strong>active</strong>, <strong>paused</strong>, <strong>cancelled</strong>, and <strong>expired</strong>.
            </p>
        </main>
    );
}
