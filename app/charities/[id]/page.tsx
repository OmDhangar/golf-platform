import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import NavBar from "@/components/nav-bar";
import type { Charity, CharityEvent } from "@/types";

function parseEvents(events: Charity["events"] | string | null): CharityEvent[] {
    if (!events) return [];
    if (Array.isArray(events)) return events;
    if (typeof events === "string") {
        try {
            const parsed: unknown = JSON.parse(events);
            return Array.isArray(parsed) ? (parsed as CharityEvent[]) : [];
        } catch {
            return [];
        }
    }
    return [];
}

async function getCharity(id: string): Promise<Charity | null> {
    const headerStore = await headers();
    const host = headerStore.get("host");
    const protocol = headerStore.get("x-forwarded-proto") ?? "http";
    const baseUrl = host ? `${protocol}://${host}` : "";

    const res = await fetch(`${baseUrl}/api/charities?id=${id}`, {
        cache: "no-store",
    });

    if (!res.ok) return null;

    const payload = (await res.json()) as { success: boolean; data?: { charity?: Charity } };
    return payload.success ? payload.data?.charity ?? null : null;
}

export default async function CharityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const charity = await getCharity(id);

    if (!charity) notFound();

    const events = parseEvents(charity.events);

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-deep)" }}>
            <NavBar />

            <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
                {/* Back Link */}
                <Link
                    href="/charities"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: "0.85rem",
                        color: "var(--green)",
                        textDecoration: "none",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 600,
                        marginBottom: 24,
                        transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                    ← Back to Charities
                </Link>

                {/* Header */}
                <header style={{ marginBottom: 32 }}>
                    <h1
                        className="font-barlow"
                        style={{
                            fontWeight: 800,
                            fontSize: "2.5rem",
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            color: "var(--text-primary)",
                            marginBottom: 12,
                        }}
                    >
                        {charity.name}
                    </h1>
                </header>

                {/* Description Section */}
                <section className="hea-card" style={{ padding: 24, marginBottom: 32 }}>
                    <p
                        style={{
                            fontSize: "0.95rem",
                            color: "var(--text-secondary)",
                            lineHeight: 1.7,
                            marginBottom: 16,
                        }}
                    >
                        {charity.description}
                    </p>
                    {charity.website_url && (
                        <a
                            href={charity.website_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: "inline-flex",
                                fontSize: "0.85rem",
                                color: "var(--green)",
                                textDecoration: "none",
                                fontFamily: "'Barlow Condensed', sans-serif",
                                fontWeight: 700,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                            }}
                        >
                            Visit Official Website ↗
                        </a>
                    )}
                </section>

                {/* Events Section */}
                <section>
                    <h2
                        className="label-caps"
                        style={{
                            color: "var(--green)",
                            marginBottom: 20,
                        }}
                    >
                        Upcoming & Recent Events
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {events.length > 0 ? (
                            events.map((event) => (
                                <div key={`${event.title}-${event.date}`} className="hea-card" style={{ padding: 20 }}>
                                    <h3
                                        style={{
                                            fontFamily: "'Barlow Condensed', sans-serif",
                                            fontWeight: 700,
                                            fontSize: "1rem",
                                            color: "var(--text-primary)",
                                            marginBottom: 8,
                                        }}
                                    >
                                        {event.title}
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: "0.85rem",
                                            color: "var(--text-muted)",
                                            marginBottom: 12,
                                        }}
                                    >
                                        {event.date}
                                    </p>
                                    {event.description && (
                                        <p
                                            style={{
                                                fontSize: "0.9rem",
                                                color: "var(--text-secondary)",
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {event.description}
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div
                                style={{
                                    padding: 24,
                                    background: "var(--bg-card)",
                                    border: "1px dashed var(--border)",
                                    borderRadius: 6,
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "var(--text-muted)",
                                    }}
                                >
                                    Event updates will appear here soon.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
