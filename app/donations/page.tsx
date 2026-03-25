"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import NavBar from "@/components/nav-bar";
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

function getStatusColor(type: DonationType): {bg: string; color: string; border: string} {
    return type === "independent"
        ? { bg: "rgba(34, 197, 94, 0.1)", color: "var(--green)", border: "var(--green-dim)" }
        : { bg: "rgba(59, 130, 246, 0.1)", color: "#60a5fa", border: "#1e3a5f" };
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
                `Charity contribution updated to ${response.charity_percent}%${response.charity_name ? ` for ${response.charity_name}` : ""
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
        <div style={{ minHeight: "100vh", background: "var(--bg-deep)" }}>
            <NavBar />

            <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
                {/* Header */}
                <header style={{ marginBottom: 32 }}>
                    <p className="label-caps" style={{ color: "var(--green)", marginBottom: 8 }}>
                        DONATIONS
                    </p>
                    <h1
                        className="font-barlow"
                        style={{
                            fontWeight: 800,
                            fontSize: "2rem",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "var(--text-primary)",
                        }}
                    >
                        Manage Contributions & Impact
                    </h1>
                </header>

                {/* Messages */}
                {error ? (
                    <div
                        style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid #7f1d1d",
                            borderRadius: 6,
                            padding: 16,
                            marginBottom: 24,
                            color: "var(--red)",
                            fontSize: "0.9rem",
                        }}
                    >
                        {error}
                    </div>
                ) : null}
                {message ? (
                    <div
                        style={{
                            background: "rgba(34, 197, 94, 0.1)",
                            border: "1px solid var(--green-dim)",
                            borderRadius: 6,
                            padding: 16,
                            marginBottom: 24,
                            color: "var(--green)",
                            fontSize: "0.9rem",
                        }}
                    >
                        {message}
                    </div>
                ) : null}

                {/* Forms Grid */}
                <section
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                        gap: 24,
                        marginBottom: 32,
                    }}
                >
                    {/* Independent Donation Form */}
                    <form
                        onSubmit={handleIndependentSubmit}
                        className="hea-card"
                        style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
                    >
                        <h2
                            className="label-caps"
                            style={{ color: "var(--green)" }}
                        >
                            Make a Donation
                        </h2>

                        {/* Charity Select */}
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="label-caps" style={{ color: "var(--text-muted)" }}>
                                Select Charity
                            </span>
                            <select
                                className="hea-input"
                                style={{ cursor: "pointer" }}
                                value={independentForm.charity_id}
                                onChange={(event) =>
                                    setIndependentForm((prev) => ({ ...prev, charity_id: event.target.value }))
                                }
                            >
                                <option value="">Choose a charity...</option>
                                {charityOptions.map((charity) => (
                                    <option key={charity.id} value={charity.id}>
                                        {charity.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {/* Amount Input */}
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="label-caps" style={{ color: "var(--text-muted)" }}>
                                Amount (Paise)
                            </span>
                            <input
                                type="number"
                                min={100}
                                step={1}
                                value={independentForm.amount_paise}
                                onChange={(event) =>
                                    setIndependentForm((prev) => ({ ...prev, amount_paise: event.target.value }))
                                }
                                className="hea-input"
                                placeholder="e.g. 5000 (₹50.00)"
                                required
                            />
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "var(--text-muted)",
                                }}
                            >
                                Minimum ₹1.00 (100 paise)
                            </p>
                        </label>

                        {/* Notes */}
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="label-caps" style={{ color: "var(--text-muted)" }}>
                                Notes (Optional)
                            </span>
                            <textarea
                                value={independentForm.notes}
                                onChange={(event) =>
                                    setIndependentForm((prev) => ({ ...prev, notes: event.target.value }))
                                }
                                style={{
                                    background: "var(--bg-surface)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-primary)",
                                    borderRadius: 4,
                                    padding: "10px 14px",
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "0.875rem",
                                    outline: "none",
                                    minHeight: 80,
                                    resize: "vertical",
                                }}
                                placeholder="Add a message (optional)"
                            />
                        </label>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submittingIndependent}
                            className="btn-primary"
                            style={{
                                marginTop: 8,
                                cursor: submittingIndependent ? "not-allowed" : "pointer",
                                opacity: submittingIndependent ? 0.6 : 1,
                            }}
                        >
                            {submittingIndependent ? "SUBMITTING..." : "DONATE NOW"}
                        </button>
                    </form>

                    {/* Settings Form */}
                    <form
                        onSubmit={handleSettingsSubmit}
                        className="hea-card"
                        style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
                    >
                        <h2
                            className="label-caps"
                            style={{ color: "var(--green)" }}
                        >
                            Update Settings
                        </h2>

                        {/* Charity Percent */}
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="label-caps" style={{ color: "var(--text-muted)" }}>
                                Charity Allocation: {settingsForm.charity_percent}%
                            </span>
                            <input
                                type="range"
                                min={10}
                                max={100}
                                step={1}
                                value={settingsForm.charity_percent}
                                onChange={(event) =>
                                    setSettingsForm((prev) => ({ ...prev, charity_percent: event.target.value }))
                                }
                                style={{ cursor: "pointer" }}
                            />
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "var(--text-muted)",
                                }}
                            >
                                % of subscription fees to support your charity
                            </p>
                        </label>

                        {/* New Charity Select */}
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span className="label-caps" style={{ color: "var(--text-muted)" }}>
                                Change Charity (Optional)
                            </span>
                            <select
                                className="hea-input"
                                style={{ cursor: "pointer" }}
                                value={settingsForm.charity_id}
                                onChange={(event) =>
                                    setSettingsForm((prev) => ({ ...prev, charity_id: event.target.value }))
                                }
                            >
                                <option value="">Keep current charity</option>
                                {charityOptions.map((charity) => (
                                    <option key={charity.id} value={charity.id}>
                                        {charity.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submittingSettings}
                            className="btn-primary"
                            style={{
                                marginTop: 8,
                                cursor: submittingSettings ? "not-allowed" : "pointer",
                                opacity: submittingSettings ? 0.6 : 1,
                            }}
                        >
                            {submittingSettings ? "SAVING..." : "SAVE SETTINGS"}
                        </button>
                    </form>
                </section>

                {/* Donation History */}
                <section className="hea-card" style={{ padding: 24 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 24,
                            flexWrap: "wrap",
                            gap: 16,
                        }}
                    >
                        <h2
                            className="label-caps"
                            style={{
                                color: "var(--green)",
                            }}
                        >
                            Donation History
                        </h2>
                        <p
                            style={{
                                fontSize: "0.85rem",
                                color: "var(--text-muted)",
                            }}
                        >
                            {historyCount} Record{historyCount !== 1 ? "s" : ""}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: 16,
                            marginBottom: 24,
                        }}
                    >
                        <div
                            style={{
                                padding: 16,
                                background: "var(--bg-surface)",
                                borderRadius: 4,
                                borderLeft: "3px solid var(--green)",
                            }}
                        >
                            <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 8 }}>
                                Total Donated
                            </p>
                            <p
                                className="font-barlow"
                                style={{
                                    fontWeight: 800,
                                    fontSize: "1.3rem",
                                    color: "var(--green)",
                                }}
                            >
                                ₹{totalDonatedInr}
                            </p>
                        </div>

                        <div
                            style={{
                                padding: 16,
                                background: "var(--bg-surface)",
                                borderRadius: 4,
                                borderLeft: "3px solid var(--green)",
                            }}
                        >
                            <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 8 }}>
                                Independent
                            </p>
                            <p
                                className="font-barlow"
                                style={{
                                    fontWeight: 800,
                                    fontSize: "1.3rem",
                                    color: "var(--green)",
                                }}
                            >
                                {formatInrFromPaise(donationTotals.independentPaise)}
                            </p>
                        </div>

                        <div
                            style={{
                                padding: 16,
                                background: "var(--bg-surface)",
                                borderRadius: 4,
                                borderLeft: "3px solid #60a5fa",
                            }}
                        >
                            <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 8 }}>
                                Subscription Share
                            </p>
                            <p
                                className="font-barlow"
                                style={{
                                    fontWeight: 800,
                                    fontSize: "1.3rem",
                                    color: "#60a5fa",
                                }}
                            >
                                {formatInrFromPaise(donationTotals.subscriptionSharePaise)}
                            </p>
                        </div>
                    </div>

                    {/* Donation Table */}
                    {loading ? (
                        <p
                            style={{
                                fontSize: "0.85rem",
                                color: "var(--text-muted)",
                                textAlign: "center",
                                padding: 24,
                            }}
                        >
                            Loading donation history...
                        </p>
                    ) : history.length === 0 ? (
                        <div
                            style={{
                                padding: 24,
                                background: "var(--bg-surface)",
                                borderRadius: 4,
                                border: "1px dashed var(--border)",
                                textAlign: "center",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: "0.85rem",
                                    color: "var(--text-muted)",
                                }}
                            >
                                No donations yet. Your contributions will appear here.
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table className="hea-table" style={{ width: "100%" }}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Charity</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((row) => {
                                        const statusColor = getStatusColor(row.type);
                                        return (
                                            <tr key={row.id}>
                                                <td>{formatDate(row.created_at)}</td>
                                                <td>{row.charities?.name ?? "Unknown Charity"}</td>
                                                <td>
                                                    <span
                                                        style={{
                                                            display: "inline-block",
                                                            padding: "2px 8px",
                                                            background: statusColor.bg,
                                                            color: statusColor.color,
                                                            border: `1px solid ${statusColor.border}`,
                                                            borderRadius: 3,
                                                            fontSize: "0.65rem",
                                                            fontFamily:
                                                                "'Barlow Condensed', sans-serif",
                                                            fontWeight: 700,
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.08em",
                                                        }}
                                                    >
                                                        {row.type.replace(/_/g, " ")}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        style={{
                                                            color: "var(--green)",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        ₹{row.amount_inr}
                                                    </span>
                                                </td>
                                                <td>{row.notes || "—"}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
