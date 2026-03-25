"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api/endpoints/auth";
import { subscriptions } from "@/lib/api/endpoints/subscriptions";
import { charities } from "@/lib/api/endpoints/charities";
import { saveOnboardingState } from "@/lib/onboarding/store";
import { ApiClientError } from "@/lib/api/client";

interface Charity {
    id: string;
    name: string;
    description?: string;
}

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [planType, setPlanType] = useState<"free" | "monthly" | "yearly">("free");
    const [charityId, setCharityId] = useState("");
    const [charityPercent, setCharityPercent] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [charityOptions, setCharityOptions] = useState<Charity[]>([]);
    const [charitiesLoading, setCharitiesLoading] = useState(true);

    // Fetch charities on mount
    useEffect(() => {
        async function loadCharities() {
            try {
                setCharitiesLoading(true);
                const response = await charities.list() as any;
                
                // Debug: log the response
                console.log("Charities API Response:", response);

                // Handle different response structures
                let charityList = [];
                
                // Check for charities directly in response (actual API structure)
                if (response.charities && Array.isArray(response.charities)) {
                    charityList = response.charities;
                } else if (response.success && response.data?.charities) {
                    charityList = response.data.charities;
                } else if (response.data?.charities) {
                    charityList = response.data.charities;
                } else if (Array.isArray(response.data) && response.data.length > 0) {
                    charityList = response.data;
                } else if (Array.isArray(response) && response.length > 0) {
                    charityList = response;
                } else {
                    console.warn("Unexpected charities response structure:", response);
                }

                if (charityList && charityList.length > 0) {
                    setCharityOptions(charityList);
                    // Auto-select first charity
                    setCharityId(charityList[0].id);
                    console.log(`✅ Loaded ${charityList.length} charities`);
                } else {
                    console.warn("No charities received from API");
                    setError("No charities available. Please try again later.");
                }
            } catch (err) {
                console.error("Failed to load charities:", err);
                setError("Failed to load charities. Please refresh the page.");
            } finally {
                setCharitiesLoading(false);
            }
        }
        
        loadCharities();
    }, []);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (charityPercent < 10) {
            setError("Charity percentage must be at least 10%.");
            return;
        }

        if (!charityId.trim()) {
            setError("Please select a charity.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Call signup with the selected plan (free, monthly, or yearly)
            const signupResponse = await auth.signup({
                email,
                password,
                full_name: fullName,
                plan_type: planType,
                charity_id: charityId,
                charity_percent: charityPercent,
            }) as any;

            // Save onboarding state
            saveOnboardingState({
                email,
                plan_type: planType,
                charity_id: charityId,
                charity_percent: charityPercent,
            });

            // Login the user
            await auth.login({ email, password });

            // Get the selected charity for reference
            const selectedCharity = charityOptions.find(c => c.id === charityId);

            // For free plan, redirect to plans page to finalize
            if (planType === "free") {
                router.push(`/plans?plan=free&charity_id=${charityId}&charity_name=${encodeURIComponent(selectedCharity?.name || "")}`);
                return;
            }

            // For paid plans, create subscription and redirect to payment
            try {
                const subscription = await subscriptions.create({
                    plan_type: planType,
                    charity_id: charityId,
                    charity_percent: charityPercent,
                }) as any;

                window.location.assign(subscription.data?.payment_url || subscription.payment_url);
            } catch (subscriptionErr) {
                if (subscriptionErr instanceof ApiClientError) {
                    setError(`Subscription creation failed: ${subscriptionErr.message}`);
                } else {
                    setError("Failed to create subscription. Please try again.");
                }
                setLoading(false);
            }
        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message);
            } else {
                setError("Signup failed. Please try again.");
            }
            setLoading(false);
        }
    }

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
                    maxWidth: 450,
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

                {/* Form Card */}
                <div className="hea-card" style={{ padding: 32, marginBottom: 16 }}>
                    <h1
                        style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 700,
                            fontSize: "1.5rem",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "var(--text-primary)",
                            marginBottom: 24,
                        }}
                    >
                        Create Account
                    </h1>

                    <form
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                        }}
                        onSubmit={onSubmit}
                    >
                        {/* Full Name */}
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span
                                className="label-caps"
                                style={{
                                    color: "var(--text-muted)",
                                }}
                            >
                                Full Name
                            </span>
                            <input
                                required
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="hea-input"
                                placeholder="Your name"
                            />
                        </label>

                        {/* Email */}
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span
                                className="label-caps"
                                style={{
                                    color: "var(--text-muted)",
                                }}
                            >
                                Email Address
                            </span>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="hea-input"
                                placeholder="you@example.com"
                            />
                        </label>

                        {/* Password */}
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span
                                className="label-caps"
                                style={{
                                    color: "var(--text-muted)",
                                }}
                            >
                                Password (min 8 characters)
                            </span>
                            <input
                                required
                                type="password"
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="hea-input"
                                placeholder="••••••••"
                            />
                        </label>

                        {/* Plan Type */}
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span
                                className="label-caps"
                                style={{
                                    color: "var(--text-muted)",
                                }}
                            >
                                Membership Plan
                            </span>
                            <select
                                value={planType}
                                onChange={(e) =>
                                    setPlanType(e.target.value as "free" | "monthly" | "yearly")
                                }
                                style={{
                                    background: "var(--bg-surface)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-primary)",
                                    borderRadius: 4,
                                    padding: "10px 14px",
                                    fontSize: "0.875rem",
                                    fontFamily: "'Inter', sans-serif",
                                    cursor: "pointer",
                                    outline: "none",
                                }}
                            >
                                <option value="free">Free - Get Started</option>
                                <option value="monthly">Professional Monthly - $24/mo</option>
                                <option value="yearly">Professional Yearly (Save 15%)</option>
                            </select>
                        </label>

                        {/* Charity ID */}
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span
                                className="label-caps"
                                style={{
                                    color: "var(--text-muted)",
                                }}
                            >
                                Select Charity
                            </span>
                            <select
                                required
                                value={charityId}
                                onChange={(e) => setCharityId(e.target.value)}
                                disabled={charitiesLoading}
                                className="hea-input"
                                style={{
                                    background: "var(--bg-surface)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-primary)",
                                    borderRadius: 4,
                                    padding: "10px 14px",
                                    fontSize: "0.875rem",
                                    fontFamily: "'Inter', sans-serif",
                                    cursor: charitiesLoading ? "not-allowed" : "pointer",
                                    outline: "none",
                                    opacity: charitiesLoading ? 0.5 : 1,
                                }}
                            >
                                <option value="">
                                    {charitiesLoading ? "Loading charities..." : charityOptions.length === 0 ? "No charities available" : "Choose a charity"}
                                </option>
                                {charityOptions.length > 0 && charityOptions.map((charity) => (
                                    <option key={charity.id} value={charity.id}>
                                        {charity.name}
                                    </option>
                                ))}
                            </select>
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: charityOptions.length === 0 ? "#ef4444" : "var(--text-muted)",
                                }}
                            >
                                {charityOptions.length === 0 
                                    ? "⚠️ No charities loaded. Charities need to be seeded in the database. Check the browser console for details." 
                                    : `${charityOptions.length} charity(ies) available`}
                            </p>
                        </label>

                        {/* Charity Percentage */}
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span
                                className="label-caps"
                                style={{
                                    color: "var(--text-muted)",
                                }}
                            >
                                Charity Allocation: {charityPercent}%
                            </span>
                            <input
                                required
                                type="range"
                                min={10}
                                max={100}
                                value={charityPercent}
                                onChange={(e) => setCharityPercent(Number(e.target.value))}
                                style={{
                                    cursor: "pointer",
                                }}
                            />
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "var(--text-muted)",
                                }}
                            >
                                Minimum 10% of your entry fees support your chosen charity
                            </p>
                        </label>

                        {/* Error Message */}
                        {error && (
                            <div
                                style={{
                                    background: "rgba(239, 68, 68, 0.1)",
                                    border: "1px solid #7f1d1d",
                                    borderRadius: 4,
                                    padding: 12,
                                    fontSize: "0.85rem",
                                    color: "var(--red)",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{
                                width: "100%",
                                marginTop: 8,
                                cursor: loading ? "not-allowed" : "pointer",
                            }}
                        >
                            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                        </button>
                    </form>
                </div>

                {/* Login Link */}
                <p
                    style={{
                        textAlign: "center",
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                    }}
                >
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        style={{
                            color: "var(--green)",
                            textDecoration: "none",
                            fontWeight: 600,
                        }}
                    >
                        Log in here
                    </Link>
                </p>
            </div>
        </main>
    );
}
