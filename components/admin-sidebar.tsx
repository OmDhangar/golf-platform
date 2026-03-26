"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  open?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onClose?: () => void;
}

const navItems = [
  {
    href: "/admin",
    label: "DASHBOARD",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
        <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" />
        <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
        <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "VERIFICATIONS",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 8 L7 10 L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/admin/draws",
    label: "DRAW ENGINE",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/admin/reports",
    label: "SETTINGS",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.41 1.41M11.37 11.37l1.41 1.41M3.22 12.78l1.41-1.41M11.37 4.63l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function AdminSidebar({ open = false, collapsed = false, onToggleCollapsed, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`${open ? "admin-sidebar admin-sidebar-open" : "admin-sidebar"} animate-slide-left`}
      style={{
        width: collapsed ? 76 : 240,
        minHeight: "100vh",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 2500,
      }}
    >
      {/* Header */}
      <div style={{ padding: collapsed ? "18px 14px" : "24px 20px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <p
          className="font-barlow animate-fade-in"
          style={{
            fontWeight: 800,
            fontSize: "1.05rem",
            letterSpacing: "0.06em",
            color: "var(--text-primary)",
            textTransform: "uppercase",
            display: collapsed ? "none" : "block",
            whiteSpace: "nowrap",
          }}
        >
          ADMIN PANEL
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={onToggleCollapsed}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: onToggleCollapsed ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            aria-label="Toggle sidebar"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5"
              style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Only shown on mobile to close the overlay */}
          <button
            className="admin-mobile-only"
            onClick={onClose}
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "var(--red)",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "none", // Hidden by default, shown via CSS
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
            }}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 0", flex: 1 }}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 20px",
                textDecoration: "none",
                background: isActive ? "var(--sidebar-active)" : "transparent",
                borderLeft: isActive ? "3px solid var(--green)" : "3px solid transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                marginBottom: 2,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <span style={{ color: isActive ? "var(--green)" : "var(--text-muted)", lineHeight: 0 }}>
                {item.icon}
              </span>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  display: collapsed ? "none" : "inline",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
