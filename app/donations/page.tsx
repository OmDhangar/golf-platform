"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { charities } from "@/lib/api/endpoints/charities";
import {
    donations,
    type CharityContributionPayload,
    type DonationHistoryRow,
    type DonationType,
    type IndependentDonationPayload,
} from "@/lib/api/endpoints/donations";

interface CharityOption {
    id: string;
    name: string;
}

interface CharitiesListResponse {
    charities?: CharityOption[];
}

function formatInrFromPaise(value: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
    }).format(value / 100);
}

function formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function typeBadgeClass(type: DonationType): string {
    return type === "independent"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-blue-100 text-blue-800";
}

export default function DonationsPage() {
    const [charityOptions, setCharityOptions] = useState<CharityOption[]>([]);
    const [history, setHistory] = useState<DonationHistoryRow[]>([]);
    const [totalDonatedInr, setTotalDonatedInr] = useState("0.00");
    const [historyCount, setHistoryCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const [independentForm, setIndependentForm] = useState({
        charity_id: "",
        amount_paise: "",
        notes: "",
    });
    const [settingsForm, setSettingsForm] = useState({
        charity_percent: "10",
        charity_id: "",
    });

    const [submittingIndependent, setSubmittingIndependent] = useState(false);
    const [submittingSettings, setSubmittingSettings] = useState(false);

    async function loadPageData(): Promise<void> {
        try {
            setLoading(true);
            const [historyPayload, charitiesPayload] = await Promise.all([
                donations.list(),
                charities.list() as Promise<CharitiesListResponse>,
            ]);

            const availableCharities = charitiesPayload.charities ?? [];

            setHistory(historyPayload.donations ?? []);
            setTotalDonatedInr(historyPayload.total_donated_inr ?? "0.00");
            setHistoryCount(historyPayload.count ?? 0);
            setCharityOptions(availableCharities);

            if (availableCharities.length > 0) {
                setIndependentForm((prev) => ({
                    ...prev,
                    charity_id: prev.charity_id || availableCharities[0].id,
                }));
            }

            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load donations");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadPageData();
    }, []);

    const donationTotals = useMemo(() => {
        const independentPaise = history
            .filter((row) => row.type === "independent")
            .reduce((sum, row) => sum + row.amount_paise, 0);

        const subscriptionSharePaise = history
            .filter((row) => row.type === "subscription_share")
            .reduce((sum, row) => sum + row.amount_paise, 0);

        return {
            independentPaise,
            subscriptionSharePaise,
        };
    }, [history]);

    async function handleIndependentSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();

        if (!independentForm.charity_id) {
            setError("Please select a charity.");
            return;
        }

        const amountPaise = Number(independentForm.amount_paise);
        if (!Number.isInteger(amountPaise) || amountPaise < 100) {
            setError("Amount must be at least 100 paise (₹1).");
            return;
        }

        const payload: IndependentDonationPayload = {
            charity_id: independentForm.charity_id,
            amount_paise: amountPaise,
        };

        const notes = independentForm.notes.trim();
        if (notes) payload.notes = notes;

        try {
            setSubmittingIndependent(true);
            setError(null);
            const response = await donations.create(payload);

            setMessage(`Donation submitted to ${response.charity_name} (₹${response.amount_inr}).`);
            setIndependentForm((prev) => ({ ...prev, amount_paise: "", notes: "" }));
            await loadPageData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit donation");
        } finally {
            setSubmittingIndependent(false);
        }
    }

    async function handleSettingsSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();

        const charityPercent = Number(settingsForm.charity_percent);
        if (!Number.isFinite(charityPercent) || charityPercent < 10 || charityPercent > 100) {
            setError("Charity percent must be between 10 and 100.");
            return;
        }

        const payload: CharityContributionPayload = {
            charity_percent: charityPercent,
        };

        if (settingsForm.charity_id) {
            payload.charity_id = settingsForm.charity_id;
        }

        try {
            setSubmittingSettings(true);
            setError(null);
            const response = await donations.update(payload);

            setMessage(
                `Charity contribution updated to ${response.charity_percent}%${
                    response.charity_name ? ` for ${response.charity_name}` : ""
                }.`
            );
            await loadPageData();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update charity settings");
        } finally {
            setSubmittingSettings(false);
        }
    }

    return (
        <main className="min-h-screen bg-zinc-50 px-6 py-10 sm:px-10">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                <header>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">Donations</p>
                    <h1 className="text-3xl font-semibold text-zinc-900">Manage contributions and track giving history</h1>
                </header>

                {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p> : null}
                {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">{message}</p> : null}

                <section className="grid gap-4 lg:grid-cols-2">
                    <form onSubmit={handleIndependentSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-zinc-900">Independent donation</h2>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700" htmlFor="ind-charity">Charity</label>
                            <select
                                id="ind-charity"
                                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                                value={independentForm.charity_id}
                                onChange={(event) => setIndependentForm((prev) => ({ ...prev, charity_id: event.target.value }))}
                            >
                                <option value="">Select charity</option>
                                {charityOptions.map((charity) => (
                                    <option key={charity.id} value={charity.id}>{charity.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700" htmlFor="amount-paise">Amount (paise)</label>
                            <input
                                id="amount-paise"
                                type="number"
                                min={100}
                                step={1}
                                value={independentForm.amount_paise}
                                onChange={(event) => setIndependentForm((prev) => ({ ...prev, amount_paise: event.target.value }))}
                                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                                placeholder="e.g. 5000"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700" htmlFor="ind-notes">Notes (optional)</label>
                            <textarea
                                id="ind-notes"
                                value={independentForm.notes}
                                onChange={(event) => setIndependentForm((prev) => ({ ...prev, notes: event.target.value }))}
                                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                                rows={3}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submittingIndependent}
                            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            {submittingIndependent ? "Submitting..." : "POST /api/donations"}
                        </button>
                    </form>

                    <form onSubmit={handleSettingsSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-zinc-900">Charity contribution settings</h2>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700" htmlFor="charity-percent">Charity percent</label>
                            <input
                                id="charity-percent"
                                type="number"
                                min={10}
                                max={100}
                                step={1}
                                value={settingsForm.charity_percent}
                                onChange={(event) => setSettingsForm((prev) => ({ ...prev, charity_percent: event.target.value }))}
                                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700" htmlFor="settings-charity">New charity (optional)</label>
                            <select
                                id="settings-charity"
                                className="w-full rounded-xl border border-zinc-300 px-3 py-2"
                                value={settingsForm.charity_id}
                                onChange={(event) => setSettingsForm((prev) => ({ ...prev, charity_id: event.target.value }))}
                            >
                                <option value="">Keep current charity</option>
                                {charityOptions.map((charity) => (
                                    <option key={charity.id} value={charity.id}>{charity.name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={submittingSettings}
                            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            {submittingSettings ? "Saving..." : "PATCH /api/donations"}
                        </button>
                    </form>
                </section>

                <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-zinc-900">Donation history (GET /api/donations)</h2>
                        <p className="text-sm text-zinc-600">{historyCount} records</p>
                    </div>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg bg-zinc-50 p-3">
                            <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">Total donated</dt>
                            <dd className="mt-1 text-lg font-semibold text-zinc-900">₹{totalDonatedInr}</dd>
                        </div>
                        <div className="rounded-lg bg-zinc-50 p-3">
                            <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">Independent total</dt>
                            <dd className="mt-1 text-lg font-semibold text-zinc-900">{formatInrFromPaise(donationTotals.independentPaise)}</dd>
                        </div>
                        <div className="rounded-lg bg-zinc-50 p-3">
                            <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">Subscription share total</dt>
                            <dd className="mt-1 text-lg font-semibold text-zinc-900">{formatInrFromPaise(donationTotals.subscriptionSharePaise)}</dd>
                        </div>
                    </dl>

                    {loading ? (
                        <p className="mt-4 text-sm text-zinc-500">Loading history...</p>
                    ) : history.length === 0 ? (
                        <p className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-500">
                            No donations yet. Your first contribution will appear here.
                        </p>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                                    <tr>
                                        <th className="pb-2 pr-3">Date</th>
                                        <th className="pb-2 pr-3">Charity</th>
                                        <th className="pb-2 pr-3">Type</th>
                                        <th className="pb-2 pr-3">Amount</th>
                                        <th className="pb-2">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                                    {history.map((row) => (
                                        <tr key={row.id}>
                                            <td className="py-2 pr-3 whitespace-nowrap">{formatDate(row.created_at)}</td>
                                            <td className="py-2 pr-3">{row.charities?.name ?? "Unknown charity"}</td>
                                            <td className="py-2 pr-3">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${typeBadgeClass(row.type)}`}>
                                                    {row.type}
                                                </span>
                                            </td>
                                            <td className="py-2 pr-3">₹{row.amount_inr}</td>
                                            <td className="py-2">{row.notes || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
