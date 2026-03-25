import Link from "next/link";
import { headers } from "next/headers";

type Draw = {
    id: string;
    draw_month: string;
    winning_numbers: number[] | null;
    prize_pool_total_paise: number | null;
    jackpot_rollover_paise: number;
    published_at: string | null;
};

async function getPublishedDraws(): Promise<Draw[]> {
    const headerStore = await headers();
    const host = headerStore.get("host");
    const protocol = headerStore.get("x-forwarded-proto") ?? "http";
    const baseUrl = host ? `${protocol}://${host}` : "";

    const res = await fetch(`${baseUrl}/api/draws/publish`, {
        cache: "no-store",
    });

    if (!res.ok) return [];

    const payload = (await res.json()) as { success: boolean; data?: { draws?: Draw[] } };
    return payload.success ? payload.data?.draws ?? [] : [];
}

function formatCurrency(paise: number | null) {
    if (paise == null) return "—";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(paise / 100);
}

export default async function ResultsPage() {
    const draws = await getPublishedDraws();

    return (
        <main className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-100 sm:px-10">
            <div className="mx-auto w-full max-w-5xl space-y-8">
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">Published draws</p>
                        <h1 className="text-3xl font-semibold">Latest official results</h1>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/login" className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium">
                            Log in
                        </Link>
                        <Link href="/signup" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900">
                            Sign up
                        </Link>
                    </div>
                </header>

                <section className="space-y-4">
                    {draws.length > 0 ? (
                        draws.map((draw) => (
                            <article key={draw.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h2 className="text-xl font-semibold">{draw.draw_month}</h2>
                                    <p className="text-sm text-zinc-400">
                                        Published: {draw.published_at ? new Date(draw.published_at).toLocaleDateString() : "Unknown"}
                                    </p>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {(draw.winning_numbers ?? []).map((num) => (
                                        <span
                                            key={`${draw.id}-${num}`}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-300"
                                        >
                                            {num}
                                        </span>
                                    ))}
                                </div>

                                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl bg-zinc-800 p-3">
                                        <dt className="text-xs uppercase tracking-[0.12em] text-zinc-400">Prize pool</dt>
                                        <dd className="mt-1 text-lg font-semibold">{formatCurrency(draw.prize_pool_total_paise)}</dd>
                                    </div>
                                    <div className="rounded-xl bg-zinc-800 p-3">
                                        <dt className="text-xs uppercase tracking-[0.12em] text-zinc-400">Jackpot rollover</dt>
                                        <dd className="mt-1 text-lg font-semibold">{formatCurrency(draw.jackpot_rollover_paise)}</dd>
                                    </div>
                                </dl>
                            </article>
                        ))
                    ) : (
                        <p className="rounded-2xl border border-dashed border-zinc-700 p-6 text-zinc-400">
                            No published draws found yet.
                        </p>
                    )}
                </section>
            </div>
        </main>
    );
}
