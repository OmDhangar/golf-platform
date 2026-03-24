/**
 * app/api/subscriptions/create/route.ts
 *
 * PRD §04: Subscription & Payment System
 * - Monthly and Yearly plans
 * - Razorpay subscription creation
 * - Charity contribution calculation (PRD §08)
 * - Prize pool contribution calculation (PRD §07)
 *
 * Testing checklist: "Subscription flow (monthly and yearly)"
 *
 * POST /api/subscriptions/create
 * Headers: Authorization: Bearer <token>
 * Body: { plan_type, charity_id, charity_percent }
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeader, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import { createSubscriptionSchema } from "@/lib/server/validators";
import {
  createRazorpaySubscription,
  calcPrizePoolContribution,
  calcCharityContribution,
  PLANS,
  type PlanType,
} from "@/lib/server/razorpay";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("POST /api/subscriptions/create");

  try {
    // --- 1. Authenticate user ---
    const authHeader = req.headers.get("Authorization");
    const user = await getUserFromHeader(authHeader);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    log.info("Subscription create request", { userId: user.id });

    // --- 2. Validate request body ---
    const body = await req.json().catch(() => ({}));
    const parsed = createSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { plan_type, charity_id, charity_percent } = parsed.data;
    const plan = PLANS[plan_type as PlanType];

    // --- 3. Check for existing active subscription ---
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["active", "created", "authenticated"])
      .maybeSingle();

    if (existing) {
      log.warn("User already has active subscription", { userId: user.id, existing });
      return NextResponse.json(
        { success: false, error: "You already have an active subscription" },
        { status: 409 }
      );
    }

    // --- 4. Validate charity exists ---
    const { data: charity, error: charityError } = await supabase
      .from("charities")
      .select("id, name")
      .eq("id", charity_id)
      .single();

    if (charityError || !charity) {
      return NextResponse.json(
        { success: false, error: "Invalid charity selected" },
        { status: 400 }
      );
    }

    // --- 5. Pre-calculate contribution amounts ---
    // PRD §07: Prize pool auto-calculation
    const prizePoolContribution = calcPrizePoolContribution(plan.amount);
    // PRD §08: Charity contribution (min 10%)
    const charityContribution = calcCharityContribution(plan.amount, charity_percent);

    log.info("Contribution calculations", {
      planAmount: plan.amount,
      prizePoolContribution,
      charityContribution,
      charityPercent: charity_percent,
    });

    // --- 6. Create Razorpay subscription ---
    let razorpaySubscriptionId: string;
    let shortUrl: string;

    try {
      const result = await createRazorpaySubscription(
        plan_type as PlanType,
        user.email,
        user.id,  // pass as name — will be resolved to full_name in webhook
        plan_type === "yearly" ? 1 : 12  // yearly = 1 cycle, monthly = 12 cycles
      );
      razorpaySubscriptionId = result.subscriptionId;
      shortUrl = result.shortUrl;
    } catch (rzpError) {
      log.error("Razorpay subscription creation failed", { error: rzpError });
      return NextResponse.json(
        { success: false, error: "Payment gateway error. Please try again." },
        { status: 502 }
      );
    }

    // --- 7. Persist subscription record (status: 'created' until payment confirmed) ---
    // PRD §04: Lifecycle — starts as 'created', moves to 'active' via webhook
    const { data: subscription, error: insertError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        razorpay_subscription_id: razorpaySubscriptionId,
        razorpay_plan_id: plan.id,
        plan_type,
        status: "created",
        prize_pool_contribution_paise: prizePoolContribution,
        charity_contribution_paise: charityContribution,
        current_period_start: null,
        current_period_end: null,
      })
      .select()
      .single();

    if (insertError || !subscription) {
      log.error("Subscription DB insert failed", { error: insertError?.message });
      return NextResponse.json(
        { success: false, error: "Failed to create subscription record" },
        { status: 500 }
      );
    }

    // --- 8. Update user's charity selection ---
    await supabase
      .from("users")
      .update({
        charity_id,
        charity_percent: Math.max(charity_percent, 10),
      })
      .eq("id", user.id);

    log.info("Subscription created", {
      userId: user.id,
      subscriptionId: subscription.id,
      razorpaySubscriptionId,
    });

    // --- 9. Return payment link for client to redirect ---
    return NextResponse.json(
      {
        success: true,
        data: {
          subscription_id: subscription.id,
          razorpay_subscription_id: razorpaySubscriptionId,
          payment_url: shortUrl,  // Redirect user here to complete payment
          plan: {
            type: plan_type,
            label: plan.label,
            amount_paise: plan.amount,
          },
          contributions: {
            prize_pool_paise: prizePoolContribution,
            charity_paise: charityContribution,
            charity_name: charity.name,
          },
        },
        message: "Subscription created. Redirect user to payment_url.",
      },
      { status: 201 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Subscription creation failed");
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
