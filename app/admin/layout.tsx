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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    <div className="admin-shell" style={{ display: "flex", minHeight: "100vh", background: "var(--bg-deep)" }}>
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <AdminSidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="admin-mobile-topbar" style={{ padding: "12px 16px" }}>
          <button className="admin-mobile-topbar-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="admin-mobile-topbar-title">Admin</div>
          <div style={{ width: 44 }} />
        </div>

        {children}
      </div>
    </div>
  );
}
