"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";

const PRIZES = [
  { rank: 2, label: "2ND PLACE", prize: "$500 Pro Shop Credit", image: null },
  { rank: 1, label: "1ST PLACE", prize: "Custom Titleist Set", image: null },
  { rank: 3, label: "3RD PLACE", prize: "Whoop 1-Year Pro", image: null },
];

const LEADERBOARD = [
  { rank: "01", name: "J. Sterling", tickets: 1245, winPct: "18.4%", hasAvatar: true },
  { rank: "02", name: "M. Chen", tickets: 982, winPct: "14.5%", hasAvatar: true },
  { rank: "03", name: "T. Woods (Sim)", tickets: 850, winPct: "12.1%", hasAvatar: true },
  { rank: "04", name: "R. McIlroy", tickets: 710, winPct: "9.8%", hasAvatar: false },
  { rank: "05", name: "S. Scheffler", tickets: 640, winPct: "8.5%", hasAvatar: false },
];

const YOU = { rank: "42", name: "You", tickets: 124, winPct: "1.2%" };

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(targetMs);
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const total = Math.floor(remaining / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return { days, hours, mins, secs };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function DrawsPage() {
  const { days, hours, mins, secs } = useCountdown(14 * 86400000 + 2 * 3600000 + 45 * 60000 + 12000);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-deep)" }}>
      <NavBar variant="dashboard" />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

        {/* Title */}
        <h1 className="font-barlow" style={{ fontWeight: 800, fontSize: "2rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-primary)", marginBottom: 28 }}>
          Monthly Draw Arena
        </h1>

        {/* Countdown */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p className="label-caps" style={{ color: "var(--green)", marginBottom: 10 }}>NEXT DRAW COMMENCES IN</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
            {[pad(days), pad(hours), pad(mins), pad(secs)].map((seg, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <span className="font-barlow" style={{ fontWeight: 800, fontSize: "4rem", color: "var(--text-primary)", lineHeight: 1 }}>
                  {seg}
                </span>
                {i < 3 && (
                  <span className="font-barlow" style={{ fontWeight: 800, fontSize: "3.5rem", color: "var(--text-primary)", margin: "0 2px", lineHeight: 1 }}>:</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Prize Podium */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 16, marginBottom: 36 }}>
          {/* 2nd */}
          <div className="hea-card" style={{ width: 200, padding: "16px", opacity: 0.85 }}>
            <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 12 }}>2ND PLACE</p>
            <div style={{ height: 100, background: "var(--bg-surface)", borderRadius: 4, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="48" height="32" viewBox="0 0 48 32" fill="none">
                <rect x="2" y="8" width="44" height="22" rx="3" stroke="var(--text-muted)" strokeWidth="1.5"/>
                <circle cx="24" cy="19" r="7" stroke="var(--text-muted)" strokeWidth="1.5"/>
                <circle cx="24" cy="19" r="3" fill="var(--text-muted)" opacity="0.4"/>
              </svg>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>$500 Pro Shop Credit</p>
          </div>

          {/* 1st — highlighted */}
          <div style={{ width: 220, background: "var(--bg-card)", border: "2px solid var(--green)", borderRadius: 6, padding: "18px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p className="label-caps" style={{ color: "var(--green)" }}>1ST PLACE</p>
              <span style={{ color: "var(--green)", fontSize: "1rem" }}>★</span>
            </div>
            <div style={{ height: 120, background: "var(--bg-surface)", borderRadius: 4, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
                <path d="M10 45 C10 45 25 15 40 30 C55 45 70 15 70 15" stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinecap="round"/>
                <ellipse cx="40" cy="48" rx="30" ry="5" fill="var(--text-muted)" opacity="0.2"/>
              </svg>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>Custom Titleist Set</p>
          </div>

          {/* 3rd */}
          <div className="hea-card" style={{ width: 200, padding: "16px", opacity: 0.75 }}>
            <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 12 }}>3RD PLACE</p>
            <div style={{ height: 100, background: "var(--bg-surface)", borderRadius: 4, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="4" y="4" width="32" height="32" rx="6" stroke="var(--text-muted)" strokeWidth="1.5"/>
                <path d="M13 20 H27 M20 13 V27" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>Whoop 1-Year Pro</p>
          </div>
        </div>

        {/* Leaderboard table */}
        <div className="hea-card">
          <table className="hea-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>RANK</th>
                <th>PLAYER</th>
                <th style={{ textAlign: "right" }}>TOTAL TICKETS</th>
                <th style={{ textAlign: "right" }}>WIN %</th>
              </tr>
            </thead>
            <tbody>
              {LEADERBOARD.map((row) => (
                <tr key={row.rank}>
                  <td>
                    <span className="font-barlow" style={{ fontWeight: 700, fontSize: "0.95rem", color: row.rank === "01" ? "var(--green)" : "var(--text-muted)" }}>
                      {row.rank}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {row.hasAvatar && (
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-surface)", border: "1px solid var(--border-light)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="var(--text-muted)"/><path d="M4 20 C4 16 8 14 12 14 C16 14 20 16 20 20" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/></svg>
                        </div>
                      )}
                      <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{row.name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", color: "var(--text-secondary)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>
                    {row.tickets.toLocaleString()}
                  </td>
                  <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{row.winPct}</td>
                </tr>
              ))}

              {/* YOU row */}
              <tr style={{ background: "var(--green-bg)", borderTop: "1px solid var(--green)", borderBottom: "1px solid var(--green)" }}>
                <td>
                  <span className="font-barlow" style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--green)" }}>{YOU.rank}</span>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-surface)", border: "1px solid var(--green-dim)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="var(--green)"/><path d="M4 20 C4 16 8 14 12 14 C16 14 20 16 20 20" stroke="var(--green)" strokeWidth="2" strokeLinecap="round"/></svg>
                    </div>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{YOU.name}</span>
                    <span className="badge-green">CURRENT</span>
                  </div>
                </td>
                <td style={{ textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                  {YOU.tickets}
                </td>
                <td style={{ textAlign: "right", color: "var(--green)", fontWeight: 600 }}>{YOU.winPct}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
