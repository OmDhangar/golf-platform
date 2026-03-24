/**
 * middleware.ts
 *
 * PRD §04: "Non-subscribers receive restricted access to platform features"
 * PRD §04: "Real-time subscription status check on every authenticated request"
 * PRD §13: "Secure authentication — JWT or session-based, HTTPS enforced"
 *
 * This middleware runs on every request (before route handlers) and:
 *  1. Validates JWT tokens on protected routes
 *  2. Checks subscription status for subscriber-only routes
 *  3. Guards admin routes behind role check
 *  4. Allows public routes through without auth
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Route classification
// ---------------------------------------------------------------------------

/** Public API routes — no auth required */
const PUBLIC_ROUTES = [
  "/api/auth/signup",
  "/api/auth/login",
  "/api/webhook/razorpay",    // Webhook verified by HMAC, not JWT
  "/api/draws/publish",       // GET published draw results is public (RLS handles it)
  "/api/charities",           // PRD §08: "Public visitors can browse charities"
];

/** Routes that require admin role */
const ADMIN_ROUTES = [
  "/api/admin/",
  "/api/draws/simulate",
  "/api/draws/publish",       // POST is admin-only (GET is public)
];

/** Routes that require active subscription */
const SUBSCRIBER_ROUTES = [
  "/api/scores",
  "/api/winners/upload-proof",
];

// ---------------------------------------------------------------------------
// Helper: Check if path matches any route prefix
// ---------------------------------------------------------------------------
function matchesAny(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname.startsWith(route));
}

// ---------------------------------------------------------------------------
// Helper: Decode JWT without a full DB round-trip (fast path)
// For subscription check, we do need a DB call — but we cache logic in route handlers
// ---------------------------------------------------------------------------
function extractBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.replace("Bearer ", "").trim();
}

// ---------------------------------------------------------------------------
// MIDDLEWARE
// ---------------------------------------------------------------------------
export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // --- 1. Allow non-API routes (pages, static assets, etc.) ---
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // --- 2. Allow fully public API routes ---
  if (matchesAny(pathname, PUBLIC_ROUTES)) {
    // Special case: POST to /api/draws/publish is admin-only
    // GET is public — the route handler itself enforces this via RLS
    return NextResponse.next();
  }

  // --- 3. Extract token ---
  const token = extractBearerToken(req);

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Authentication required. Provide a Bearer token." },
      { status: 401 }
    );
  }

  // --- 4. Verify token with Supabase ---
  // We use the Supabase client directly here to avoid circular imports
  // (middleware cannot import from lib/server/supabase due to edge runtime constraints)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired token. Please log in again." },
      { status: 401 }
    );
  }

  // --- 5. Admin route guard ---
  if (matchesAny(pathname, ADMIN_ROUTES)) {
    // Fetch user role from DB
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Pass admin role in header so route handlers can skip a redundant DB call
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("X-User-Id", user.id);
    requestHeaders.set("X-User-Role", "admin");

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // --- 6. Subscription guard for subscriber-only routes ---
  // PRD §04: "Non-subscribers receive restricted access to platform features"
  if (matchesAny(pathname, SUBSCRIBER_ROUTES)) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!sub) {
      return NextResponse.json(
        {
          success: false,
          error: "Active subscription required. Please subscribe to access this feature.",
          code: "SUBSCRIPTION_REQUIRED",
        },
        { status: 403 }
      );
    }
  }

  // --- 7. Pass user context downstream via headers ---
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("X-User-Id", user.id);
  requestHeaders.set("X-User-Email", user.email ?? "");

  return NextResponse.next({ request: { headers: requestHeaders } });
}

// ---------------------------------------------------------------------------
// Route matcher — only run middleware on API routes
// Excludes static files, _next internals, favicon, etc.
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    "/api/:path*",
  ],
};
