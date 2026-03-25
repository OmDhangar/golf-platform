"use client";

import { FormEvent, useState } from "react";
import { admin } from "@/lib/api/endpoints/admin";

export default function AdminDrawsPage() {
  const [drawId, setDrawId] = useState("");
  const [mode, setMode] = useState("random");
  const [result, setResult] = useState<unknown>(null);

  async function onSimulate(event: FormEvent) {
    event.preventDefault();
    const data = await admin.simulateDraw({ draw_id: drawId, mode });
    setResult(data);
  }

  async function onPublish(): Promise<void> {
    const data = await admin.publishDraw({ draw_id: drawId, mode });
    setResult(data);
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <form onSubmit={onSimulate} className="flex flex-wrap items-end gap-2">
        <label className="text-sm">Draw ID<input className="ml-2 rounded border px-3 py-2" value={drawId} onChange={(e) => setDrawId(e.target.value)} required /></label>
        <label className="text-sm">Mode
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="ml-2 rounded border px-3 py-2">
            <option value="random">random</option>
            <option value="algorithmic">algorithmic</option>
          </select>
        </label>
        <button className="rounded bg-zinc-900 px-4 py-2 text-white">Simulate draw</button>
        <button type="button" onClick={onPublish} className="rounded border border-emerald-300 px-4 py-2 text-emerald-700">Publish draw</button>
      </form>
      <pre className="overflow-auto rounded bg-zinc-900 p-4 text-xs text-zinc-100">{JSON.stringify(result, null, 2)}</pre>
    </section>
  );
}
