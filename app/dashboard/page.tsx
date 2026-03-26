"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/nav-bar";
import { useClientAuthStore, clearAuthTokens, hydrateAuthStore } from "@/lib/auth/store";
import { dashboard, type DashboardResponse } from "@/lib/api/endpoints/dashboard";
import { charities as charitiesApi } from "@/lib/api/endpoints/charities";
import { apiFetch } from "@/lib/api/client";

function formatInr(value: string | number): string {
    const amount = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(amount)) return "$0";

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
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
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
            }}
        >
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    style={{
                        height: 250,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: 16,
                        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
                />
            ))}
        </section>
    );
}

// ---------------------------------------------------------------------------
// Charity Picker Modal
// ---------------------------------------------------------------------------
function CharityPickerModal({ 
    currentId, 
    onClose, 
    onSelect 
}: { 
    currentId?: string; 
    onClose: () => void; 
    onSelect: (id: string, name: string) => Promise<void>;
}) {
    const [charities, setCharities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchCharities() {
            try {
                const data = await charitiesApi.list() as any;
                if (data?.charities) {
                    setCharities(data.charities);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchCharities();
    }, []);

    const handleSelect = async (charity: any) => {
        if (charity.id === currentId) return onClose();
        setSaving(true);
        try {
            await onSelect(charity.id, charity.name);
            onClose();
        } catch (err) {
            console.error("Failed to select charity", err);
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24
        }}>
            <div style={{
                background: "var(--bg-deep)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20, width: "100%", maxWidth: 800, maxHeight: "85vh",
                overflow: "hidden", display: "flex", flexDirection: "column",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)"
            }}>
                <div style={{ padding: "24px 32px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 className="font-barlow" style={{ fontSize: "1.5rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-primary)" }}>
                        Select Your Charity
                    </h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.5rem" }}>
                        &times;
                    </button>
                </div>
                
                <div style={{ overflowY: "auto", padding: 32, flex: 1 }}>
                    {loading ? (
                        <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Loading initiatives...</p>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
                            {charities.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => !saving && handleSelect(c)}
                                    style={{
                                        background: c.id === currentId ? "rgba(34, 197, 94, 0.05)" : "var(--bg-surface)",
                                        border: c.id === currentId ? "2px solid var(--green)" : "1px solid rgba(255,255,255,0.05)",
                                        borderRadius: 12, overflow: "hidden", cursor: saving ? "wait" : "pointer",
                                        transition: "transform 0.2s, border-color 0.2s",
                                        pointerEvents: saving ? "none" : "auto"
                                    }}
                                    onMouseEnter={e => !saving && (e.currentTarget.style.borderColor = "var(--green)")}
                                    onMouseLeave={e => !saving && (e.currentTarget.style.borderColor = c.id === currentId ? "var(--green)" : "rgba(255,255,255,0.05)")}
                                >
                                    <div style={{ height: 120, background: "rgba(0,0,0,0.3)", position: "relative" }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        {c.logo_url && <img src={c.logo_url} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                    </div>
                                    <div style={{ padding: 16 }}>
                                        <h3 className="font-barlow" style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8, color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.name}</h3>
                                        {c.id === currentId ? (
                                            <span style={{ fontSize: "0.75rem", color: "var(--green)", fontWeight: 700, textTransform: "uppercase" }}>Current Selection</span>
                                        ) : (
                                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Click to Support</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCharityModal, setShowCharityModal] = useState(false);
    const [updatingCharity, setUpdatingCharity] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("subscription") === "success") {
            setSuccessMessage("SUBSCRIPTION SUCCESSFULLY ACTIVATED! WELCOME TO PRO.");
            setShowSuccess(true);
            window.history.replaceState({}, "", "/dashboard");
            setTimeout(() => setShowSuccess(false), 5000);
        } else if (params.get("score") === "success") {
            setSuccessMessage("ROUND SCORE LOGGED SUCCESSFULLY!");
            setShowSuccess(true);
            window.history.replaceState({}, "", "/dashboard");
            setTimeout(() => setShowSuccess(false), 5000);
        }
    }, []);

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

    const handleCharityChange = async (charityId: string, charityName: string) => {
        try {
            setUpdatingCharity(true);
            await apiFetch("/api/dashboard/charity", {
                method: "PATCH",
                body: { charity_id: charityId },
                protectedRoute: true,
            });
            // Update local state optimistic
            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    charity: {
                        ...prev.charity!,
                        selected: { id: charityId, name: charityName } as any
                    }
                }
            })
        } catch (err) {
            console.error(err);
            alert("Failed to update charity selection.");
        } finally {
            setUpdatingCharity(false);
        }
    };

    const latestScores = useMemo(() => data?.scores ?? [], [data]);
    const winnerRows = useMemo(() => data?.winnings.winners ?? [], [data]);

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-deep)" }}>
            <NavBar variant="dashboard" />
            
            {showSuccess && (
                <div style={{
                    position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
                    zIndex: 2000, background: "var(--green)", color: "#000",
                    padding: "16px 24px", borderRadius: 12, display: "flex", gap: 12, alignItems: "center",
                    boxShadow: "0 10px 25px -5px rgba(34,197,94,0.4)", fontWeight: 700,
                    animation: "fadeInDown 0.4s ease-out"
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{successMessage}</span>
                </div>
            )}

            <main className="animate-fade-in" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
                
                {showCharityModal && (
                    <CharityPickerModal 
                        currentId={data?.charity?.selected?.id} 
                        onClose={() => setShowCharityModal(false)}
                        onSelect={handleCharityChange}
                    />
                )}

                {loading ? (
                    <DashboardSkeleton />
                ) : error ? (
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #7f1d1d", borderRadius: 12, padding: 24, color: "var(--red)", textAlign: "center" }}>
                        Unable to load dashboard data: {error}
                    </div>
                ) : data ? (
                    <>
                        {/* HERO SECTION */}
                        <div className="animate-fade-up" style={{
                            position: "relative",
                            background: "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(0,0,0,0.4) 100%)",
                            borderRadius: 24,
                            padding: "32px 24px",
                            marginBottom: 24,
                            border: "1px solid rgba(34,197,94,0.3)",
                            boxShadow: "0 20px 40px -15px rgba(34,197,94,0.15)",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12
                        }}>
                            {/* Decorative background blur */}
                            <div style={{
                                position: "absolute", top: -100, right: -100, width: 400, height: 400,
                                background: "var(--green)", filter: "blur(150px)", opacity: 0.1, zIndex: 0
                            }} />

                            <div style={{ zIndex: 1 }}>
                                <div style={{ display: "inline-block", background: "rgba(255,255,255,0.05)", padding: "4px 12px", borderRadius: 20, marginBottom: 16, border: "1px solid rgba(255,255,255,0.1)" }}>
                                    <p className="label-caps" style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                                        {data.user?.role === "admin" ? "ADMINISTRATOR" : "GOLF & GIVING SUBSCRIBER"}
                                    </p>
                                </div>
                                <h1 className="font-barlow animate-fade-up delay-100" style={{ fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3rem)", textTransform: "uppercase", color: "#fff", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
                                    Welcome Back,<br/><span style={{ color: "var(--green)" }}>{data.user?.full_name?.split(' ')[0] || "Golfer"}</span>
                                </h1>
                            </div>
                        </div>

                        {/* Top Stats Row */}
                        <div style={{
                            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32
                        }}>
                            <div className="animate-fade-up delay-200" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 20 }}>
                                <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 8 }}>TOTAL PRIZES WON</p>
                                <p className="font-barlow" style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--green)" }}>{formatInr(data.winnings.total_won_inr)}</p>
                            </div>
                            <div className="animate-fade-up delay-300" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 20 }}>
                                <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 8 }}>DRAWS ENTERED</p>
                                <p className="font-barlow" style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)" }}>{data.participations.total_draws_participated}</p>
                            </div>
                            <div className="animate-fade-up delay-400" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 20 }}>
                                <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 8 }}>SCORES LOGGED</p>
                                <p className="font-barlow" style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)" }}>{data.scores_count}</p>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))", gap: 24, marginBottom: 32, alignItems: "start" }}>
                            
                            {/* Membership & Charity Column */}
                            <div className="animate-fade-up delay-500" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                
                                {/* Subscription Card */}
                                <div style={{
                                    background: "rgba(255,255,255,0.015)", backdropFilter: "blur(10px)",
                                    border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: 32,
                                    position: "relative", overflow: "hidden"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                                        <div>
                                            <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 8 }}>MEMBERSHIP STATUS</p>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: data.subscription?.is_active ? "var(--green)" : "var(--red)", boxShadow: `0 0 10px ${data.subscription?.is_active ? "var(--green)" : "var(--red)"}` }} />
                                                <span className="font-barlow" style={{ fontWeight: 800, fontSize: "1.6rem", color: data.subscription?.is_active ? "var(--green)" : "var(--red)", textTransform: "uppercase" }}>
                                                    {data.subscription?.is_active ? "ACTIVE" : "INACTIVE"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                                        <div style={{ background: "rgba(0,0,0,0.3)", padding: 16, borderRadius: 12 }}>
                                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>Current Plan</p>
                                            <p style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, textTransform: "capitalize" }}>{data.subscription?.plan_type || "None"}</p>
                                        </div>
                                        <div style={{ background: "rgba(0,0,0,0.3)", padding: 16, borderRadius: 12 }}>
                                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>Renewal Date</p>
                                            <p style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600 }}>{formatDate(data.subscription?.renewal_date ?? null)}</p>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/plans?charity_id=${data.charity?.selected?.id || ""}`}
                                        style={{
                                            display: "block", textAlign: "center", padding: "14px 20px", borderRadius: 8,
                                            background: data.subscription?.is_active ? "rgba(255,255,255,0.05)" : "var(--green)",
                                            color: data.subscription?.is_active ? "var(--text-primary)" : "#000",
                                            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.05em", textTransform: "uppercase", textDecoration: "none",
                                            transition: "background 0.2s"
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = data.subscription?.is_active ? "rgba(255,255,255,0.1)" : "var(--green-bright)"}
                                        onMouseLeave={e => e.currentTarget.style.background = data.subscription?.is_active ? "rgba(255,255,255,0.05)" : "var(--green)"}
                                    >
                                        {data.subscription?.is_active ? "Manage Plan" : "Upgrade to Pro"}
                                    </Link>
                                </div>

                                {/* Charity Support Card */}
                                <div style={{
                                    background: "rgba(255,255,255,0.015)", backdropFilter: "blur(10px)",
                                    border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: 32,
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                        <p className="label-caps" style={{ color: "var(--text-muted)" }}>YOUR CAUSE</p>
                                        <button 
                                            onClick={() => setShowCharityModal(true)}
                                            style={{ 
                                                background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 20, 
                                                padding: "6px 14px", fontSize: "0.8rem", cursor: "pointer", transition: "all 0.2s" 
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "var(--text-secondary)"; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                                        >
                                            CHANGE CHARITY
                                        </button>
                                    </div>
                                    
                                    {data.charity?.selected ? (
                                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                            <div style={{ flex: 1 }}>
                                                <p className="font-barlow" style={{ fontWeight: 800, fontSize: "1.6rem", color: "var(--text-primary)", marginBottom: 8 }}>
                                                    {data.charity.selected.name}
                                                </p>
                                                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                                    <span style={{ color: "var(--green)", fontWeight: 700 }}>{data.charity.contribution_percent}%</span> of your subscription supports them directly.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: 24, textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: 12, border: "1px dashed var(--border)" }}>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 12 }}>You haven't selected a charity yet.</p>
                                            <button onClick={() => setShowCharityModal(true)} style={{ background: "none", border: "none", color: "var(--green)", textDecoration: "underline", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700 }}>CHOOSE A CAUSE NOW</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Scores & Quick Actions Column */}
                            <div className="animate-fade-up delay-400" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                                {/* Latest Scores */}
                                <div style={{
                                    background: "rgba(255,255,255,0.015)", backdropFilter: "blur(10px)",
                                    border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: 32,
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                        <p className="label-caps" style={{ color: "var(--text-muted)" }}>RECENT SCORES</p>
                                        <Link href="/scores" style={{ fontSize: "0.85rem", color: "var(--green)", textDecoration: "none", fontWeight: 600 }}>Log New Score +</Link>
                                    </div>
                                    
                                    {latestScores.length > 0 ? (
                                        <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                            {latestScores.slice(0, 4).map((score) => (
                                                <li key={score.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(0,0,0,0.3)", borderRadius: 8, borderLeft: "3px solid var(--green)" }}>
                                                    <div>
                                                        <p style={{ color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 600, marginBottom: 2 }}>{score.course_name ?? "Unknown Course"}</p>
                                                        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{formatDate(score.played_at)}</p>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                        <span className="font-barlow" style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--green)" }}>
                                                            {score.value}
                                                        </span>
                                                        <Link href={`/scores?edit=${score.id}`} style={{ 
                                                            fontSize: "0.65rem", color: "var(--text-muted)", 
                                                            textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)", 
                                                            padding: "2px 6px", borderRadius: 4, transition: "all 0.2s"
                                                        }} onMouseOver={(e) => e.currentTarget.style.color = "var(--green)"} onMouseOut={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
                                                            EDIT
                                                        </Link>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div style={{ padding: 32, textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: 12, border: "1px dashed var(--border)" }}>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No scores logged this month.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* WINNINGS OVERVIEW */}
                        <div className="animate-fade-up delay-500" style={{
                            background: "rgba(255,255,255,0.015)", backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "24px 20px",
                            marginTop: 32
                        }}>
                            <h2 className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 24 }}>YOUR DRAW WINNINGS</h2>
                            {winnerRows.length > 0 ? (
                                <div style={{ overflowX: "auto" }}>
                                    <table className="hea-table" style={{ width: "100%" }}>
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
                                                    <td><span className="label-caps">{row.tier}</span></td>
                                                    <td><span className="font-barlow" style={{ fontWeight: 700, color: "var(--green)", fontSize: "1.1rem" }}>{formatInr(row.prize_amount_inr)}</span></td>
                                                    <td>
                                                        <span style={{
                                                            display: "inline-block", padding: "4px 8px", borderRadius: 4, fontSize: "0.75rem", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                                                            background: row.status === "paid" ? "rgba(34, 197, 94, 0.1)" : row.status === "pending" ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                                            color: row.status === "paid" ? "var(--green)" : row.status === "pending" ? "var(--amber)" : "var(--red)",
                                                        }}>
                                                            {row.status.replaceAll("_", " ")}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ padding: 48, textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: 12, border: "1px dashed var(--border)" }}>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>No winnings yet.</p>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 8 }}>Keep logging your scores to earn tickets for the monthly draw!</p>
                                </div>
                            )}
                        </div>

                    </>
                ) : null}
            </main>
        </div>
    );
}
