/**
 * app/api/auth/signup/route.ts
 *
 * PRD §03: Public Visitor → Registered Subscriber flow
 * PRD §04: Subscription plan selected at signup
 * PRD §08: Charity selected at signup, minimum 10% contribution
 *
 * Testing checklist: "User signup & login"
 *
 * POST /api/auth/signup
 * Body: { email, password, full_name, charity_id?, charity_percent, plan_type }
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import { signupSchema } from "@/lib/server/validators";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";   // Winston requires Node.js runtime

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("POST /api/auth/signup");

  try {
    // --- 1. Parse and validate request body ---
    const body = await req.json().catch(() => ({}));
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      log.warn("Signup validation failed", { errors: parsed.error.flatten() });
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { email, password, full_name, charity_id, charity_percent, plan_type } = parsed.data;

    // --- 2. Create auth user via admin client ---
    // Using admin client here because the user isn't authenticated yet
    const supabase = createAdminClient();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // Auto-confirm for trainee evaluation — set to false in prod
      user_metadata: { full_name },
    });

    if (authError || !authData.user) {
      // Common case: email already registered
      if (authError?.message?.includes("already registered")) {
        return NextResponse.json(
          { success: false, error: "Email already registered" },
          { status: 409 }
        );
      }
      log.error("Auth user creation failed", { error: authError?.message });
      return NextResponse.json(
        { success: false, error: "Failed to create account" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;
    log.info("Auth user created", { userId, email });

    // --- 3. Insert user profile into public.users ---
    // RLS policy: "Users can insert own profile" — but we're using admin client here
    // because the user doesn't have a session yet during signup.
    const { error: profileError } = await supabase.from("users").insert({
      id: userId,
      email,
      full_name,
      role: "user",
      charity_id: charity_id ?? null,
      charity_percent: Math.max(charity_percent, 10),  // PRD §08: enforce min 10%
    } as any);

    if (profileError) {
      // Rollback: delete auth user if profile insert fails
      await supabase.auth.admin.deleteUser(userId);
      log.error("Profile insert failed — auth user rolled back", {
        userId,
        error: profileError.message,
      });
      return NextResponse.json(
        { success: false, error: "Account creation failed" },
        { status: 500 }
      );
    }

    log.info("User profile created", { userId, plan_type, charity_id });

    // --- 4. Return success — subscription creation is a separate step ---
    // PRD §04: Subscription flow is initiated by the client after signup
    // (Razorpay subscription requires a separate API call with payment confirmation)
    // For free plan users, skip subscription creation and redirect to plans page
    const nextStep = plan_type === "free" ? `/plans?plan=free&charity_id=${charity_id}` : `/plans?plan=${plan_type}&charity_id=${charity_id}`;
    
    return NextResponse.json(
      {
        success: true,
        data: {
          userId,
          email,
          message: plan_type === "free" 
            ? "Account created! Choose to finalize free or upgrade to paid plan."
            : "Account created. Please complete subscription payment.",
          nextStep,
          plan_type,
        },
        message: "Signup successful",
      },
      { status: 201 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Signup failed");
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
