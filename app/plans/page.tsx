"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { subscriptions } from "@/lib/api/endpoints/subscriptions";
import { charities } from "@/lib/api/endpoints/charities";
import { dashboard } from "@/lib/api/endpoints/dashboard";
import { getOnboardingState } from "@/lib/onboarding/store";
import { ApiClientError, apiFetch } from "@/lib/api/client";

interface Charity {
    id: string;
    name: string;
}

export default function PlansPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [charity, setCharity] = useState<Charity | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [charityPercent, setCharityPercent] = useState(10);

    useEffect(() => {
        async function loadCharity() {
            const charityId = searchParams.get("charity_id");

            if (!charityId) {
                // Try to get from onboarding state
                const state = getOnboardingState();
                if (state?.charity_id) {
                    loadCharityById(state.charity_id);
                    setCharityPercent(state.charity_percent || 10);
                } else {
                    // Fallback: Try to get from dashboard/profile if logged in
                    try {
                        const dash = await dashboard.get();
                        if (dash.charity?.selected?.id) {
                            loadCharityById(dash.charity.selected.id);
                            setCharityPercent(dash.charity.contribution_percent || 10);
                        }
                    } catch { /* session might be public */ }
                }
                return;
            }

            loadCharityById(charityId);
        }

        async function loadCharityById(charityId: string) {
            try {
                const data = await charities.get(charityId);
                if (data?.charity) {
                    setCharity(data.charity);
                }
            } catch (err) {
                console.error("Failed to load charity:", err);
            }
        }

        loadCharity();
    }, [searchParams]);

    async function handleFreeFinalize() {
        setLoading(true);
        setError(null);

        try {
            // For free plan, just confirm and redirect to dashboard
            // The user profile was already created during signup with the charity_id
            router.push("/dashboard");
        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message);
            } else {
                setError("Failed to finalize free plan. Please try again.");
            }
            setLoading(false);
        }
    }

    async function handlePaidPlan(planType: "monthly" | "yearly") {
        setLoading(true);
        setError(null);

        if (!charity) {
            setError("Charity information missing. Please go back.");
            setLoading(false);
            return;
        }

        try {
            const response = await subscriptions.create({
                plan_type: planType,
                charity_id: charity.id,
                charity_percent: charityPercent,
            }) as any;

            const subscription_id = response.data?.razorpay_subscription_id || response.razorpay_subscription_id;
            
            if (!subscription_id) {
                throw new Error("No subscription ID returned");
            }

            // Load Razorpay Script
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.onload = () => {
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    subscription_id: subscription_id,
                    name: "Golf Charity Platform",
                    description: `${planType === 'monthly' ? 'Monthly' : 'Yearly'} Pro Plan`,
                    handler: async function(response: any) {
                        // Pre-emptively sync status to avoid waiting for webhook
                        try {
                            await apiFetch("/api/subscriptions/sync", { method: "POST", protectedRoute: true });
                        } catch (err) {
                            console.error("Sync failed:", err);
                        }
                        // Redirect to dashboard
                        window.location.assign("/dashboard?subscription=success");
                    },
                    prefill: {
                        name: "Golfer",
                        email: "", // User's email from session/context would be better
                    },
                    notes: {
                        charity: charity.name
                    },
                    theme: {
                        color: "#22c55e"
                    }
                };
                const rzp = new (window as any).Razorpay(options);
                rzp.open();
                setLoading(false);
            };
            document.body.appendChild(script);

        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message);
            } else {
                setError("Failed to create subscription. Please try again.");
            }
            setLoading(false);
        }
    }

    const planOptions = [
        {
            name: "FREE",
            price: "$0",
            period: "/month",
            description: "Perfect for getting started",
            features: [
                "Basic Score Logging",
                "Charity Selection",
                "Dashboard Access",
                "Community Features",
                "Manual Draw Entry",
            ],
            cta: "FINALIZE FREE PLAN",
            highlighted: false,
            action: handleFreeFinalize,
            isPaid: false,
        },
        {
            name: "PROFESSIONAL",
            price: "$24",
            period: "/month",
            description: "Monthly billing",
            features: [
                "Unlimited Score Logging",
                "Sharing & Analytics",
                "Monthly Draw Entry",
                "Premium Insights",
                "Priority Support",
            ],
            cta: "CHOOSE MONTHLY",
            highlighted: true,
            action: () => handlePaidPlan("monthly"),
            isPaid: true,
        },
        {
            name: "PROFESSIONAL",
            price: "$240",
            period: "/year",
            description: "Save $48 yearly",
            features: [
                "Unlimited Score Logging",
                "Sharing & Analytics",
                "Monthly Draw Entry",
                "Premium Insights",
                "Priority Support",
            ],
            cta: "CHOOSE YEARLY",
            highlighted: false,
            action: () => handlePaidPlan("yearly"),
            isPaid: true,
        },
    ];

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
            <div
                style={{
                    width: "100%",
                    maxWidth: 1200,
                }}
            >
                {/* Logo */}
                <Link
                    href="/"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        textDecoration: "none",
                        marginBottom: 40,
                        justifyContent: "center",
                    }}
                >
                    <span
                        style={{
                            width: 28,
                            height: 28,
                            background: "var(--green)",
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
                            fontSize: "0.9rem",
                            letterSpacing: "0.04em",
                            color: "var(--text-primary)",
                            textTransform: "uppercase",
                        }}
                    >
                        HEA
                    </span>
                </Link>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                    <h1
                        style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 800,
                            fontSize: "2.5rem",
                            letterSpacing: "-0.02em",
                            color: "var(--text-primary)",
                            marginBottom: 12,
                        }}
                    >
                        CHOOSE YOUR PLAN
                    </h1>
                    <p
                        style={{
                            fontSize: "1rem",
                            color: "var(--text-secondary)",
                            maxWidth: 600,
                            margin: "0 auto",
                        }}
                    >
                        {charity && (
                            <>
                                Supporting <span style={{ color: "var(--green)" }}>{charity.name}</span>
                            </>
                        )}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div
                        style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid #7f1d1d",
                            borderRadius: 4,
                            padding: 16,
                            fontSize: "0.9rem",
                            color: "#fca5a5",
                            marginBottom: 32,
                            maxWidth: 500,
                            margin: "0 auto 32px",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Plans Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: 32,
                        marginBottom: 40,
                    }}
                >
                    {planOptions.map((plan) => (
                        <div
                            key={plan.name + plan.price}
                            className="hea-card"
                            style={{
                                padding: 32,
                                display: "flex",
                                flexDirection: "column",
                                gap: 20,
                                border: plan.highlighted
                                    ? "2px solid var(--green)"
                                    : "1px solid var(--border)",
                                position: "relative",
                            }}
                        >
                            {plan.highlighted && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: -12,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        background: "var(--green)",
                                        color: "#000",
                                        padding: "4px 12px",
                                        borderRadius: 3,
                                        fontFamily: "'Barlow Condensed', sans-serif",
                                        fontWeight: 700,
                                        fontSize: "0.65rem",
                                        letterSpacing: "0.12em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    MOST POPULAR
                                </div>
                            )}

                            <div>
                                <h3
                                    className="label-caps"
                                    style={{
                                        color: "var(--text-primary)",
                                        marginBottom: 12,
                                    }}
                                >
                                    {plan.name}
                                </h3>
                                <p
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "var(--text-muted)",
                                        marginBottom: 12,
                                    }}
                                >
                                    {plan.description}
                                </p>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "baseline",
                                        gap: 4,
                                    }}
                                >
                                    <span
                                        className="font-barlow"
                                        style={{
                                            fontWeight: 800,
                                            fontSize: "2.5rem",
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        {plan.price}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "0.85rem",
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        {plan.period}
                                    </span>
                                </div>
                            </div>

                            <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {plan.features.map((feature) => (
                                    <li
                                        key={feature}
                                        style={{
                                            fontSize: "0.9rem",
                                            color: "var(--text-secondary)",
                                            display: "flex",
                                            gap: 8,
                                        }}
                                    >
                                        <span style={{ color: "var(--green)" }}>✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className="btn-primary"
                                style={{
                                    width: "100%",
                                    marginTop: "auto",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    background: plan.highlighted
                                        ? "var(--green)"
                                        : "var(--green)",
                                    opacity: loading ? 0.7 : 1,
                                }}
                                onClick={plan.action}
                                disabled={loading}
                            >
                                {loading ? "PROCESSING..." : plan.cta}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer Link */}
                <div style={{ textAlign: "center" }}>
                    <p
                        style={{
                            fontSize: "0.85rem",
                            color: "var(--text-secondary)",
                        }}
                    >
                        Can't decide?{" "}
                        <Link
                            href="/dashboard"
                            style={{
                                color: "var(--green)",
                                textDecoration: "none",
                                fontWeight: 600,
                            }}
                        >
                            Go to dashboard
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
