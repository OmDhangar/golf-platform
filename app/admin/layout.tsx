"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PropsWithChildren } from "react";
import AdminSidebar from "@/components/admin-sidebar";
import { getAccessToken, getUserRole } from "@/lib/auth/store";
import { admin } from "@/lib/api/endpoints/admin";
import { ApiClientError } from "@/lib/api/client";

export default function AdminLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function guardAdminRoute(): Promise<void> {
      const token = getAccessToken();
      if (!token) { router.replace("/login"); return; }
      const role = getUserRole();
      if (role && role !== "admin") { router.replace("/unauthorized"); return; }
      try {
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
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-deep)" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", opacity: 0.6, animation: `pulse 1.2s ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-deep)" }}>
        <p style={{ color: "var(--red)", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-deep)" }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
