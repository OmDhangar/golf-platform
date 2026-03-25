import Link from "next/link";

const experiencePillars = [
  {
    title: "Feel the impact",
    body: "Every score entry can become practical support for causes players actually care about.",
  },
  {
    title: "Belong to a mission",
    body: "Choose a charity, follow its events, and see how your participation drives monthly outcomes.",
  },
  {
    title: "Win with purpose",
    body: "Published draw results and transparent allocations keep the excitement grounded in trust.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-sky-50 text-zinc-900">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:px-10 lg:py-24">

        <nav className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">
            Golf Platform
          </p>

          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:border-zinc-500"
            >
              Log in
            </Link>

            <Link
              href="/signup"
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              Join now
            </Link>
          </div>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">

          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
              Play. Support. Celebrate.
            </p>

            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Make every round feel personal, meaningful, and worth sharing.
            </h1>

            <p className="max-w-xl text-lg text-zinc-600">
              A monthly experience built around community energy—not tired golf clichés.
              Choose the charities you care about, track featured causes, and follow
              published draw outcomes in one place.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/charities"
                className="rounded-full bg-rose-600 px-6 py-3 font-semibold text-white transition hover:bg-rose-500"
              >
                Explore charities
              </Link>

              <Link
                href="/results"
                className="rounded-full border border-rose-200 bg-white px-6 py-3 font-semibold text-rose-700 transition hover:border-rose-400"
              >
                View published results
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">
              Why players stay
            </p>

            <ul className="mt-4 space-y-5">
              {experiencePillars.map((pillar) => (
                <li key={pillar.title} className="rounded-2xl bg-zinc-50 p-4">
                  <h2 className="font-semibold text-zinc-900">
                    {pillar.title}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    {pillar.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>
    </main>
  );
}