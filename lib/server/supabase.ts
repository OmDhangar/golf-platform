/**
 * lib/server/supabase.ts
 *
 * PRD §15: "Backend connected (e.g. Supabase) with proper schema"
 * PRD §13: "Secure authentication — JWT or session-based"
 *
 * Two clients:
 *  - createServerClient()      → uses anon key + user JWT for RLS enforcement
 *  - createAdminClient()       → uses service_role key, ONLY for admin routes
 *
 * SECURITY: service_role bypasses ALL RLS — never expose it to user routes.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/index";

// ---------------------------------------------------------------------------
// Validate required env vars at import time (fail fast on misconfiguration)
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "[Supabase] Missing required environment variables. " +
    "Check NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY."
  );
}

// ---------------------------------------------------------------------------
// USER CLIENT — RLS-enforced, tied to the requesting user's JWT
// ---------------------------------------------------------------------------
/**
 * Creates a Supabase client that operates under the authenticated user's JWT.
 * Row Level Security policies are fully enforced.
 * Use this in ALL user-facing API routes.
 *
 * @param authHeader - The Authorization header from the incoming request
 */
export function createServerClient(authHeader?: string): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
    auth: {
      // Disable auto-session management in server context
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// ---------------------------------------------------------------------------
// ADMIN CLIENT — Bypasses RLS. Only for admin-protected routes.
// ---------------------------------------------------------------------------
/**
 * Creates a Supabase client using the service_role key.
 * WARNING: Bypasses ALL Row Level Security. Use ONLY in admin routes
 * that have already verified the user's admin role.
 *
 * PRD §03 (Admin Role): Admins have full management capabilities.
 * PRD §11 (Admin Dashboard): Requires access to all records.
 */
export function createAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// ---------------------------------------------------------------------------
// HELPER: Extract + verify user from Authorization header
// ---------------------------------------------------------------------------
/**
 * Verifies a bearer token against Supabase Auth and returns the user.
 * Returns null if the token is missing or invalid.
 *
 * PRD §04: "Real-time subscription status check on every authenticated request"
 */
export async function getUserFromHeader(
  authHeader: string | null
): Promise<{ id: string; email: string; role: string } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  const client = createServerClient(authHeader);

  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;

  // Fetch the user's role from our public.users table
  const { data: profile } = await client
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    role: profile?.role ?? "user",
  };
}

// ---------------------------------------------------------------------------
// HELPER: Require admin role or throw 403
// ---------------------------------------------------------------------------
/**
 * Guards admin-only routes. Returns the admin user or throws.
 * PRD §11: Admin dashboard requires verified admin credentials.
 */
export async function requireAdmin(
  authHeader: string | null
): Promise<{ id: string; email: string; role: string }> {
  const user = await getUserFromHeader(authHeader);
  if (!user || user.role !== "admin") {
    throw new Error("FORBIDDEN: Admin access required");
  }
  return user;
}
