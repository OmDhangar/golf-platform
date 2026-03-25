"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/draws", label: "MONTHLY DRAW" },
  { href: "/charities", label: "CHARITY" },
  { href: "/scores", label: "SCORE LOG" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
        }}
      >
        {/* Logo */}
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <span
            style={{
              width: 28,
              height: 28,
              background: "var(--green)",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 13 L8 2 L13 13" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 9 L11 9" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: "0.04em",
              color: "var(--text-primary)",
              textTransform: "uppercase",
            }}
          >
            High-Energy Athletic
          </span>
        </Link>

        {/* Nav Links */}
        <nav style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  letterSpacing: "0.1em",
                  color: active ? "var(--green)" : "var(--text-muted)",
                  textDecoration: "none",
                  paddingBottom: 4,
                  borderBottom: active ? "2px solid var(--green)" : "2px solid transparent",
                  transition: "color 0.15s",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill="var(--text-muted)" />
            <path d="M4 20 C4 16 8 13 12 13 C16 13 20 16 20 20" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </header>
  );
}
