"use client";

import { useEffect, useState } from "react";
import { admin } from "@/lib/api/endpoints/admin";

const MOCK_FLAGGED = [
  { id: "#49201", name: "J. DOE", date: "Oct 24, 2023", course: "Pebble Beach Golf Links", points: 44, hcp: 12.4 },
  { id: "#88392", name: "S. SMITH", date: "Oct 23, 2023", course: "Torrey Pines South", points: 42, hcp: 8.1 },
  { id: "#11029", name: "M. JOHNSON", date: "Oct 22, 2023", course: "Bethpage Black", points: 41, hcp: 4.5 },
];

export default function AdminDashboardPage() {
  const [search, setSearch] = useState("");
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [currentDraw, setCurrentDraw] = useState<any>(null);
  const [simRunning, setSimRunning] = useState(false);
  const [publishRunning, setPublishRunning] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const month = new Date().toISOString().slice(0, 7); // YYYY-MM

  const loadDraw = async () => {
    try {
      const res = await fetch(`/api/draws?month=${month}`);
      const d = await res.json();
      if (d.success) setCurrentDraw(d.data.draw);
    } catch (err) {}
  };

  useEffect(() => {
    void loadDraw();
    void admin.reports({ include: ["users"] }).then((r) => {
      const payload = r as { users?: { total?: number } };
      if (payload?.users?.total) setTotalUsers(payload.users.total);
    }).catch(() => {});
  }, []);

  const handleSimulate = async () => {
    if (!currentDraw) { setError("No draw configuration found for this month."); return; }
    setSimRunning(true);
    setError(null);
    try {
       const res = await admin.simulateDraw({
         draw_id: currentDraw.id,
         mode: "algorithmic"
       });
       setSimResult((res as any).simulation ? (res as any) : null);
    } catch (err: any) {
       setError(err.message || "Simulation failed");
    } finally {
       setSimRunning(false);
    }
  };

  const handlePublish = async () => {
    if (!currentDraw) { setError("No draw found."); return; }
    if (!confirm("CRITICAL ACTION: THIS WILL COMMIT RESULTS TO DB AND NOTIFY ALL WINNERS. PROCEED?")) return;
    
    setPublishRunning(true);
    setError(null);
    try {
      await admin.publishDraw({
        draw_id: currentDraw.id,
        mode: "algorithmic",
        confirm: true
      });
      alert("DRAW PUBLISHED SUCCESSFULLY! GO TO RESULTS TO VIEW.");
      loadDraw();
    } catch (err: any) {
      setError(err.message || "Publish failed");
    } finally {
      setPublishRunning(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "100vh", background: "var(--bg-deep)" }}>

      {/* Top Bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 28px", borderBottom: "1px solid var(--border)",
        background: "var(--bg-surface)",
      }}>
        <h1 className="font-barlow" style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-primary)" }}>
          Command Center
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="var(--text-muted)" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="SEARCH SYSTEM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                color: "var(--text-primary)", borderRadius: 4, padding: "8px 12px 8px 32px",
                fontSize: "0.75rem", fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "0.08em", width: 200, outline: "none",
              }}
            />
          </div>
          {/* User badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right" }}>
              <p className="font-barlow" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-primary)" }}>
                SYSADMIN_01
              </p>
              <p className="font-barlow" style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", color: "var(--green)" }}>
                LEVEL 5 ACCESS
              </p>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--bg-card)", border: "1px solid var(--border-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="var(--text-muted)" />
                <path d="M4 20 C4 16 8 13 12 13 C16 13 20 16 20 20" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="animate-fade-in" style={{ flex: 1, padding: "24px 16px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { label: "MONTHLY REC. REV.", value: "$124,500", trend: "+12.4%", trendUp: true },
            { label: "ACTIVE DRAW TICKETS", value: "842,091", trend: "+5.2%", trendUp: true },
            { label: "FLAGGED SCORES (>40)", value: "14", note: "Action Required", noteRed: true },
            { label: "ACTIVE USERS (30D)", value: totalUsers.toLocaleString(), note: "Stable", noteIcon: true },
          ].map((stat, i) => (
            <div key={i} className={`hea-card animate-fade-up delay-${(i + 1) * 100}`} style={{ padding: "18px 20px" }}>
              <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 10 }}>{stat.label}</p>
              <p className="stat-value" style={{ fontSize: "1.9rem", color: i === 2 ? "var(--red)" : "var(--text-primary)" }}>{stat.value}</p>
              {stat.trend && (
                <p className="trend-up" style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>↑</span> {stat.trend}
                </p>
              )}
              {stat.note && (
                <p style={{ marginTop: 6, fontSize: "0.75rem", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, color: stat.noteRed ? "var(--red)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  {stat.noteRed ? "⚠" : "👥"} {stat.note}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: 20, flex: 1 }}>

          {/* Score Verification Queue */}
          <div className="hea-card animate-fade-up delay-500" style={{ padding: "22px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <h2 className="font-barlow" style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-primary)" }}>
                  Score Verification Queue
                </h2>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4, fontFamily: "'Inter', sans-serif" }}>
                  Review flagged rounds exceeding 40 Stableford points.
                </p>
              </div>
              <button className="btn-ghost" style={{ padding: "6px 14px", fontSize: "0.7rem" }}>
                ≡ FILTER
              </button>
            </div>

            <table className="hea-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>PLAYER</th>
                  <th>DATE / COURSE</th>
                  <th>POINTS</th>
                  <th>HCP</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_FLAGGED.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.82rem" }}>{row.name}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>ID: {row.id}</p>
                    </td>
                    <td>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{row.date}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{row.course}</p>
                    </td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 38, height: 38, background: "var(--red-bg)",
                        border: "1px solid #7f1d1d", borderRadius: 4,
                        color: "var(--red)", fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 800, fontSize: "1rem",
                      }}>
                        {row.points}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{row.hcp}</td>
                    <td>
                      <button className="btn-ghost" style={{ padding: "5px 12px", fontSize: "0.68rem" }}>REVIEW</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--border)", textAlign: "center" }}>
              <button style={{ background: "none", border: "none", color: "var(--text-muted)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                VIEW ALL 14 FLAGGED SCORES
              </button>
            </div>
          </div>

          {/* Draw Engine Panel */}
          <div className="animate-fade-up delay-500" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="hea-card" style={{ padding: "20px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 20, height: 20, background: "var(--green)", borderRadius: 3, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, padding: 3 }}>
                  {[0,1,2,3].map(i => <div key={i} style={{ background: "#000", borderRadius: 1 }} />)}
                </div>
                <h2 className="font-barlow" style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-primary)" }}>
                  Draw Engine
                </h2>
              </div>

              {/* Pool Status */}
              <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 10 }}>Current Pool Status</p>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <p className="label-caps" style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>MONTH</p>
                  <p className="font-barlow" style={{ fontWeight: 800, fontSize: "1.3rem", textTransform: "uppercase", color: "var(--text-primary)" }}>
                    {new Date().toLocaleString('default', { month: 'long' })}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="label-caps" style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>STATUS</p>
                  <p className="font-barlow" style={{ fontWeight: 800, fontSize: "1.3rem", color: currentDraw?.status === "published" ? "var(--green)" : "var(--text-muted)" }}>
                    {currentDraw?.status?.toUpperCase() || "UNCONFIGURED"}
                  </p>
                </div>
              </div>

              {/* Simulation Result Preview */}
              {simResult && (
                <div style={{ background: "rgba(0,255,100,0.05)", border: "1px solid var(--green)", borderRadius: 4, padding: "12px", marginBottom: 14 }}>
                   <p className="label-caps" style={{ color: "var(--green)", fontSize: "0.6rem", marginBottom: 8 }}>SIMULATION SUCCESSFUL</p>
                   <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                     {simResult.winning_numbers?.map((n: number, i: number) => (
                       <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", color: "#000", fontSize: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</div>
                     ))}
                   </div>
                   <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                     Winners: <span style={{ color: "#fff" }}>{simResult.winners?.length || 0}</span> | 
                     Rollover: <span style={{ color: "#fff" }}>₹{(simResult.jackpot_rollover_paise / 100).toLocaleString()}</span>
                   </p>
                </div>
              )}

              {error && (
                <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid var(--red)", borderRadius: 4, padding: "10px", marginBottom: 14 }}>
                  <p style={{ color: "var(--red)", fontSize: "0.7rem" }}>{error}</p>
                </div>
              )}

              {/* System Ready */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div className={currentDraw ? "pulse-green" : ""} style={{ width: 8, height: 8, borderRadius: "50%", background: currentDraw ? "var(--green)" : "var(--text-muted)", flexShrink: 0 }} />
                  <p className="label-caps" style={{ color: currentDraw ? "var(--green)" : "var(--text-muted)" }}>{currentDraw ? "ENGINE READY" : "CONFIG REQUIRED"}</p>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
                  {currentDraw 
                    ? "Draw configuration loaded. You can now run a simulation or commit the live draw." 
                    : "No draw configuration found for this month. Please configure prizes first."}
                </p>
              </div>

              {/* Buttons */}
              <button
                className="btn-ghost"
                style={{ width: "100%", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                onClick={handleSimulate}
                disabled={simRunning || !currentDraw || currentDraw?.status === "published"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" /><rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="2" /></svg>
                {simRunning ? "RUNNING SIM..." : "RUN TEST SIM"}
              </button>

              <button 
                className="btn-danger" 
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                onClick={handlePublish}
                disabled={publishRunning || !currentDraw || currentDraw?.status === "published"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" /></svg>
                {publishRunning ? "PUBLISHING..." : currentDraw?.status === "published" ? "DRAW COMPLETED" : "INITIATE LIVE DRAW"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
