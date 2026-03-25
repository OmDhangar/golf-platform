import Link from "next/link";
import NavBar from "@/components/nav-bar";

type Draw = {
    id: string;
    draw_month: string;
    winning_numbers: number[] | null;
    prize_pool_total_paise: number | null;
    jackpot_rollover_paise: number;
    published_at: string | null;
};

async function getPublishedDraws(): Promise<Draw[]> {
    // In Server Components, we can use absolute URLs or a relative fetch if configured, 
    // but here we can just call our internal logic or use the absolute URL from env if available.
    // For local dev, we often use the host header.
    const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const res = await fetch(`${host}/api/draws/publish`, {
        cache: "no-store",
    });

    if (!res.ok) return [];

    const payload = (await res.json()) as { success: boolean; data?: { draws?: Draw[] } };
    return payload.success ? payload.data?.draws ?? [] : [];
}

function formatCurrency(paise: number | null) {
    if (paise == null) return "—";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(paise / 100);
}

export default async function ResultsPage() {
    const draws = await getPublishedDraws();

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-deep)" }}>
            <NavBar />

            <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
                {/* Header */}
                <header style={{ marginBottom: 32 }}>
                    <p className="label-caps" style={{ color: "var(--green)", marginBottom: 8 }}>
                        PUBLISHED DRAWS
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
                        Latest Official Results
                    </h1>
                </header>

                {/* Draws List */}
                <section
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 20,
                    }}
                >
                    {draws.length > 0 ? (
                        draws.map((draw) => (
                            <article key={draw.id} className="hea-card" style={{ padding: 24 }}>
                                {/* Draw Header */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 16,
                                        marginBottom: 20,
                                    }}
                                >
                                    <h2
                                        className="font-barlow"
                                        style={{
                                            fontWeight: 700,
                                            fontSize: "1.3rem",
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        {draw.draw_month}
                                    </h2>
                                    <p
                                        style={{
                                            fontSize: "0.85rem",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        Published:{" "}
                                        {draw.published_at
                                            ? new Date(draw.published_at).toLocaleDateString()
                                            : "Unknown"}
                                    </p>
                                </div>

                                {/* Winning Numbers */}
                                <div style={{ marginBottom: 20 }}>
                                    <p
                                        className="label-caps"
                                        style={{
                                            color: "var(--text-muted)",
                                            marginBottom: 12,
                                        }}
                                    >
                                        WINNING NUMBERS
                                    </p>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 12,
                                        }}
                                    >
                                        {(draw.winning_numbers ?? []).length > 0 ? (
                                            (draw.winning_numbers ?? []).map((num) => (
                                                <span
                                                    key={`${draw.id}-${num}`}
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        borderRadius: "50%",
                                                        background: "rgba(34, 197, 94, 0.1)",
                                                        border: "2px solid var(--green)",
                                                        fontSize: "1rem",
                                                        fontWeight: 700,
                                                        color: "var(--green)",
                                                    }}
                                                >
                                                    {num}
                                                </span>
                                            ))
                                        ) : (
                                            <p
                                                style={{
                                                    fontSize: "0.85rem",
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                Numbers not yet released
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Prize Information */}
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: 16,
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
                                        <p
                                            className="label-caps"
                                            style={{
                                                color: "var(--text-muted)",
                                                marginBottom: 8,
                                            }}
                                        >
                                            PRIZE POOL
                                        </p>
                                        <p
                                            className="font-barlow"
                                            style={{
                                                fontWeight: 800,
                                                fontSize: "1.3rem",
                                                color: "var(--green)",
                                            }}
                                        >
                                            {formatCurrency(draw.prize_pool_total_paise)}
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
                                        <p
                                            className="label-caps"
                                            style={{
                                                color: "var(--text-muted)",
                                                marginBottom: 8,
                                            }}
                                        >
                                            JACKPOT ROLLOVER
                                        </p>
                                        <p
                                            className="font-barlow"
                                            style={{
                                                fontWeight: 800,
                                                fontSize: "1.3rem",
                                                color: "var(--amber)",
                                            }}
                                        >
                                            {formatCurrency(draw.jackpot_rollover_paise)}
                                        </p>
                                    </div>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div
                            style={{
                                padding: 32,
                                background: "var(--bg-card)",
                                border: "1px dashed var(--border)",
                                borderRadius: 6,
                                textAlign: "center",
                            }}
                        >
                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                No published draws found yet. Stay tuned!
                            </p>
                        </div>
                    )}
                </section>

                {/* CTA Section */}
                {draws.length > 0 && (
                    <section
                        style={{
                            marginTop: 40,
                            padding: 24,
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            textAlign: "center",
                        }}
                    >
                        <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
                            Want to participate in the next draw?
                        </p>
                        <Link
                            href="/subscribe"
                            className="btn-primary"
                            style={{
                                display: "inline-block",
                                padding: "12px 24px",
                                background: "var(--green)",
                                color: "#000",
                                textDecoration: "none",
                                borderRadius: 4,
                                fontFamily: "'Barlow Condensed', sans-serif",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                transition: "background 0.15s",
                            }}
                        >
                            Upgrade Now
                        </Link>
                    </section>
                )}
            </main>
        </div>
    );
}
