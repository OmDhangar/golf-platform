"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { getAccessToken, getUserRole } from "@/lib/auth/store";
import { admin } from "@/lib/api/endpoints/admin";
import { ApiClientError } from "@/lib/api/client";

const tabs = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/charities", label: "Charities" },
  { href: "/admin/draws", label: "Draws" },
  { href: "/admin/winners", label: "Winners" },
  { href: "/admin/reports", label: "Reports" },
];

export default function AdminLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeTab = useMemo(
    () => tabs.find((tab) => pathname.startsWith(tab.href))?.href,
    [pathname]
  );

  useEffect(() => {
    async function guardAdminRoute(): Promise<void> {
      const token = getAccessToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const role = getUserRole();
      if (role && role !== "admin") {
        router.replace("/unauthorized");
        return;
      }

      try {
        // Server-side role validation: this endpoint is admin-only.
        await admin.reports({ include: ["users"] });
        setError(null);
      } catch (err) {
        if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
          router.replace(err.status === 401 ? "/login" : "/unauthorized");
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to validate admin session");
      } finally {
        setChecking(false);
      }
    }

    void guardAdminRoute();
  }, [router]);

  if (checking) {
    return <main className="p-6 text-sm text-zinc-600">Validating admin access…</main>;
  }

  if (error) {
    return <main className="p-6 text-sm text-red-700">{error}</main>;
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Admin</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Control panel</h1>
        </header>

        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 bg-white text-zinc-700"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </main>
  );
}
