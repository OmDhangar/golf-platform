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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStatus() {
            try {
                setLoading(true);
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
            } finally {
                setLoading(false);
            }
        }

        void loadStatus();
    }, []);

    return (
        <main
            style={{
                minHeight: "100vh",
                background: "var(--bg-deep)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
            }}
        >
            <div style={{ maxWidth: 600, width: "100%" }}>
                {/* Header */}
                <div style={{ marginBottom: 40, textAlign: "center" }}>
                    <Link
                        href="/"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            textDecoration: "none",
                            marginBottom: 32,
                            justifyContent: "center",
                        }}
                    >
                        <span
                            style={{
                                width: 32,
                                height: 32,
                                background: "var(--green)",
                                borderRadius: 4,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                                <path
                                    d="M3 13 L8 2 L13 13"
                                    stroke="#000"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M5 9 L11 9"
                                    stroke="#000"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </span>
                        <span
                            style={{
                                fontFamily: "'Barlow Condensed', sans-serif",
                                fontWeight: 700,
                                fontSize: "0.95rem",
                                letterSpacing: "0.04em",
                                color: "var(--text-primary)",
                                textTransform: "uppercase",
                            }}
                        >
                            High-Energy Athletic
                        </span>
                    </Link>

                    <h1
                        className="font-barlow"
                        style={{
                            fontWeight: 800,
                            fontSize: "2rem",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "var(--text-primary)",
                            marginBottom: 16,
                        }}
                    >
                        Subscription Required
                    </h1>
                    <p
                        style={{
                            fontSize: "1rem",
                            color: "var(--text-secondary)",
                            lineHeight: 1.6,
                        }}
                    >
                        Upgrade to a Professional plan to access premium features and monthly draw eligibility.
                    </p>
                </div>

                {/* Status Card */}
                {!loading && (
                    <div className="hea-card" style={{ padding: 24, marginBottom: 24 }}>
                        <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 16 }}>
                            CURRENT STATUS
                        </p>
                        <SubscriptionStatusBadge status={status} />
                    </div>
                )}

                {/* Action Buttons */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                    }}
                >
                    <Link
                        href="/plans"
                        style={{
                            padding: "16px 24px",
                            background: "var(--green)",
                            color: "#000",
                            border: "none",
                            borderRadius: 4,
                            textAlign: "center",
                            textDecoration: "none",
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--green-bright)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--green)";
                        }}
                    >
                        VIEW PLANS & CHECKOUT
                    </Link>

                    <Link
                        href="/dashboard"
                        style={{
                            padding: "16px 24px",
                            background: "transparent",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-light)",
                            borderRadius: 4,
                            textAlign: "center",
                            textDecoration: "none",
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--text-secondary)";
                            e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border-light)";
                            e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                    >
                        BACK TO DASHBOARD
                    </Link>
                </div>

                {/* Info Section */}
                <div
                    className="hea-card"
                    style={{
                        padding: 24,
                        marginTop: 32,
                    }}
                >
                    <p className="label-caps" style={{ color: "var(--green)", marginBottom: 16 }}>
                        WHY UPGRADE?
                    </p>

                    <ul
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                        }}
                    >
                        {[
                            "Unlimited score logging for all your rounds",
                            "Automatic entry into monthly draws",
                            "Premium analytics and performance tracking",
                            "Advanced charity allocation controls",
                        ].map((benefit) => (
                            <li
                                key={benefit}
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    fontSize: "0.9rem",
                                    color: "var(--text-secondary)",
                                    alignItems: "flex-start",
                                }}
                            >
                                <span
                                    style={{
                                        color: "var(--green)",
                                        fontWeight: 700,
                                        flexShrink: 0,
                                        marginTop: 2,
                                    }}
                                >
                                    ✓
                                </span>
                                <span>{benefit}</span>
                            </li>
                        ))}
                    </ul>

                    <div
                        style={{
                            marginTop: 20,
                            padding: 16,
                            background: "var(--bg-surface)",
                            borderRadius: 4,
                            borderLeft: "3px solid var(--green)",
                        }}
                    >
                        <p
                            className="label-caps"
                            style={{
                                color: "var(--green)",
                                marginBottom: 8,
                            }}
                        >
                            SPECIAL OFFER
                        </p>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                            Professional plan at just <span style={{ color: "var(--green)", fontWeight: 700 }}>$24/month</span> or save 15% with annual billing.
                        </p>
                    </div>
                </div>

                {/* Help Section */}
                <p
                    style={{
                        textAlign: "center",
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        marginTop: 32,
                    }}
                >
                    Questions?{" "}
                    <a
                        href="#"
                        style={{
                            color: "var(--green)",
                            textDecoration: "none",
                        }}
                    >
                        Contact support
                    </a>
                </p>
            </div>
        </main>
    );
}

