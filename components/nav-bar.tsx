"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useClientAuthStore, clearAuthTokens, hydrateAuthStore } from "@/lib/auth/store";
import { useGetDashboardRoute } from "@/lib/auth/use-get-dashboard-route";

interface NavBarProps {
  variant?: "dashboard" | "homepage";
  showAuthButtons?: boolean;
}

const dashboardLinks = [
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/draws", label: "MONTHLY DRAW" },
  { href: "/charities", label: "CHARITY" },
  { href: "/results", label: "RESULTS" },
];

const homepageLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "#mechanics", label: "Mechanics" },
  { href: "#pricing", label: "Pricing" },
];

const adminLinks = [
  { href: "/admin", label: "DASHBOARD" },
  { href: "/admin/users", label: "VERIFICATIONS" },
  { href: "/admin/draws", label: "DRAW ENGINE" },
  { href: "/admin/reports", label: "SETTINGS" },
];

export default function NavBar({ variant = "dashboard", showAuthButtons = false }: NavBarProps) {

  const pathname = usePathname();
  const router = useRouter();
  const dashboardRoute = useGetDashboardRoute();
  const isAdminRoute = pathname.startsWith("/admin");

  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const { session } = useClientAuthStore();
  const isLoggedIn = Boolean(session?.access_token);
  const userEmail = session?.email;

  useEffect(() => {
    hydrateAuthStore();
  }, []);

  const links = isAdminRoute ? adminLinks : (variant === "homepage" ? homepageLinks : dashboardLinks);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  async function handleLogout() {
    clearAuthTokens();
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
        }}
      >

        {/* LOGO */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <span
            style={{
              width: 28,
              height: 28,
              background: "var(--green)",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 13 L8 2 L13 13" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M5 9 L11 9" stroke="#000" strokeWidth="2" />
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
            }}
          >
            Merit Golf
          </span>
        </Link>


        {/* DESKTOP NAV LINKS */}
        <nav
          className="nav-desktop"
          style={{
            display: "flex",
            gap: 28,
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
          }}
        >
          {links.map((link) => {

            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            const isHomepageLink = variant === "homepage" && link.href.startsWith("#");

            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: active ? "var(--green)" : "var(--text-muted)",
                  textDecoration: "none",
                  borderBottom: active ? "2px solid var(--green)" : "2px solid transparent",
                }}
                onClick={(e) => {
                  if (isHomepageLink) {
                    e.preventDefault();
                    const element = document.querySelector(link.href);
                    if (element) element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>


        {/* RIGHT SECTION */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

          {/* USER ICON */}
          {isLoggedIn && (
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
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" fill="var(--text-muted)" />
                  <path d="M4 20 C4 16 8 13 12 13 C16 13 20 16 20 20"
                    stroke="var(--text-muted)" strokeWidth="2" />
                </svg>
              </button>

              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    marginTop: 8,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    minWidth: 220,
                    overflow: "hidden",
                  }}
                >

                  <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      ACCOUNT
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {userEmail || "User"}
                    </div>
                  </div>

                  <Link
                    href={dashboardRoute}
                    onClick={() => setShowDropdown(false)}
                    style={{ display: "block", padding: 12, textDecoration: "none" }}
                  >
                    Dashboard
                  </Link>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleLogout();
                    }}
                    style={{
                      width: "100%",
                      padding: 12,
                      textAlign: "left",
                      border: "none",
                      background: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                    }}
                  >
                    Logout
                  </button>

                </div>
              )}

            </div>
          )}


          {/* HAMBURGER */}
          <button
            className="nav-hamburger"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" />
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" />
              <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: showMobileMenu ? "rgba(0,0,0,0.45)" : "transparent",
          pointerEvents: showMobileMenu ? "auto" : "none",
          transition: "background 0.25s ease",
          zIndex: 200,
        }}
        onClick={() => setShowMobileMenu(false)}
      >

        {/* Drawer */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            height: "100%",
            width: 280,
            background: "var(--bg-card)",
            padding: "28px 22px",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.35)",
            transform: showMobileMenu ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.28s cubic-bezier(.4,.0,.2,1)",
            display: "flex",
            flexDirection: "column",
          }}
        >

          {/* Title */}
          <div
            style={{
              fontWeight: 700,
              fontSize: "1rem",
              marginBottom: 28,
              letterSpacing: "0.05em",
            }}
          >
            MENU
          </div>

          {/* Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: "12px 10px",
                  borderRadius: 6,
                  textDecoration: "none",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-surface)";
                  e.currentTarget.style.paddingLeft = "14px";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.paddingLeft = "10px";
                }}
              >
                {link.label}
              </Link>
            ))}

          </div>


          {/* Auth Buttons */}
          {!isLoggedIn && showAuthButtons && (

            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>

              {/* LOGIN */}
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  router.push("/login");
                }}
                style={{
                  padding: "12px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
              >
                LOGIN
              </button>


              {/* CTA */}
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  router.push("/signup");
                }}
                style={{
                  padding: "12px",
                  borderRadius: 6,
                  border: "none",
                  background: "var(--green)",
                  color: "#000",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
              >
                START YOUR JOURNEY
              </button>

            </div>

          )}

        </div>
      </div>

    </header>
  );
}