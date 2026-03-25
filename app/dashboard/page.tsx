"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/nav-bar";
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
        <section
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 16,
            }}
        >
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    style={{
                        height: 200,
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
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
        <div style={{ minHeight: "100vh", background: "var(--bg-deep)" }}>
            <NavBar />

            <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
                {/* Header */}
                <header style={{ marginBottom: 32 }}>
                    <p className="label-caps" style={{ color: "var(--green)", marginBottom: 8 }}>
                        YOUR DASHBOARD
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
                        Golf + Giving Overview
                    </h1>
                </header>

                {loading ? (
                    <DashboardSkeleton />
                ) : error ? (
                    <div
                        style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid #7f1d1d",
                            borderRadius: 6,
                            padding: 16,
                            color: "var(--red)",
                        }}
                    >
                        Unable to load dashboard data: {error}
                    </div>
                ) : data ? (
                    <>
                        {/* Main Stats Grid */}
                        <section
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(280px, 1fr))",
                                gap: 24,
                                marginBottom: 32,
                            }}
                        >
                            {/* Subscription Card */}
                            <article className="hea-card" style={{ padding: 24 }}>
                                <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 16 }}>
                                    SUBSCRIPTION
                                </p>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                                    <span
                                        className="font-barlow"
                                        style={{
                                            fontWeight: 800,
                                            fontSize: "1.5rem",
                                            color: data.subscription?.is_active ? "var(--green)" : "var(--red)",
                                        }}
                                    >
                                        {data.subscription?.is_active ? "ACTIVE" : "INACTIVE"}
                                    </span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                        Plan:{" "}
                                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                                            {data.subscription?.plan_type.toUpperCase() ?? "None"}
                                        </span>
                                    </p>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                        Renewal:{" "}
                                        <span style={{ color: "var(--text-primary)" }}>
                                            {formatDate(data.subscription?.renewal_date ?? null)}
                                        </span>
                                    </p>
                                </div>
                            </article>

                            {/* Latest Scores Card */}
                            <article className="hea-card" style={{ padding: 24 }}>
                                <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 16 }}>
                                    LATEST SCORES
                                </p>
                                {latestScores.length > 0 ? (
                                    <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {latestScores.slice(0, 3).map((score) => (
                                            <li
                                                key={score.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    padding: "8px 12px",
                                                    background: "var(--bg-surface)",
                                                    borderRadius: 4,
                                                    fontSize: "0.85rem",
                                                }}
                                            >
                                                <span style={{ color: "var(--text-secondary)" }}>
                                                    {score.course_name ?? "Course not set"}
                                                </span>
                                                <span
                                                    className="font-barlow"
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "var(--green)",
                                                    }}
                                                >
                                                    {score.value}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div
                                        style={{
                                            padding: 16,
                                            background: "var(--bg-surface)",
                                            borderRadius: 4,
                                            border: "1px dashed var(--border)",
                                            fontSize: "0.85rem",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        No scores yet. Log your first round to get started.
                                    </div>
                                )}
                                <Link
                                    href="/scores"
                                    style={{
                                        display: "inline-block",
                                        marginTop: 12,
                                        fontSize: "0.8rem",
                                        color: "var(--green)",
                                        textDecoration: "none",
                                        fontFamily: "'Barlow Condensed', sans-serif",
                                        fontWeight: 600,
                                    }}
                                >
                                    Log new score →
                                </Link>
                            </article>

                            {/* Charity Contribution Card */}
                            <article className="hea-card" style={{ padding: 24 }}>
                                <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 16 }}>
                                    CHARITY SUPPORT
                                </p>
                                {data.charity?.selected ? (
                                    <>
                                        <p
                                            className="font-barlow"
                                            style={{
                                                fontWeight: 700,
                                                fontSize: "1.2rem",
                                                color: "var(--text-primary)",
                                                marginBottom: 12,
                                            }}
                                        >
                                            {data.charity.selected.name}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: "0.85rem",
                                                color: "var(--text-secondary)",
                                                marginBottom: 12,
                                            }}
                                        >
                                            Allocation:{" "}
                                            <span
                                                style={{
                                                    color: "var(--green)",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {data.charity.contribution_percent}%
                                            </span>
                                        </p>
                                        <Link
                                            href="/charities"
                                            style={{
                                                display: "inline-block",
                                                fontSize: "0.8rem",
                                                color: "var(--green)",
                                                textDecoration: "none",
                                                fontFamily: "'Barlow Condensed', sans-serif",
                                                fontWeight: 600,
                                            }}
                                        >
                                            Change charity →
                                        </Link>
                                    </>
                                ) : (
                                    <div
                                        style={{
                                            padding: 16,
                                            background: "var(--bg-surface)",
                                            borderRadius: 4,
                                            border: "1px dashed var(--border)",
                                            fontSize: "0.85rem",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        No charity selected yet. Support a cause.
                                    </div>
                                )}
                            </article>

                            {/* Draw Participation Card */}
                            <article className="hea-card" style={{ padding: 24 }}>
                                <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 16 }}>
                                    DRAW PARTICIPATION
                                </p>
                                <p
                                    className="font-barlow"
                                    style={{
                                        fontWeight: 800,
                                        fontSize: "2rem",
                                        color: "var(--green)",
                                        marginBottom: 12,
                                    }}
                                >
                                    {data.participations.total_draws_participated}
                                </p>
                                <p
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "var(--text-secondary)",
                                        marginBottom: 12,
                                    }}
                                >
                                    Draws participated in
                                </p>
                                {data.participations.upcoming_draw ? (
                                    <div
                                        style={{
                                            padding: 12,
                                            background: "var(--bg-surface)",
                                            borderRadius: 4,
                                            fontSize: "0.8rem",
                                        }}
                                    >
                                        <p
                                            style={{
                                                color: "var(--green)",
                                                fontWeight: 600,
                                                marginBottom: 4,
                                            }}
                                        >
                                            Next: {formatMonth(data.participations.upcoming_draw.draw_month)}
                                        </p>
                                        <p style={{ color: "var(--text-muted)" }}>
                                            {data.participations.upcoming_draw.message}
                                        </p>
                                    </div>
                                ) : (
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                        No upcoming draw announced.
                                    </p>
                                )}
                            </article>
                        </section>

                        {/* Winnings Overview Section */}
                        <section style={{ marginBottom: 32 }}>
                            <article className="hea-card" style={{ padding: 24 }}>
                                <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 24 }}>
                                    WINNINGS OVERVIEW
                                </p>

                                {/* Winnings Stats Grid */}
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
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
                                            Total Won
                                        </p>
                                        <p
                                            className="font-barlow"
                                            style={{
                                                fontWeight: 800,
                                                fontSize: "1.4rem",
                                                color: "var(--green)",
                                            }}
                                        >
                                            {formatInr(data.winnings.total_won_inr)}
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            padding: 16,
                                            background: "var(--bg-surface)",
                                            borderRadius: 4,
                                            borderLeft: "3px solid #22c55e",
                                        }}
                                    >
                                        <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 8 }}>
                                            Paid Out
                                        </p>
                                        <p
                                            className="font-barlow"
                                            style={{
                                                fontWeight: 800,
                                                fontSize: "1.4rem",
                                                color: "#22c55e",
                                            }}
                                        >
                                            {formatInr(data.winnings.paid_out_inr)}
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            padding: 16,
                                            background: "var(--bg-surface)",
                                            borderRadius: 4,
                                            borderLeft: "3px solid var(--amber)",
                                        }}
                                    >
                                        <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 8 }}>
                                            Pending
                                        </p>
                                        <p
                                            className="font-barlow"
                                            style={{
                                                fontWeight: 800,
                                                fontSize: "1.4rem",
                                                color: "var(--amber)",
                                            }}
                                        >
                                            {formatInr(data.winnings.pending_inr)}
                                        </p>
                                    </div>
                                </div>

                                {/* Winnings Table */}
                                {winnerRows.length > 0 ? (
                                    <div style={{ overflowX: "auto" }}>
                                        <table
                                            className="hea-table"
                                            style={{
                                                width: "100%",
                                            }}
                                        >
                                            <thead>
                                                <tr>
                                                    <th>Draw Month</th>
                                                    <th>Tier</th>
                                                    <th>Prize Amount</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {winnerRows.map((row) => (
                                                    <tr key={row.id}>
                                                        <td>{formatMonth(row.draw_month)}</td>
                                                        <td>
                                                            <span className="label-caps">
                                                                {row.tier}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span
                                                                className="font-barlow"
                                                                style={{
                                                                    fontWeight: 700,
                                                                    color: "var(--green)",
                                                                }}
                                                            >
                                                                {formatInr(row.prize_amount_inr)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span
                                                                style={{
                                                                    display: "inline-block",
                                                                    padding: "4px 8px",
                                                                    background:
                                                                        row.status === "paid"
                                                                            ? "rgba(34, 197, 94, 0.1)"
                                                                            : row.status === "pending"
                                                                              ? "rgba(245, 158, 11, 0.1)"
                                                                              : "rgba(239, 68, 68, 0.1)",
                                                                    color:
                                                                        row.status === "paid"
                                                                            ? "var(--green)"
                                                                            : row.status === "pending"
                                                                              ? "var(--amber)"
                                                                              : "var(--red)",
                                                                    borderRadius: 3,
                                                                    fontSize: "0.75rem",
                                                                    fontFamily:
                                                                        "'Barlow Condensed', sans-serif",
                                                                    fontWeight: 700,
                                                                    textTransform: "uppercase",
                                                                    letterSpacing: "0.05em",
                                                                }}
                                                            >
                                                                {row.status.replaceAll("_", " ")}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            padding: 24,
                                            background: "var(--bg-surface)",
                                            borderRadius: 4,
                                            border: "1px dashed var(--border)",
                                            textAlign: "center",
                                        }}
                                    >
                                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                            No winnings yet. Keep participating in draws to get a chance!
                                        </p>
                                    </div>
                                )}
                            </article>
                        </section>

                        {/* Quick Actions */}
                        <section
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: 16,
                            }}
                        >
                            <Link
                                href="/scores"
                                style={{
                                    padding: 16,
                                    background: "var(--bg-card)",
                                    border: "2px solid var(--green)",
                                    borderRadius: 6,
                                    textAlign: "center",
                                    textDecoration: "none",
                                    color: "var(--green)",
                                    fontFamily: "'Barlow Condensed', sans-serif",
                                    fontWeight: 700,
                                    fontSize: "0.9rem",
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "var(--bg-card)";
                                }}
                            >
                                Log Score
                            </Link>
                            <Link
                                href="/draws"
                                style={{
                                    padding: 16,
                                    background: "var(--bg-card)",
                                    border: "2px solid var(--green)",
                                    borderRadius: 6,
                                    textAlign: "center",
                                    textDecoration: "none",
                                    color: "var(--green)",
                                    fontFamily: "'Barlow Condensed', sans-serif",
                                    fontWeight: 700,
                                    fontSize: "0.9rem",
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "var(--bg-card)";
                                }}
                            >
                                View Draws
                            </Link>
                            <Link
                                href="/charities"
                                style={{
                                    padding: 16,
                                    background: "var(--bg-card)",
                                    border: "2px solid var(--green)",
                                    borderRadius: 6,
                                    textAlign: "center",
                                    textDecoration: "none",
                                    color: "var(--green)",
                                    fontFamily: "'Barlow Condensed', sans-serif",
                                    fontWeight: 700,
                                    fontSize: "0.9rem",
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "rgba(34, 197, 94, 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "var(--bg-card)";
                                }}
                            >
                                Explore Charities
                            </Link>
                        </section>
                    </>
                ) : null}
            </main>
        </div>
    );
}
