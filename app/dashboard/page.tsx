"use client";

import { useEffect, useMemo, useState } from "react";
import { dashboard, type DashboardResponse } from "@/lib/api/endpoints/dashboard";

function formatInr(value: string | number): string {
    const amount = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(amount)) return "₹0";

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(value: string | null): string {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString();
}

function formatMonth(month: string): string {
    const parsed = new Date(`${month}-01T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return month;
    return parsed.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}

function DashboardSkeleton() {
    return (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className="h-52 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100"
                />
            ))}
        </section>
    );
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadDashboard(): Promise<void> {
            try {
                setLoading(true);
                const payload = await dashboard.get();
                if (!active) return;
                setData(payload);
                setError(null);
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : "Failed to load dashboard");
            } finally {
                if (!active) return;
                setLoading(false);
            }
        }

        void loadDashboard();

        return () => {
            active = false;
        };
    }, []);

    const latestScores = useMemo(() => data?.scores ?? [], [data]);
    const winnerRows = useMemo(() => data?.winnings.winners ?? [], [data]);

    return (
        <main className="min-h-screen bg-zinc-50 px-6 py-10 sm:px-10">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                <header>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">Member dashboard</p>
                    <h1 className="text-3xl font-semibold text-zinc-900">Your golf + giving overview</h1>
                </header>

                {loading ? (
                    <DashboardSkeleton />
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                        Unable to load dashboard data: {error}
                    </div>
                ) : data ? (
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Subscription</p>
                            <p className="mt-3 text-xl font-semibold text-zinc-900">
                                {data.subscription?.is_active ? "Active" : "Inactive"}
                            </p>
                            <p className="mt-2 text-sm text-zinc-600">
                                Renewal: {formatDate(data.subscription?.renewal_date ?? null)}
                            </p>
                            <p className="mt-1 text-sm text-zinc-600">
                                Plan: {data.subscription?.plan_type ?? "No active plan"}
                            </p>
                        </article>

                        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Latest 5 scores</p>
                            {latestScores.length > 0 ? (
                                <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                                    {latestScores.map((score) => (
                                        <li
                                            key={score.id}
                                            className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2"
                                        >
                                            <span>{score.course_name ?? "Course not set"}</span>
                                            <span className="font-semibold">{score.value}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-500">
                                    No scores yet. Add your first round to start your trend.
                                </p>
                            )}
                        </article>

                        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Charity contribution</p>
                            {data.charity?.selected ? (
                                <>
                                    <p className="mt-3 text-lg font-semibold text-zinc-900">{data.charity.selected.name}</p>
                                    <p className="mt-2 text-sm text-zinc-600">
                                        Contribution percentage: {data.charity.contribution_percent}%
                                    </p>
                                </>
                            ) : (
                                <p className="mt-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-500">
                                    No charity selected yet. Choose one to direct your contributions.
                                </p>
                            )}
                        </article>

                        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Draw participation</p>
                            <p className="mt-3 text-2xl font-semibold text-zinc-900">
                                {data.participations.total_draws_participated}
                            </p>
                            <p className="text-sm text-zinc-600">Published draws participated</p>
                            <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
                                {data.participations.upcoming_draw ? (
                                    <>
                                        <p className="font-semibold">Upcoming: {formatMonth(data.participations.upcoming_draw.draw_month)}</p>
                                        <p className="text-zinc-600">{data.participations.upcoming_draw.message}</p>
                                    </>
                                ) : (
                                    <p className="text-zinc-500">No upcoming draw announced yet.</p>
                                )}
                            </div>
                        </article>

                        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:col-span-2 xl:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Winnings overview</p>
                            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-lg bg-zinc-50 p-3">
                                    <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">Total</dt>
                                    <dd className="text-lg font-semibold text-zinc-900">{formatInr(data.winnings.total_won_inr)}</dd>
                                </div>
                                <div className="rounded-lg bg-zinc-50 p-3">
                                    <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">Paid</dt>
                                    <dd className="text-lg font-semibold text-emerald-700">{formatInr(data.winnings.paid_out_inr)}</dd>
                                </div>
                                <div className="rounded-lg bg-zinc-50 p-3">
                                    <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">Pending</dt>
                                    <dd className="text-lg font-semibold text-amber-700">{formatInr(data.winnings.pending_inr)}</dd>
                                </div>
                            </dl>

                            {winnerRows.length > 0 ? (
                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                                            <tr>
                                                <th className="pb-2 pr-3">Draw</th>
                                                <th className="pb-2 pr-3">Tier</th>
                                                <th className="pb-2 pr-3">Amount</th>
                                                <th className="pb-2">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 text-zinc-700">
                                            {winnerRows.map((row) => (
                                                <tr key={row.id}>
                                                    <td className="py-2 pr-3">{formatMonth(row.draw_month)}</td>
                                                    <td className="py-2 pr-3">{row.tier}</td>
                                                    <td className="py-2 pr-3">{formatInr(row.prize_amount_inr)}</td>
                                                    <td className="py-2 capitalize">{row.status.replaceAll("_", " ")}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-500">
                                    No winnings yet. Keep entering draws to qualify.
                                </p>
                            )}
                        </article>
                    </section>
                ) : null}
            </div>
        </main>
    );
}
