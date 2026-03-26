import Link from "next/link";
import { headers } from "next/headers";
import type { Charity, CharityEvent } from "@/types";

const ALL_CATEGORIES = ["ALL INITIATIVES", "ENVIRONMENT", "YOUTH ATHLETICS", "HEALTH & WELLNESS"];

function parseEvents(events: Charity["events"] | string | null): CharityEvent[] {
  if (!events) return [];
  if (Array.isArray(events)) return events;
  if (typeof events === "string") {
    try {
      const parsed: unknown = JSON.parse(events);
      return Array.isArray(parsed) ? (parsed as CharityEvent[]) : [];
    } catch { return []; }
  }
  return [];
}

async function getCharities(searchParams: { featured?: string; search?: string; category?: string }): Promise<Charity[]> {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const baseUrl = host ? `${protocol}://${host}` : "";
  const params = new URLSearchParams();
  if (searchParams.featured === "true") params.set("featured", "true");
  if (searchParams.search) params.set("search", searchParams.search);
  const query = params.toString();
  try {
    const res = await fetch(`${baseUrl}/api/charities${query ? `?${query}` : ""}`, { cache: "no-store" });
    if (!res.ok) return [];
    const payload = (await res.json()) as { success: boolean; data?: { charities?: Charity[] } };
    return payload.success ? payload.data?.charities ?? [] : [];
  } catch { return []; }
}

export default async function CharitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ featured?: string; search?: string; category?: string }>;
}) {
  const query = await searchParams;
  const activeCategory = query.category ?? "ALL INITIATIVES";

  const allCharities = await getCharities({});
  
  const filtered = allCharities.filter((c) =>
    activeCategory === "ALL INITIATIVES" ? true : c.category === activeCategory
  );

  const totalImpactPaise = allCharities.reduce((sum, c) => sum + (c.total_generated_paise || 0), 0);
  const totalImpactFormatted = Math.floor(totalImpactPaise / 100).toLocaleString("en-US");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-deep)" }}>
      

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* Impact banner + Category tabs */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 40, marginBottom: 36 }}>
          {/* Impact card */}
          <div
            className="hea-card"
            style={{ padding: "24px 28px", minWidth: 240, background: "var(--bg-card)", flexShrink: 0 }}
          >
            <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 10 }}>GLOBAL PLATFORM IMPACT</p>
            <p
              className="font-barlow"
              style={{ fontSize: "2.6rem", fontWeight: 800, color: "var(--green)", letterSpacing: "-0.01em" }}
            >
              ${totalImpactFormatted}
            </p>
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: 0, alignItems: "flex-end" }}>
            {ALL_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <Link
                  key={cat}
                  href={`/charities?category=${encodeURIComponent(cat)}`}
                  style={{
                    display: "block",
                    padding: "10px 20px",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                    textDecoration: "none",
                    borderBottom: isActive ? "2px solid var(--green)" : "2px solid transparent",
                    borderTop: "none",
                    background: "none",
                    transition: "color 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Charity grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: 20,
          }}
        >
          {filtered.map((charity) => (
            <div
              key={charity.id}
              className="hea-card"
              style={{
                overflow: "hidden",
                transition: "border-color 0.2s, transform 0.15s",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {/* Image */}
              <div style={{ position: "relative", height: 160, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={charity.logo_url || ""}
                  alt={charity.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {/* Category badge */}
                {charity.category && (
                  <div
                    style={{
                      position: "absolute", top: 10, right: 10,
                      background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 3, padding: "3px 8px",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700, fontSize: "0.6rem",
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "var(--text-primary)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {charity.category}
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: "16px 18px 14px" }}>
                <h2
                  className="font-barlow"
                  style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-primary)", marginBottom: 8 }}
                >
                  {charity.name}
                </h2>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 14 }}>
                  {charity.description}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 16 }}>
                  <span className="label-caps" style={{ color: "var(--text-muted)" }}>GENERATED</span>
                  <span className="font-barlow" style={{ fontWeight: 800, fontSize: "1rem", color: "var(--green)" }}>
                    ${Math.floor((charity.total_generated_paise || 0) / 100).toLocaleString("en-US")}
                  </span>
                </div>
                <Link
                  href={`/plans?charity_id=${charity.id}`}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px",
                    background: "rgba(34, 197, 94, 0.1)",
                    border: "1px solid var(--green)",
                    color: "var(--green)",
                    borderRadius: 4,
                    textAlign: "center",
                    textDecoration: "none",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    transition: "all 0.15s"
                  }}
                >
                  SUPPORT THIS CAUSE
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
