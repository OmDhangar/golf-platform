"use client";

import { FormEvent, useState } from "react";
import { admin } from "@/lib/api/endpoints/admin";

export default function AdminWinnersPage() {
  const [winnerId, setWinnerId] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [result, setResult] = useState<any>(null);

  async function onReview(event: FormEvent, action: "approve" | "reject") {
    event.preventDefault();
    const data = await admin.reviewWinner({ winner_id: winnerId, action, admin_note: adminNote || undefined });
    setResult(data);
  }

  async function onMarkPaid(): Promise<void> {
    const data = await admin.markWinnerPaid({ winner_id: winnerId });
    setResult(data);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "24px 28px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-barlow" style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "0.05em", color: "var(--text-primary)", textTransform: "uppercase" }}>
          Payout Verification
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "'Inter', sans-serif" }}>
          Verify winner proofs and authorize prize payouts.
        </p>
      </div>

      <div className="hea-card" style={{ maxWidth: 640, padding: 28 }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 20, lineHeight: 1.5 }}>
          Enter the specific Winner Record ID to review their submitted documentation. Approved payouts will trigger internal accounting logs.
        </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="label-caps" style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>WINNER RECORD ID</label>
            <input 
              className="hea-input" 
              placeholder="e.g. win_9x29k..." 
              value={winnerId} 
              onChange={(e) => setWinnerId(e.target.value)} 
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="label-caps" style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>ADMINISTRATOR NOTES</label>
            <textarea 
              className="hea-input" 
              placeholder="ADD AUDIT NOTES OR REJECTION REASONS..." 
              style={{ minHeight: 100, paddingTop: 12 }}
              value={adminNote} 
              onChange={(e) => setAdminNote(e.target.value)} 
            />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button 
              className="btn-ghost" 
              style={{ flex: 1, border: "1px solid var(--green)", color: "var(--green)" }}
              onClick={(e) => void onReview(e, "approve")}
            >
              APPROVE PROOF
            </button>
            <button 
              className="btn-ghost" 
              style={{ flex: 1, border: "1px solid var(--red)", color: "var(--red)" }}
              onClick={(e) => void onReview(e, "reject")}
            >
              REJECT PROOF
            </button>
          </div>

          <button 
            className="btn-primary" 
            style={{ width: "100%", height: 44, background: "var(--green)", color: "#000", fontWeight: 800 }}
            onClick={onMarkPaid}
          >
            AUTHORIZE & MARK AS PAID
          </button>
        </div>

        {result && (
          <div style={{ marginTop: 24, padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 4 }}>
            <p className="label-caps" style={{ color: "var(--text-muted)", fontSize: "0.6rem", marginBottom: 8 }}>PROCESS_LOG_STREAM</p>
            <pre style={{ fontSize: "0.75rem", color: "var(--text-primary)", overflow: "auto" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
