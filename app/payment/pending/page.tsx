"use client";
import Link from "next/link";

export default function PaymentPendingPage() {
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
            <div style={{ maxWidth: 500, textAlign: "center" }}>
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
                </Link>

                {/* Content Card */}
                <div className="hea-card" style={{ padding: 32, marginBottom: 24 }}>
                    {/* Loading Animation */}
                    <div
                        style={{
                            width: 60,
                            height: 60,
                            margin: "0 auto 24px",
                            background: "var(--bg-surface)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "3px solid var(--border)",
                            borderTopColor: "var(--green)",
                            animation: "spin 1s linear infinite",
                        }}
                    >
                        <style>{`
                            @keyframes spin {
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>

                    <h1
                        className="font-barlow"
                        style={{
                            fontWeight: 800,
                            fontSize: "1.8rem",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "var(--text-primary)",
                            marginBottom: 16,
                        }}
                    >
                        Payment Processing
                    </h1>

                    <p
                        style={{
                            fontSize: "0.95rem",
                            color: "var(--text-secondary)",
                            lineHeight: 1.6,
                            marginBottom: 12,
                        }}
                    >
                        We're processing your payment. This usually takes a couple of minutes.
                    </p>

                    <p
                        style={{
                            fontSize: "0.85rem",
                            color: "var(--text-muted)",
                            marginBottom: 24,
                        }}
                    >
                        Please don't close this page or refresh.
                    </p>

                    <div
                        style={{
                            padding: 16,
                            background: "var(--bg-surface)",
                            borderRadius: 4,
                            borderLeft: "3px solid var(--green)",
                            fontSize: "0.85rem",
                            color: "var(--text-secondary)",
                            textAlign: "left",
                        }}
                    >
                        <p className="label-caps" style={{ color: "var(--green)", marginBottom: 8 }}>
                            TRANSACTION STATUS
                        </p>
                        <p>Your payment is being verified and will be confirmed shortly.</p>
                    </div>
                </div>

                {/* Action Links */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Link
                        href="/subscribe"
                        style={{
                            padding: "12px 24px",
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
                        Back to Subscription
                    </Link>
                    <p
                        style={{
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                        }}
                    >
                        Need help?{" "}
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
            </div>
        </main>
    );
}
