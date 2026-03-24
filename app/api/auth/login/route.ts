/**
 * app/api/auth/login/route.ts
 *
 * PRD §04: "Real-time subscription status check on every authenticated request"
 * PRD §10: User Dashboard — subscription status returned on login
 *
 * Testing checklist: "User signup & login"
 *
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { access_token, user, subscription_status }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import { loginSchema } from "@/lib/server/validators";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("POST /api/auth/login");

  try {
    // --- 1. Validate request body ---
    const body = await req.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { email, password } = parsed.data;

    // --- 2. Sign in with Supabase Auth ---
    // Use anon client for sign-in (no auth header yet)
    const supabase = createServerClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session || !authData.user) {
      log.warn("Login failed — invalid credentials", {
        email,
        supaError: authError?.message || "No specific error message provided by Supabase"
      });
      return NextResponse.json(
        { success: false, error: authError?.message || "Invalid email or password" },
        { status: 401 }
      );
    }

    const { access_token, refresh_token, expires_at } = authData.session;
    const userId = authData.user.id;

    log.info("Login successful", { userId, email });

    // --- 3. Fetch user profile + subscription status ---
    // PRD §04: "Real-time subscription status check on every authenticated request"
    const adminClient = createAdminClient();

    const [profileResult, subscriptionResult] = await Promise.all([
      adminClient.from("users").select("*").eq("id", userId).single(),
      adminClient
        .from("subscriptions")
        .select("id, status, plan_type, current_period_end, prize_pool_contribution_paise")
        .eq("user_id", userId)
        .in("status", ["active", "created", "authenticated"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (profileResult.error) {
      log.error("Profile fetch failed post-login", { userId, error: profileResult.error.message });
    }

    const subscription = subscriptionResult.data;

    // --- 4. Return token + user context ---
    return NextResponse.json(
      {
        success: true,
        data: {
          access_token,
          refresh_token,
          expires_at,
          user: profileResult.data ?? { id: userId, email },
          subscription: subscription
            ? {
              id: subscription.id,
              status: subscription.status,
              plan_type: subscription.plan_type,
              renewal_date: subscription.current_period_end,  // PRD §10
            }
            : null,
          // PRD §04: Inform client if subscription is inactive
          has_active_subscription: subscription?.status === "active",
        },
        message: "Login successful",
      },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Login failed");
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
