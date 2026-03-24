/**
 * lib/server/razorpay.ts
 *
 * PRD §04: Subscription & Payment System
 * "Gateway: Stripe (or equivalent PCI-compliant provider)" → using Razorpay per requirement.
 *
 * Provides:
 *  - Razorpay SDK instance
 *  - Webhook signature verification (crypto-based, per Razorpay docs)
 *  - Subscription plan helpers
 *  - Amount calculation utilities (prize pool, charity contribution)
 */

import Razorpay from "razorpay";
import crypto from "crypto";
import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Validate env vars at module load time
// ---------------------------------------------------------------------------
const KEY_ID = process.env.RAZORPAY_KEY_ID!;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

if (!KEY_ID || !KEY_SECRET || !WEBHOOK_SECRET) {
  throw new Error(
    "[Razorpay] Missing RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, or RAZORPAY_WEBHOOK_SECRET"
  );
}

// ---------------------------------------------------------------------------
// Razorpay client (singleton)
// ---------------------------------------------------------------------------
export const razorpay = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
});

// ---------------------------------------------------------------------------
// PRD §04: Plan definitions
// ---------------------------------------------------------------------------
export const PLANS = {
  monthly: {
    id: process.env.RAZORPAY_PLAN_MONTHLY_ID!,
    amount: parseInt(process.env.SUBSCRIPTION_MONTHLY_AMOUNT ?? "49900"),   // paise
    interval: "monthly" as const,
    period: "monthly" as const,
    label: "Monthly Plan",
  },
  yearly: {
    id: process.env.RAZORPAY_PLAN_YEARLY_ID!,
    amount: parseInt(process.env.SUBSCRIPTION_YEARLY_AMOUNT ?? "499900"),   // paise
    interval: "yearly" as const,
    period: "yearly" as const,
    label: "Yearly Plan",
  },
} as const;

export type PlanType = keyof typeof PLANS;

// ---------------------------------------------------------------------------
// PRD §07: Prize pool calculation helpers
// ---------------------------------------------------------------------------
const PRIZE_POOL_PERCENT = parseInt(process.env.SUBSCRIPTION_PRIZE_POOL_PERCENT ?? "50") / 100;
const CHARITY_MIN_PERCENT = parseInt(process.env.CHARITY_MIN_PERCENT ?? "10") / 100;

/**
 * Calculate prize pool contribution from a single subscription payment (in paise).
 * PRD §07: "A fixed portion of each subscription contributes to the prize pool."
 */
export function calcPrizePoolContribution(amountPaise: number): number {
  return Math.floor(amountPaise * PRIZE_POOL_PERCENT);
}

/**
 * Calculate charity contribution from a single subscription payment (in paise).
 * PRD §08: "Minimum contribution: 10% of subscription fee"
 *
 * @param amountPaise - Total subscription amount in paise
 * @param userPercent - User's chosen charity percentage (min 10%)
 */
export function calcCharityContribution(
  amountPaise: number,
  userPercent: number
): number {
  const effectivePercent = Math.max(userPercent / 100, CHARITY_MIN_PERCENT);
  return Math.floor(amountPaise * effectivePercent);
}

/**
 * PRD §07: Prize tier split amounts
 * 5-match: 40% | 4-match: 35% | 3-match: 25%
 */
export function calcPrizeTiers(totalPoolPaise: number): {
  fiveMatch: number;
  fourMatch: number;
  threeMatch: number;
} {
  return {
    fiveMatch: Math.floor(totalPoolPaise * 0.40),
    fourMatch: Math.floor(totalPoolPaise * 0.35),
    threeMatch: Math.floor(totalPoolPaise * 0.25),
  };
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// PRD §11 (webhooks): Must verify Razorpay webhook authenticity
// ---------------------------------------------------------------------------
/**
 * Verifies a Razorpay webhook signature using HMAC-SHA256.
 * Throws if signature is invalid (prevents replay/spoofing attacks).
 *
 * @param body - Raw request body string (must NOT be parsed before this)
 * @param signature - X-Razorpay-Signature header value
 */
export function verifyWebhookSignature(body: string, signature: string): void {
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (expected !== signature) {
    logger.warn("[Razorpay] Webhook signature mismatch — possible spoofing attempt", {
      received: signature,
    });
    throw new Error("Invalid webhook signature");
  }
}

// ---------------------------------------------------------------------------
// Create Razorpay subscription
// ---------------------------------------------------------------------------
/**
 * Creates a Razorpay subscription for a user.
 * PRD §04: Monthly + Yearly plans with renewal/lifecycle handling.
 */
export async function createRazorpaySubscription(
  planType: PlanType,
  customerEmail: string,
  customerName: string,
  totalCount: number = 12   // billing cycles
): Promise<{ subscriptionId: string; shortUrl: string }> {
  const plan = PLANS[planType];

  const subscription = await razorpay.subscriptions.create({
    plan_id: plan.id,
    customer_notify: 1,
    quantity: 1,
    total_count: totalCount,
    notify_info: {
      notify_email: customerEmail,
    },
    notes: {
      customer_name: customerName,
      plan_type: planType,
    },
  });

  return {
    subscriptionId: subscription.id as string,
    shortUrl: (subscription as any).short_url ?? "",
  };
}
