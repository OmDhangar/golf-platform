import Link from "next/link";
import { headers } from "next/headers";
import type { Charity, CharityEvent } from "@/types";

function parseEvents(events: Charity["events"] | string | null): CharityEvent[] {
    if (!events) return [];
    if (Array.isArray(events)) return events;
    if (typeof events === "string") {
        try {
            const parsed: unknown = JSON.parse(events);
            return Array.isArray(parsed) ? (parsed as CharityEvent[]) : [];
        } catch {
            return [];
        }
    }
    return [];
}

async function getCharities(searchParams: { featured?: string; search?: string }): Promise<Charity[]> {
    const headerStore = await headers();
    const host = headerStore.get("host");
    const protocol = headerStore.get("x-forwarded-proto") ?? "http";
    const baseUrl = host ? `${protocol}://${host}` : "";
    const params = new URLSearchParams();

    if (searchParams.featured === "true") params.set("featured", "true");
    if (searchParams.search) params.set("search", searchParams.search);

    const query = params.toString();
    const res = await fetch(`${baseUrl}/api/charities${query ? `?${query}` : ""}`, {
        cache: "no-store",
    });

    if (!res.ok) return [];

    const payload = (await res.json()) as { success: boolean; data?: { charities?: Charity[] } };
    return payload.success ? payload.data?.charities ?? [] : [];
}

export default async function CharitiesPage({
    searchParams,
}: {
    searchParams: Promise<{ featured?: string; search?: string }>;
}) {
    const query = await searchParams;
    const charities = await getCharities(query);

    return (
        <main className="min-h-screen bg-zinc-50 px-6 py-12 sm:px-10">
            <div className="mx-auto w-full max-w-6xl space-y-8">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">Charities</p>
                        <h1 className="text-3xl font-semibold text-zinc-900">Support causes with visible community impact</h1>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/login" className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium">
                            Log in
                        </Link>
                        <Link href="/signup" className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
                            Sign up
                        </Link>
                    </div>
                </header>

                <form className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto]" method="GET">
                    <input
                        type="text"
                        name="search"
                        defaultValue={query.search ?? ""}
                        placeholder="Search charities..."
                        className="rounded-xl border border-zinc-200 px-4 py-2 outline-none ring-rose-300 focus:ring"
                    />
                    <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium">
                        <input type="checkbox" name="featured" value="true" defaultChecked={query.featured === "true"} />
                        Featured only
                    </label>
                    <button type="submit" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
                        Apply filters
                    </button>
                </form>

                <section className="grid gap-4 md:grid-cols-2">
                    {charities.map((charity) => {
                        const events = parseEvents(charity.events);
                        return (
                            <article key={charity.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        {charity.logo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={charity.logo_url}
                                                alt={`${charity.name} logo`}
                                                className="h-14 w-14 rounded-xl border border-zinc-200 object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-500">
                                                LOGO
                                            </div>
                                        )}
                                        <h2 className="text-xl font-semibold text-zinc-900">{charity.name}</h2>
                                    </div>
                                    {charity.is_featured && (
                                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                                            Featured
                                        </span>
                                    )}
                                </div>

                                <p className="mt-4 text-sm leading-6 text-zinc-600">{charity.description}</p>

                                <div className="mt-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Event highlights</p>
                                    <ul className="mt-2 space-y-2 text-sm text-zinc-700">
                                        {events.length > 0 ? (
                                            events.slice(0, 2).map((event) => (
                                                <li key={`${charity.id}-${event.title}-${event.date}`} className="rounded-lg bg-zinc-50 px-3 py-2">
                                                    <p className="font-medium">{event.title}</p>
                                                    <p className="text-xs text-zinc-500">{event.date}</p>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="rounded-lg bg-zinc-50 px-3 py-2 text-zinc-500">No events added yet.</li>
                                        )}
                                    </ul>
                                </div>

                                <Link href={`/charities/${charity.id}`} className="mt-5 inline-flex text-sm font-semibold text-rose-700 hover:text-rose-500">
                                    View charity profile →
                                </Link>
                            </article>
                        );
                    })}
                </section>
            </div>
        </main>
    );
}
