"use client";

import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiClientError } from "@/lib/api/client";
import { scores, type ScoreItem } from "@/lib/api/endpoints/scores";

type FormValues = { value: string; played_at: string; course_name: string; };
type FieldErrors = Partial<Record<keyof FormValues, string>>;
const EMPTY_FORM: FormValues = { value: "36", played_at: "", course_name: "" };
const CHARITY_PERCENT_PRESETS = [10, 15, 20, 25];

export default function ScoresPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [entries, setEntries] = useState<ScoreItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [charityPct, setCharityPct] = useState(15);
  const scoreValue = Number(form.value) || 36;

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  useEffect(() => { void refreshScores(); }, []);

  async function refreshScores(): Promise<void> {
    try {
      setLoadingList(true);
      const data = await scores.list({ skipRedirect: true });
      setEntries(data.scores.slice(0, 5));
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Failed to load scores.");
    } finally { setLoadingList(false); }
  }

  function validate(values: FormValues): FieldErrors {
    const nextErrors: FieldErrors = {};
    const parsed = Number(values.value);
    if (!Number.isInteger(parsed)) { nextErrors.value = "Score must be a whole number."; }
    else if (parsed < 1 || parsed > 45) { nextErrors.value = "Score must be between 1 and 45."; }
    if (!values.played_at) { nextErrors.played_at = "Date is required."; }
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.played_at)) { nextErrors.played_at = "Date must be in YYYY-MM-DD format."; }
    return nextErrors;
  }

  function setFormField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function adjustScore(delta: number) {
    const current = Number(form.value) || 36;
    const next = Math.max(1, Math.min(45, current + delta));
    setFormField("value", String(next));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clientErrors = validate(form);
    if (Object.keys(clientErrors).length > 0) { setErrors(clientErrors); return; }
    setErrors({}); setFormError(null); setSubscriptionRequired(false); setSaving(true);
    const payload = { value: Number(form.value), played_at: form.played_at, course_name: form.course_name.trim() || undefined };
    try {
      if (editingId) {
        await scores.update({ score_id: editingId, ...payload }, { skipRedirect: true });
      } else {
        await scores.create(payload, { skipRedirect: true });
      }
      setForm(EMPTY_FORM); setEditingId(null); router.refresh(); await refreshScores();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 422) applyBackendValidation(err.details);
        else if (err.status === 403) { setSubscriptionRequired(true); setFormError(err.message); }
        else setFormError(err.message);
      } else setFormError("Unable to save score. Please try again.");
    } finally { setSaving(false); }
  }

  function applyBackendValidation(details: unknown): void {
    const fieldErrors = typeof details === "object" && details !== null && "fieldErrors" in details
      ? (details as { fieldErrors?: Record<string, string[] | undefined> }).fieldErrors : undefined;
    const backendErrors: FieldErrors = {};
    if (fieldErrors?.value?.[0]) backendErrors.value = fieldErrors.value[0];
    if (fieldErrors?.played_at?.[0]) backendErrors.played_at = fieldErrors.played_at[0];
    if (fieldErrors?.course_name?.[0]) backendErrors.course_name = fieldErrors.course_name[0];
    setErrors(backendErrors); setFormError("Please fix the highlighted fields.");
  }

  function startEdit(entry: ScoreItem): void {
    setEditingId(entry.id); setErrors({}); setFormError(null); setSubscriptionRequired(false);
    setForm({ value: String(entry.value), played_at: entry.played_at, course_name: entry.course_name ?? "" });
  }
  function cancelEdit(): void {
    setEditingId(null); setErrors({}); setFormError(null); setSubscriptionRequired(false); setForm(EMPTY_FORM);
  }

  const rollingScores = entries.length > 0 ? entries.map((e) => e.value) : [32, 34, 38, 35, 36];
  const drawTickets = Math.floor(scoreValue / 12);

  return (
    <div style={{ minHeight: "100vh", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>

      <div
        className="hea-card"
        style={{
          width: "100%", maxWidth: 480, position: "relative",
          background: "var(--bg-surface)", borderRadius: 8,
        }}
      >
        {/* Close + LOG ROUND header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 22px", borderBottom: "1px solid var(--border)",
        }}>
          <button
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1, padding: 0 }}
            onClick={cancelEdit}
          >
            ×
          </button>
          <p className="label-caps" style={{ color: "var(--text-muted)" }}>LOG ROUND</p>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ padding: "24px 24px 0" }}>

            {/* Title */}
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "2rem", letterSpacing: "0.02em", lineHeight: 1.1, marginBottom: 6 }}>
              ENTER YOUR<br />
              <span style={{ color: "var(--green)" }}>STABLEFORD</span>
            </h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontFamily: "'Inter', sans-serif", marginBottom: 20 }}>
              Log your 18-hole score to earn draw tickets.
            </p>

            {/* Date */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="var(--text-muted)" strokeWidth="1.5"/>
                <path d="M3 9h18M8 2v4M16 2v4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div style={{ flex: 1 }}>
                <p className="label-caps" style={{ color: "var(--text-muted)", fontSize: "0.6rem", marginBottom: 3 }}>ROUND DATE</p>
                <input
                  type="date"
                  value={form.played_at}
                  onChange={(e) => setFormField("played_at", e.target.value)}
                  required
                  style={{ background: "none", border: "none", color: "var(--text-primary)", fontFamily: "'Inter', sans-serif", fontSize: "0.88rem", outline: "none", width: "100%", colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Stableford counter */}
            <p className="label-caps" style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 14 }}>STABLEFORD POINTS</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 6 }}>
              <button
                type="button"
                onClick={() => adjustScore(-1)}
                style={{
                  width: 56, height: 64, background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "4px 0 0 4px", color: "var(--text-primary)", fontSize: "1.5rem",
                  cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.1s",
                }}
              >
                −
              </button>
              <div style={{ width: 120, height: 64, background: "var(--bg-card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <p className="font-barlow" style={{ fontWeight: 800, fontSize: "2.8rem", color: "var(--text-primary)", lineHeight: 1 }}>
                  {scoreValue}
                </p>
              </div>
              <button
                type="button"
                onClick={() => adjustScore(1)}
                style={{
                  width: 56, height: 64, background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "0 4px 4px 0", color: "var(--text-primary)", fontSize: "1.5rem",
                  cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                +
              </button>
            </div>
            <p className="label-caps" style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.6rem", marginBottom: 24 }}>POINTS</p>
            {errors.value && <p style={{ textAlign: "center", color: "var(--red)", fontSize: "0.78rem", marginBottom: 12, marginTop: -18 }}>{errors.value}</p>}

            {/* Charity allocation */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p className="label-caps" style={{ color: "var(--text-secondary)" }}>CHARITY ALLOCATION</p>
                <div style={{ textAlign: "right" }}>
                  <p className="font-barlow" style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--green)" }}>{charityPct}%</p>
                  <p style={{ fontSize: "0.68rem", color: "var(--green)", fontFamily: "'Inter', sans-serif" }}>
                    {charityPct}% = ${((charityPct / 100) * 20).toFixed(2)} donated this month
                  </p>
                </div>
              </div>

              <input
                type="range"
                min={10} max={100} step={5}
                value={charityPct}
                onChange={(e) => setCharityPct(Number(e.target.value))}
                style={{ marginBottom: 6 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <p className="label-caps" style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>10% MIN</p>
                <p className="label-caps" style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>100% MAX</p>
              </div>

              {/* Preset buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14 }}>
                {CHARITY_PERCENT_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCharityPct(p)}
                    style={{
                      padding: "8px 0",
                      background: charityPct === p ? "var(--green-bg)" : "var(--bg-card)",
                      border: charityPct === p ? "1px solid var(--green)" : "1px solid var(--border)",
                      borderRadius: 4, color: charityPct === p ? "var(--green)" : "var(--text-muted)",
                      fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                      fontSize: "0.85rem", letterSpacing: "0.05em", cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {p}%
                  </button>
                ))}
              </div>

              {/* Beneficiary card */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 4, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-surface)", border: "1px solid var(--border-light)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="var(--text-muted)"/></svg>
                </div>
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>Youth Golf Initiative</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", color: "var(--text-muted)" }}>Beneficiary for your October rounds.</p>
                </div>
              </div>
            </div>

            {/* Monthly Draw Entry */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "12px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
              <p className="label-caps" style={{ color: "var(--text-muted)" }}>MONTHLY DRAW ENTRY LOGGED</p>
              <p className="font-barlow" style={{ fontWeight: 800, fontSize: "1.4rem", color: "var(--text-primary)" }}>
                +{drawTickets > 0 ? drawTickets : 3}
              </p>
            </div>

            {/* Rolling 5 */}
            <div style={{ marginBottom: 20 }}>
              <p className="label-caps" style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 12 }}>CURRENT ROLLING 5</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <div style={{ width: 28, height: 2, background: "var(--border-light)" }} />
                {rollingScores.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      width: 40, height: 40, borderRadius: 4,
                      background: i === rollingScores.length - 1 ? "transparent" : "var(--bg-card)",
                      border: i === rollingScores.length - 1 ? "1px solid var(--green)" : "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                      fontSize: "0.95rem",
                      color: i === rollingScores.length - 1 ? "var(--green)" : "var(--text-secondary)",
                    }}
                  >
                    {s}
                  </div>
                ))}
                <div style={{ width: 28, height: 2, background: "var(--border-light)" }} />
              </div>
            </div>

            {/* Course name (hidden, optional) */}
            <input
              type="text"
              value={form.course_name}
              onChange={(e) => setFormField("course_name", e.target.value)}
              placeholder="Course name (optional)"
              className="hea-input"
              style={{ marginBottom: 20 }}
            />

            {formError && <p style={{ color: "var(--red)", fontSize: "0.8rem", marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>{formError}</p>}
            {subscriptionRequired && (
              <div style={{ background: "var(--red-bg)", border: "1px solid #7f1d1d", borderRadius: 4, padding: "10px 14px", marginBottom: 12, fontSize: "0.8rem", color: "#fca5a5", fontFamily: "'Inter', sans-serif" }}>
                Subscription required. <Link href="/subscribe" style={{ color: "var(--red)" }}>Subscribe now</Link>.
              </div>
            )}
          </div>

          {/* Submit button */}
          <div style={{ padding: "0 24px 24px" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%", padding: "16px", background: saving ? "var(--green-dim)" : "var(--green)",
                border: "none", borderRadius: 4,
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.95rem",
                letterSpacing: "0.12em", textTransform: "uppercase", color: "#000",
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              {saving ? "SAVING..." : "VERIFY & SUBMIT"}
              {!saving && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#000" strokeWidth="2"/>
                  <path d="M8 12 L11 15 L16 9" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            {isEditing && (
              <button type="button" onClick={cancelEdit} className="btn-ghost" style={{ width: "100%", marginTop: 10 }}>
                CANCEL EDIT
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
