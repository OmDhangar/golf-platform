/**
 * app/api/webhook/razorpay/route.ts
 *
 * PRD §04: Subscription lifecycle — renewal, cancellation, lapsed states
 * PRD §07: Prize pool auto-calculation on each payment
 * PRD §08: Charity donation auto-creation on each payment
 * PRD §13: Email notifications on subscription events
 *
 * Testing checklist: "Subscription flow (monthly and yearly)"
 *
 * POST /api/webhook/razorpay
 * Headers: X-Razorpay-Signature: <hmac>
 *
 * SECURITY: Raw body must be read BEFORE parsing to verify HMAC signature.
 * This route uses Next.js edge-compatible raw body reading.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import {
  verifyWebhookSignature,
  calcPrizePoolContribution,
  calcCharityContribution,
  PLANS,
} from "@/lib/server/razorpay";
import {
  sendSubscriptionConfirmation,
  sendSubscriptionLapsedNotice,
} from "@/lib/server/mailer";
import type { ApiResponse, SubscriptionStatus } from "@/types/index";

export const runtime = "nodejs";

// Razorpay webhook events we handle
const HANDLED_EVENTS = [
  "subscription.activated",
  "subscription.charged",       // Payment received — create donation record
  "subscription.cancelled",
  "subscription.completed",
  "subscription.halted",        // Payment failed / lapsed
  "subscription.paused",
  "subscription.resumed",
] as const;

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("POST /api/webhook/razorpay");

  try {
    // --- 1. Read raw body (required for HMAC verification) ---
    const rawBody = await req.text();
    const signature = req.headers.get("X-Razorpay-Signature") ?? "";

    // --- 2. Verify webhook signature ---
    // PRD §04 (security): Must verify Razorpay webhook authenticity
    try {
      verifyWebhookSignature(rawBody, signature);
    } catch {
      log.warn("Webhook signature verification failed");
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    // --- 3. Parse the verified body ---
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const event = payload.event as string;
    log.info("Webhook received", { event });

    if (!HANDLED_EVENTS.includes(event as any)) {
      // Acknowledge unhandled events — prevents Razorpay retry storms
      return NextResponse.json({ success: true, data: { ignored: true } }, { status: 200 });
    }

    const subscriptionEntity = payload?.payload?.subscription?.entity;
    const paymentEntity = payload?.payload?.payment?.entity;

    if (!subscriptionEntity) {
      log.warn("Webhook missing subscription entity", { event });
      return NextResponse.json({ success: true, data: { skipped: true } }, { status: 200 });
    }

    const razorpaySubscriptionId: string = subscriptionEntity.id;
    const supabase = createAdminClient();

    // --- 4. Find our subscription record ---
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*, users(id, email, full_name, charity_id, charity_percent)")
      .eq("razorpay_subscription_id", razorpaySubscriptionId)
      .single();

    if (subError || !subscription) {
      log.warn("Subscription not found for webhook", { razorpaySubscriptionId, event });
      // Return 200 so Razorpay doesn't retry — we'll reconcile via admin tools
      return NextResponse.json({ success: true, data: { notFound: true } }, { status: 200 });
    }

    const user = subscription.users as any;

    // --- 5. Handle each event type ---
    switch (event) {

      // -----------------------------------------------------------------------
      // SUBSCRIPTION ACTIVATED — First payment done, user is now a subscriber
      // -----------------------------------------------------------------------
      case "subscription.activated": {
        const currentEnd = subscriptionEntity.current_end
          ? new Date(subscriptionEntity.current_end * 1000).toISOString()
          : null;
        const currentStart = subscriptionEntity.current_start
          ? new Date(subscriptionEntity.current_start * 1000).toISOString()
          : new Date().toISOString();

        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_start: currentStart,
            current_period_end: currentEnd,
          })
          .eq("id", subscription.id);

        log.info("Subscription activated", { subscriptionId: subscription.id, userId: user.id });

        // PRD §13: Send confirmation email
        if (user?.email) {
          await sendSubscriptionConfirmation(
            user.email,
            user.full_name ?? "Subscriber",
            subscription.plan_type === "monthly" ? "Monthly Plan" : "Yearly Plan",
            currentEnd ? new Date(currentEnd).toLocaleDateString("en-IN") : "N/A"
          );
        }
        break;
      }

      // -----------------------------------------------------------------------
      // SUBSCRIPTION CHARGED — Recurring payment received
      // Creates donation record for this billing cycle
      // PRD §08: "Independent donation option" + subscription share
      // PRD §07: Prize pool contribution tracked per cycle
      // -----------------------------------------------------------------------
      case "subscription.charged": {
        if (!paymentEntity) break;

        const amountPaise: number = paymentEntity.amount;
        const prizeContrib = calcPrizePoolContribution(amountPaise);
        const charityContrib = calcCharityContribution(
          amountPaise,
          user?.charity_percent ?? 10
        );

        // Update subscription billing period
        const currentEnd = subscriptionEntity.current_end
          ? new Date(subscriptionEntity.current_end * 1000).toISOString()
          : subscription.current_period_end;

        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_end: currentEnd,
            prize_pool_contribution_paise: prizeContrib,
            charity_contribution_paise: charityContrib,
          })
          .eq("id", subscription.id);

        // PRD §08: Auto-create donation record for this billing cycle
        if (user?.charity_id) {
          await supabase.from("donations").insert({
            user_id: subscription.user_id,
            charity_id: user.charity_id,
            amount_paise: charityContrib,
            type: "subscription_share",
            subscription_id: subscription.id,
            notes: `Auto-generated from subscription charge. Payment: ${paymentEntity.id}`,
          });
          log.info("Donation record created", {
            userId: subscription.user_id,
            charityId: user.charity_id,
            amountPaise: charityContrib,
          });
        }

        log.info("Subscription charged", {
          subscriptionId: subscription.id,
          amountPaise,
          prizeContrib,
          charityContrib,
        });
        break;
      }

      // -----------------------------------------------------------------------
      // SUBSCRIPTION CANCELLED — PRD §04: Handle cancellation lifecycle
      // -----------------------------------------------------------------------
      case "subscription.cancelled": {
        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("id", subscription.id);

        log.info("Subscription cancelled", { subscriptionId: subscription.id });

        if (user?.email) {
          await sendSubscriptionLapsedNotice(user.email, user.full_name ?? "Subscriber");
        }
        break;
      }

      // -----------------------------------------------------------------------
      // SUBSCRIPTION COMPLETED — All billing cycles done
      // -----------------------------------------------------------------------
      case "subscription.completed": {
        await supabase
          .from("subscriptions")
          .update({ status: "completed" })
          .eq("id", subscription.id);
        log.info("Subscription completed", { subscriptionId: subscription.id });
        break;
      }

      // -----------------------------------------------------------------------
      // SUBSCRIPTION HALTED — Payment failed, access should be restricted
      // PRD §04: "Lapsed-subscription states" + "Non-subscribers receive restricted access"
      // -----------------------------------------------------------------------
      case "subscription.halted": {
        await supabase
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("id", subscription.id);

        log.warn("Subscription halted — access restricted", {
          subscriptionId: subscription.id,
          userId: subscription.user_id,
        });

        if (user?.email) {
          await sendSubscriptionLapsedNotice(user.email, user.full_name ?? "Subscriber");
        }
        break;
      }

      // -----------------------------------------------------------------------
      // PAUSED / RESUMED
      // -----------------------------------------------------------------------
      case "subscription.paused": {
        await supabase
          .from("subscriptions")
          .update({ status: "paused" })
          .eq("id", subscription.id);
        break;
      }

      case "subscription.resumed": {
        await supabase
          .from("subscriptions")
          .update({ status: "active" })
          .eq("id", subscription.id);
        break;
      }
    }

    return NextResponse.json(
      { success: true, data: { event, processed: true } },
      { status: 200 }
    );

  } catch (error) {
    const err = logAndBuildError(log, error, "Webhook processing failed");
    // Return 500 — Razorpay will retry (desired for payment events)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
