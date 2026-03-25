import Link from "next/link";

export default function PaymentSuccessPage() {
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
                    {/* Success Checkmark */}
                    <div
                        style={{
                            width: 80,
                            height: 80,
                            margin: "0 auto 24px",
                            background: "rgba(34, 197, 94, 0.1)",
                            border: "2px solid var(--green)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M5 12L10 17L19 7"
                                stroke="var(--green)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
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
                        Payment Successful!
                    </h1>

                    <p
                        style={{
                            fontSize: "0.95rem",
                            color: "var(--text-secondary)",
                            lineHeight: 1.6,
                            marginBottom: 24,
                        }}
                    >
                        Your subscription has been activated. Welcome to the Professional tier!
                    </p>

                    <div
                        style={{
                            padding: 16,
                            background: "var(--bg-surface)",
                            borderRadius: 4,
                            borderLeft: "3px solid var(--green)",
                            marginBottom: 24,
                        }}
                    >
                        <p className="label-caps" style={{ color: "var(--green)", marginBottom: 12 }}>
                            YOU NOW HAVE ACCESS TO
                        </p>
                        <ul
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}
                        >
                            {[
                                "Unlimited score logging",
                                "Monthly draw eligibility",
                                "Premium analytics",
                                "Advanced features",
                            ].map((feature) => (
                                <li
                                    key={feature}
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        fontSize: "0.85rem",
                                        color: "var(--text-secondary)",
                                        alignItems: "center",
                                    }}
                                >
                                    <span style={{ color: "var(--green)" }}>✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* CTA Buttons */}
                    <Link
                        href="/dashboard"
                        style={{
                            display: "block",
                            padding: "14px 24px",
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
                            marginBottom: 12,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--green-bright)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--green)";
                        }}
                    >
                        Go to Dashboard
                    </Link>

                    <Link
                        href="/scores"
                        style={{
                            display: "block",
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
                        Log Your First Score
                    </Link>
                </div>

                <p
                    style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                    }}
                >
                    Confirmation email sent to your inbox
                </p>
            </div>
        </main>
    );
}
