"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const links = [
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/draws", label: "MONTHLY DRAW" },
  { href: "/charities", label: "CHARITY" },
  { href: "/scores", label: "SCORE LOG" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user email from session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("golf_platform_auth");
    if (stored) {
      try {
        const { user_email } = JSON.parse(stored);
        setUserEmail(user_email);
      } catch (err) {
        console.error("Failed to parse auth session:", err);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  async function handleLogout() {
    sessionStorage.removeItem("golf_platform_auth");
    sessionStorage.removeItem("golf_platform_auth_context");
    router.push("/login");
  }

  return (
    <header
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
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
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Logo */}
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
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
              fontSize: "0.95rem",
              letterSpacing: "0.04em",
              color: "var(--text-primary)",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            HEA
          </span>
        </Link>

        {/* Nav Links - Desktop */}
        <nav
          style={{
            display: "flex",
            gap: 28,
            alignItems: "center",
            flex: 1,
            justifyContent: "center",
            minWidth: 0,
          }}
        >
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
                  whiteSpace: "nowrap",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section - User Avatar & Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          {/* Hamburger Menu - Mobile Only */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              color: "var(--text-muted)",
              "@media (max-width: 767px)": {
                display: "block",
              },
            } as any}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* User Dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
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
                padding: 0,
                transition: "all 0.2s",
                boxShadow: showDropdown ? "0 0 0 2px var(--green)" : "none",
              }}
              aria-label="User menu"
              title="User menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="var(--text-muted)" />
                <path d="M4 20 C4 16 8 13 12 13 C16 13 20 16 20 20" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 8,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  minWidth: 240,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  overflow: "hidden",
                  zIndex: 1000,
                }}
              >
                {/* User Info Section */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    backgroundColor: "var(--bg-surface)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 4,
                    }}
                  >
                    Account
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--text-primary)",
                      fontWeight: 600,
                      wordBreak: "break-all",
                    }}
                  >
                    {userEmail || "User"}
                  </div>
                </div>

                {/* Menu Items */}
                <div style={{ padding: "8px 0" }}>
                  <Link
                    href="/dashboard"
                    onClick={() => setShowDropdown(false)}
                    style={{
                      display: "block",
                      padding: "12px 16px",
                      fontSize: "0.9rem",
                      color: "var(--text-primary)",
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-surface)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    Dashboard
                  </Link>

                  <div
                    style={{
                      height: "1px",
                      background: "var(--border)",
                      margin: "8px 0",
                    }}
                  />

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleLogout();
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      fontSize: "0.9rem",
                      color: "#ef4444",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-surface)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            padding: "12px 0",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-surface)",
            width: "100%",
          }}
        >
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setShowMobileMenu(false)}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  letterSpacing: "0.1em",
                  color: active ? "var(--green)" : "var(--text-muted)",
                  textDecoration: "none",
                  padding: "12px 24px",
                  borderLeft: active ? "3px solid var(--green)" : "3px solid transparent",
                  transition: "all 0.15s",
                  display: "block",
                  backgroundColor: active ? "var(--bg-deep)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
