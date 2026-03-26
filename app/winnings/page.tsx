"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { winnings, type WinnerStatus, type WinningsEntry } from "@/lib/api/endpoints/winnings";
import { FormEvent } from "react";

const LEADERBOARD = [
  { rank: "01", name: "J. Snedeker", tickets: "1,204", winPct: "12.4%", hasAvatar: true },
  { rank: "02", name: "M. Fitzpatrick", tickets: "942", winPct: "9.7%", hasAvatar: true },
  { rank: "03", name: "T. Fleetwood", tickets: "880", winPct: "9.1%", hasAvatar: true },
  { rank: "04", name: "R. Fowler", tickets: "712", winPct: "7.3%", hasAvatar: false },
  { rank: "05", name: "S. Lowry", tickets: "650", winPct: "6.7%", hasAvatar: false },
];
const YOU = { rank: "142", name: "YOU", tickets: "34", winPct: "0.8%" };

function pad(n: number) { return String(n).padStart(2, "0"); }
function useCountdown(ms: number) {
  const [rem, setRem] = useState(ms);
  useEffect(() => {
    const t = setInterval(() => setRem((p) => Math.max(0, p - 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.floor(rem / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), mins: Math.floor((s % 3600) / 60), secs: s % 60 };
}

const statusChipStyles: Record<WinnerStatus, { bg: string; color: string; border: string }> = {
  pending: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "#92400e" },
  proof_submitted: { bg: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "#1e3a5f" },
  approved: { bg: "rgba(34,197,94,0.1)", color: "var(--green)", border: "var(--green-dim)" },
  rejected: { bg: "rgba(239,68,68,0.1)", color: "var(--red)", border: "#7f1d1d" },
  paid: { bg: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "#4c1d95" },
};

interface ProofFormState { winner_id: string; proof_url: string; notes: string; }

export default function WinningsPage() {
  const { days, hours, mins, secs } = useCountdown(14 * 86400000 + 8 * 3600000 + 32 * 60000 + 10000);
  const [rows, setRows] = useState<WinningsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, ProofFormState>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void winnings.list().then((w) => {
      if (!active) return;
      setRows(w);
      setFormState(w.reduce<Record<string, ProofFormState>>((acc, winner) => {
        acc[winner.id] = { winner_id: winner.id, proof_url: "", notes: "" };
        return acc;
      }, {}));
    }).catch((err) => { if (active) setError(err instanceof Error ? err.message : "Failed to load winnings"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>, winnerId: string): Promise<void> {
    event.preventDefault();
    const payload = formState[winnerId];
    if (!payload?.proof_url) { setError("Proof URL is required."); return; }
    try {
      setSubmittingId(winnerId); setError(null); setSuccess(null);
      const result = await winnings.uploadProof({ winner_id: payload.winner_id, proof_url: payload.proof_url, notes: payload.notes.trim() || undefined });
      setRows((prev) => prev.map((r) => r.id === winnerId ? { ...r, status: result.status, proof_submitted: true, proof_submitted_at: new Date().toISOString() } : r));
      setSuccess(`Proof submitted successfully.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to submit proof"); }
    finally { setSubmittingId(null); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-deep)" }}>
      

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 40px" }}>

        {/* Sub header */}
        <div style={{ textAlign: "center", padding: "24px 0 20px", borderBottom: "1px solid var(--border)", marginBottom: 0 }}>
          <p className="label-caps" style={{ color: "var(--green)", marginBottom: 14 }}>MONTHLY DRAW ARENA</p>

          {/* Countdown */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
            {[pad(days), pad(hours), pad(mins)].map((seg, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center" }}>
                <span className="font-barlow" style={{ fontWeight: 800, fontSize: "5rem", color: "var(--text-primary)", lineHeight: 1 }}>{seg}</span>
                <span className="font-barlow" style={{ fontWeight: 800, fontSize: "4.5rem", color: "var(--text-primary)", margin: "0 4px" }}>:</span>
              </span>
            ))}
            <span className="font-barlow" style={{ fontWeight: 800, fontSize: "5rem", color: "var(--green)", lineHeight: 1 }}>{pad(secs)}</span>
          </div>
        </div>

        {/* Prize podium */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 20, padding: "28px 0 32px" }}>
          {/* 2nd */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="font-barlow" style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-secondary)" }}>2</span>
            </div>
            <div className="hea-card" style={{ width: 190, padding: 14 }}>
              <div style={{ height: 90, background: "var(--bg-surface)", borderRadius: 3, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="60" height="50" viewBox="0 0 60 50" fill="none"><rect x="5" y="20" width="50" height="25" rx="3" stroke="var(--text-muted)" strokeWidth="1.5"/><path d="M20 5 H40 L45 20 H15 Z" stroke="var(--text-muted)" strokeWidth="1.5"/></svg>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Pro Tour Bag</p>
            </div>
          </div>

          {/* 1st */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, background: "var(--green)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="font-barlow" style={{ fontWeight: 800, fontSize: "0.9rem", color: "#000" }}>1</span>
            </div>
            <div style={{ width: 220, background: "var(--bg-card)", border: "1px solid var(--green)", borderRadius: 6, padding: 16 }}>
              <div style={{ height: 110, background: "var(--bg-surface)", borderRadius: 3, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="80" height="60" viewBox="0 0 80 60" fill="none"><path d="M10 45 C10 45 25 15 40 30 C55 45 70 15 70 15" stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinecap="round"/><ellipse cx="40" cy="50" rx="28" ry="5" fill="var(--text-muted)" opacity="0.2"/></svg>
              </div>
              <p className="font-barlow" style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Custom Club Set</p>
            </div>
          </div>

          {/* 3rd */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="font-barlow" style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-secondary)" }}>3</span>
            </div>
            <div className="hea-card" style={{ width: 190, padding: 14 }}>
              <div style={{ height: 90, background: "var(--bg-surface)", borderRadius: 3, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="60" height="40" viewBox="0 0 60 40" fill="none"><circle cx="15" cy="20" r="12" stroke="var(--text-muted)" strokeWidth="1.5"/><circle cx="30" cy="20" r="12" stroke="var(--text-muted)" strokeWidth="1.5"/><circle cx="45" cy="20" r="12" stroke="var(--text-muted)" strokeWidth="1.5"/></svg>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>1-Year Supply Prov1s</p>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="hea-card">
          <table className="hea-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>RANK</th>
                <th>PLAYER</th>
                <th style={{ textAlign: "right" }}>TOTAL TICKETS</th>
                <th style={{ textAlign: "right" }}>WIN %</th>
              </tr>
            </thead>
            <tbody>
              {LEADERBOARD.map((row) => (
                <tr key={row.rank}>
                  <td>
                    <span className="font-barlow" style={{ fontWeight: 700, fontSize: "0.95rem", color: row.rank === "01" ? "var(--green)" : "var(--text-muted)" }}>{row.rank}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {row.hasAvatar && (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-surface)", border: "1px solid var(--border-light)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="var(--text-muted)"/><path d="M4 20 C4 16 8 14 12 14 C16 14 20 16 20 20" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/></svg>
                        </div>
                      )}
                      <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{row.name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "var(--text-secondary)" }}>{row.tickets}</td>
                  <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{row.winPct}</td>
                </tr>
              ))}

              {/* Separator */}
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "8px 0", color: "var(--text-muted)", letterSpacing: "0.3em", fontSize: "0.7rem" }}>· · ·</td></tr>

              {/* YOU row */}
              <tr style={{ background: "var(--green-bg)" }}>
                <td style={{ borderTop: "1px solid var(--green)", borderBottom: "1px solid var(--green)" }}>
                  <span className="font-barlow" style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--green)" }}>{YOU.rank}</span>
                </td>
                <td style={{ borderTop: "1px solid var(--green)", borderBottom: "1px solid var(--green)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-surface)", border: "1px solid var(--green-dim)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="var(--green)"/><path d="M4 20 C4 16 8 14 12 14 C16 14 20 16 20 20" stroke="var(--green)" strokeWidth="2" strokeLinecap="round"/></svg>
                    </div>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>{YOU.name}</span>
                  </div>
                </td>
                <td style={{ textAlign: "right", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: "var(--text-primary)", borderTop: "1px solid var(--green)", borderBottom: "1px solid var(--green)" }}>{YOU.tickets}</td>
                <td style={{ textAlign: "right", color: "var(--green)", fontWeight: 600, fontFamily: "'Barlow Condensed', sans-serif", borderTop: "1px solid var(--green)", borderBottom: "1px solid var(--green)" }}>{YOU.winPct}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Winnings entries (API data) */}
        {!loading && rows.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 className="font-barlow" style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-primary)", marginBottom: 14 }}>
              Your Winnings Entries
            </h2>
            {error && <div style={{ background: "var(--red-bg)", border: "1px solid #7f1d1d", borderRadius: 4, padding: "10px 14px", marginBottom: 12, fontSize: "0.8rem", color: "#fca5a5" }}>{error}</div>}
            {success && <div style={{ background: "var(--green-bg)", border: "1px solid var(--green-dim)", borderRadius: 4, padding: "10px 14px", marginBottom: 12, fontSize: "0.8rem", color: "var(--green)" }}>{success}</div>}
            {rows.map((winner) => {
              const chip = statusChipStyles[winner.status];
              return (
                <div key={winner.id} className="hea-card" style={{ padding: "18px 20px", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 4 }}>DRAW MONTH</p>
                      <p className="font-barlow" style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>
                        {new Date(`${winner.draw_month}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })}
                      </p>
                    </div>
                    <span style={{ background: chip.bg, border: `1px solid ${chip.border}`, color: chip.color, borderRadius: 3, padding: "3px 10px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {winner.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {[
                      { label: "TIER", value: winner.tier },
                      { label: "PRIZE", value: `$${Number(winner.prize_amount_inr).toLocaleString()}` },
                      { label: "PROOF", value: winner.proof_submitted ? "Submitted" : "Pending" },
                    ].map((item) => (
                      <div key={item.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 12px" }}>
                        <p className="label-caps" style={{ color: "var(--text-muted)", fontSize: "0.6rem", marginBottom: 4 }}>{item.label}</p>
                        <p style={{ color: "var(--text-primary)", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {winner.status === "pending" && (
                    <form onSubmit={(e) => void handleSubmit(e, winner.id)} style={{ marginTop: 14, display: "flex", gap: 10 }}>
                      <input type="url" required value={formState[winner.id]?.proof_url ?? ""} onChange={(e) => setFormState((p) => ({ ...p, [winner.id]: { ...p[winner.id], winner_id: winner.id, proof_url: e.target.value } }))} placeholder="Proof URL (https://...)" className="hea-input" style={{ flex: 1 }} />
                      <button type="submit" disabled={submittingId === winner.id} className="btn-primary" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                        {submittingId === winner.id ? "SUBMITTING..." : "SUBMIT PROOF"}
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
