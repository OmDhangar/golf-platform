import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
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

async function getCharity(id: string): Promise<Charity | null> {
    const headerStore = await headers();
    const host = headerStore.get("host");
    const protocol = headerStore.get("x-forwarded-proto") ?? "http";
    const baseUrl = host ? `${protocol}://${host}` : "";

    const res = await fetch(`${baseUrl}/api/charities?id=${id}`, {
        cache: "no-store",
    });

    if (!res.ok) return null;

    const payload = (await res.json()) as { success: boolean; data?: { charity?: Charity } };
    return payload.success ? payload.data?.charity ?? null : null;
}

export default async function CharityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const charity = await getCharity(id);

    if (!charity) notFound();

    const events = parseEvents(charity.events);

    return (
        <main className="min-h-screen bg-white px-6 py-12 sm:px-10">
            <div className="mx-auto w-full max-w-4xl space-y-8">
                <header className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                        <Link href="/charities" className="text-sm font-medium text-rose-700 hover:text-rose-500">
                            ← Back to charities
                        </Link>
                        <h1 className="text-4xl font-semibold text-zinc-900">{charity.name}</h1>
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

                <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                    <p className="leading-7 text-zinc-700">{charity.description}</p>
                    {charity.website_url && (
                        <a
                            href={charity.website_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex text-sm font-semibold text-rose-700 hover:text-rose-500"
                        >
                            Visit official website ↗
                        </a>
                    )}
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-zinc-900">Upcoming and recent events</h2>
                    <ul className="mt-4 space-y-3">
                        {events.length > 0 ? (
                            events.map((event) => (
                                <li key={`${event.title}-${event.date}`} className="rounded-2xl border border-zinc-200 p-4">
                                    <p className="font-semibold text-zinc-900">{event.title}</p>
                                    <p className="text-sm text-zinc-500">{event.date}</p>
                                    {event.description && <p className="mt-2 text-sm text-zinc-700">{event.description}</p>}
                                </li>
                            ))
                        ) : (
                            <li className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
                                Event updates will appear here soon.
                            </li>
                        )}
                    </ul>
                </section>
            </div>
        </main>
    );
}
