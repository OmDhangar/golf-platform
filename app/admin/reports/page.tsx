"use client";

import { useEffect, useState } from "react";
import { admin } from "@/lib/api/endpoints/admin";

interface ReportData {
  users?: { total?: number; active_subscribers?: number };
  prize_pool?: { current_pool_inr?: string };
  charity?: { total_contributed_inr?: string };
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void admin.reports().then((reports) => {
      if (!active) return;
      setData((reports as ReportData) ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  if (loading) return <section className="rounded-2xl border bg-var(--bg-deep) p-5">Loading reports…</section>;

  return (
    <section className="space-y-4 rounded-2xl  bg-var(--bg-deep) p-5">
      <h2 className="text-xl font-semibold">Analytics dashboards</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <article className="rounded border p-3"><p className="text-xs text-zinc-500">Total users</p><p className="text-2xl font-semibold">{data?.users?.total ?? 0}</p></article>
        <article className="rounded border p-3"><p className="text-xs text-zinc-500">Active subscribers</p><p className="text-2xl font-semibold">{data?.users?.active_subscribers ?? 0}</p></article>
        <article className="rounded border p-3"><p className="text-xs text-zinc-500">Prize pool (INR)</p><p className="text-2xl font-semibold">₹{data?.prize_pool?.current_pool_inr ?? "0.00"}</p></article>
        <article className="rounded border p-3"><p className="text-xs text-zinc-500">Charity total (INR)</p><p className="text-2xl font-semibold">₹{data?.charity?.total_contributed_inr ?? "0.00"}</p></article>
      </div>
      <pre className="overflow-auto rounded bg-zinc-900 p-4 text-xs text-zinc-100">{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}
