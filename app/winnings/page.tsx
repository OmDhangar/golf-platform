"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { winnings, type WinnerStatus, type WinningsEntry } from "@/lib/api/endpoints/winnings";

interface ProofFormState {
    winner_id: string;
    proof_url: string;
    notes: string;
}

const statusOrder: WinnerStatus[] = ["pending", "proof_submitted", "approved", "paid"];

const statusChipStyles: Record<WinnerStatus, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    proof_submitted: "bg-blue-100 text-blue-800 border-blue-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-rose-100 text-rose-800 border-rose-200",
    paid: "bg-violet-100 text-violet-800 border-violet-200",
};

function formatInr(value: string): string {
    const amount = Number(value);
    if (Number.isNaN(amount)) return "₹0";

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(amount);
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

function formatDate(value: string | null): string {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString();
}

function statusLabel(status: WinnerStatus): string {
    return status.replaceAll("_", " ");
}

function payoutMessage(status: WinnerStatus): string {
    switch (status) {
        case "pending":
            return "Awaiting proof upload. Submit your score proof to move this payout ahead.";
        case "proof_submitted":
            return "Proof submitted. Our admin team is reviewing it now.";
        case "approved":
            return "Approved for payout. Transfer is being processed.";
        case "rejected":
            return "Proof was rejected. Please contact support or wait for admin guidance.";
        case "paid":
            return "Payout completed. Funds have been marked as paid.";
        default:
            return "Status unavailable.";
    }
}

function Timeline({ status }: { status: WinnerStatus }) {
    if (status === "rejected") {
        return (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                <span className="rounded-full border px-3 py-1 bg-zinc-100 text-zinc-700 border-zinc-200">pending</span>
                <span className="rounded-full border px-3 py-1 bg-zinc-100 text-zinc-700 border-zinc-200">proof submitted</span>
                <span className="rounded-full border px-3 py-1 bg-rose-100 text-rose-800 border-rose-200">rejected</span>
            </div>
        );
    }

    const activeIndex = statusOrder.indexOf(status);

    return (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
            {statusOrder.map((step, index) => {
                const active = activeIndex >= index;
                return (
                    <span
                        key={step}
                        className={`rounded-full border px-3 py-1 capitalize ${
                            active
                                ? "bg-zinc-900 text-white border-zinc-900"
                                : "bg-zinc-100 text-zinc-500 border-zinc-200"
                        }`}
                    >
                        {statusLabel(step)}
                    </span>
                );
            })}
        </div>
    );
}

export default function WinningsPage() {
    const [rows, setRows] = useState<WinningsEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [formState, setFormState] = useState<Record<string, ProofFormState>>({});
    const [submittingId, setSubmittingId] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadRows(): Promise<void> {
            try {
                setLoading(true);
                const winners = await winnings.list();
                if (!active) return;

                setRows(winners);
                setError(null);
                setFormState(
                    winners.reduce<Record<string, ProofFormState>>((acc, winner) => {
                        acc[winner.id] = { winner_id: winner.id, proof_url: "", notes: "" };
                        return acc;
                    }, {})
                );
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : "Failed to load winnings");
            } finally {
                if (!active) return;
                setLoading(false);
            }
        }

        void loadRows();

        return () => {
            active = false;
        };
    }, []);

    const hasRows = useMemo(() => rows.length > 0, [rows]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>, winnerId: string): Promise<void> {
        event.preventDefault();
        const payload = formState[winnerId];

        if (!payload?.proof_url) {
            setError("Proof URL is required for pending winners.");
            return;
        }

        try {
            setSubmittingId(winnerId);
            setError(null);
            setSuccess(null);

            const result = await winnings.uploadProof({
                winner_id: payload.winner_id,
                proof_url: payload.proof_url,
                notes: payload.notes.trim() || undefined,
            });

            setRows((previous) =>
                previous.map((row) =>
                    row.id === winnerId
                        ? {
                              ...row,
                              status: result.status,
                              proof_submitted: true,
                              proof_submitted_at: new Date().toISOString(),
                          }
                        : row
                )
            );
            setSuccess(`Proof submitted for winner ${winnerId}.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit proof");
        } finally {
            setSubmittingId(null);
        }
    }

    return (
        <main className="min-h-screen bg-zinc-50 px-6 py-10 sm:px-10">
            <div className="mx-auto w-full max-w-6xl space-y-6">
                <header>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">Member winnings</p>
                    <h1 className="text-3xl font-semibold text-zinc-900">Your winner entries & payout statuses</h1>
                </header>

                {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
                {success ? (
                    <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>
                ) : null}

                {loading ? (
                    <section className="grid gap-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="h-48 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100" />
                        ))}
                    </section>
                ) : hasRows ? (
                    <section className="space-y-4">
                        {rows.map((winner) => (
                            <article key={winner.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-zinc-500">Draw month</p>
                                        <p className="text-lg font-semibold text-zinc-900">{formatMonth(winner.draw_month)}</p>
                                    </div>
                                    <span
                                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusChipStyles[winner.status]}`}
                                    >
                                        {statusLabel(winner.status)}
                                    </span>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
                                    <div className="rounded-lg bg-zinc-50 p-3">
                                        <p className="text-zinc-500">Winner ID</p>
                                        <p className="mt-1 break-all font-medium text-zinc-800">{winner.id}</p>
                                    </div>
                                    <div className="rounded-lg bg-zinc-50 p-3">
                                        <p className="text-zinc-500">Tier</p>
                                        <p className="mt-1 font-medium text-zinc-800 capitalize">{winner.tier}</p>
                                    </div>
                                    <div className="rounded-lg bg-zinc-50 p-3">
                                        <p className="text-zinc-500">Prize</p>
                                        <p className="mt-1 font-semibold text-zinc-900">{formatInr(winner.prize_amount_inr)}</p>
                                    </div>
                                </div>

                                <Timeline status={winner.status} />

                                <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">{payoutMessage(winner.status)}</p>

                                <div className="mt-3 grid gap-2 text-xs text-zinc-500 sm:grid-cols-2">
                                    <p>Proof submitted: {formatDate(winner.proof_submitted_at)}</p>
                                    <p>Payout completed: {formatDate(winner.payout_completed_at)}</p>
                                </div>

                                {winner.status === "pending" ? (
                                    <form onSubmit={(event) => void handleSubmit(event, winner.id)} className="mt-5 space-y-3 rounded-xl border border-zinc-200 p-4">
                                        <h2 className="text-sm font-semibold text-zinc-900">Submit proof</h2>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <label className="text-sm text-zinc-700">
                                                <span className="mb-1 block">winner_id</span>
                                                <input
                                                    value={formState[winner.id]?.winner_id ?? winner.id}
                                                    readOnly
                                                    className="w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm"
                                                />
                                            </label>

                                            <label className="text-sm text-zinc-700">
                                                <span className="mb-1 block">proof_url</span>
                                                <input
                                                    type="url"
                                                    required
                                                    value={formState[winner.id]?.proof_url ?? ""}
                                                    onChange={(event) =>
                                                        setFormState((previous) => ({
                                                            ...previous,
                                                            [winner.id]: {
                                                                ...previous[winner.id],
                                                                winner_id: winner.id,
                                                                proof_url: event.target.value,
                                                            },
                                                        }))
                                                    }
                                                    placeholder="https://..."
                                                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                                />
                                            </label>
                                        </div>

                                        <label className="text-sm text-zinc-700">
                                            <span className="mb-1 block">notes (optional)</span>
                                            <textarea
                                                value={formState[winner.id]?.notes ?? ""}
                                                onChange={(event) =>
                                                    setFormState((previous) => ({
                                                        ...previous,
                                                        [winner.id]: {
                                                            ...previous[winner.id],
                                                            winner_id: winner.id,
                                                            notes: event.target.value,
                                                        },
                                                    }))
                                                }
                                                rows={3}
                                                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                            />
                                        </label>

                                        <button
                                            type="submit"
                                            disabled={submittingId === winner.id}
                                            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {submittingId === winner.id ? "Submitting..." : "Submit proof"}
                                        </button>
                                    </form>
                                ) : null}
                            </article>
                        ))}
                    </section>
                ) : (
                    <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-500">
                        No winnings entries found yet.
                    </p>
                )}
            </div>
        </main>
    );
}
