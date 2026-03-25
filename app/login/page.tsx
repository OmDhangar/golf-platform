"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, type LoginResponse } from "@/lib/api/endpoints/auth";
import { ApiClientError } from "@/lib/api/client";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await auth.login({ email, password });
            const role = getRole(response);

            if (role === "admin") {
                router.push("/admin");
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message);
            } else {
                setError("Login failed. Please try again.");
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
                    maxWidth: 400,
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
                        Log In
                    </h1>

                    <form
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                        }}
                        onSubmit={onSubmit}
                    >
                        {/* Email Field */}
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

                        {/* Password Field */}
                        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span
                                className="label-caps"
                                style={{
                                    color: "var(--text-muted)",
                                }}
                            >
                                Password
                            </span>
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="hea-input"
                                placeholder="••••••••"
                            />
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
                            {loading ? "SIGNING IN..." : "LOG IN"}
                        </button>
                    </form>
                </div>

                {/* Sign Up Link */}
                <p
                    style={{
                        textAlign: "center",
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                    }}
                >
                    Don't have an account?{" "}
                    <Link
                        href="/signup"
                        style={{
                            color: "var(--green)",
                            textDecoration: "none",
                            fontWeight: 600,
                        }}
                    >
                        Sign up here
                    </Link>
                </p>
            </div>
        </main>
    );
}

function getRole(response: LoginResponse): string {
    const user = response.user as { role?: string } | null;
    return user?.role ?? "user";
}
