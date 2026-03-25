"use client";

import { FormEvent, useState } from "react";
import { admin } from "@/lib/api/endpoints/admin";

export default function AdminWinnersPage() {
  const [winnerId, setWinnerId] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [result, setResult] = useState<unknown>(null);

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
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <p className="text-sm text-zinc-600">Review submitted proof and update payout status using winner record ID.</p>
      <form className="space-y-3">
        <input className="w-full rounded border px-3 py-2" placeholder="Winner ID" value={winnerId} onChange={(e) => setWinnerId(e.target.value)} required />
        <textarea className="w-full rounded border px-3 py-2" placeholder="Admin note (optional)" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button className="rounded border border-emerald-300 px-4 py-2 text-emerald-700" onClick={(e) => void onReview(e, "approve")}>Approve proof</button>
          <button className="rounded border border-amber-300 px-4 py-2 text-amber-700" onClick={(e) => void onReview(e, "reject")}>Reject proof</button>
          <button type="button" className="rounded border border-blue-300 px-4 py-2 text-blue-700" onClick={onMarkPaid}>Mark paid</button>
        </div>
      </form>
      <pre className="overflow-auto rounded bg-zinc-900 p-4 text-xs text-zinc-100">{JSON.stringify(result, null, 2)}</pre>
    </section>
  );
}
