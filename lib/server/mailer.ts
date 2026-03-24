/**
 * lib/server/mailer.ts
 *
 * PRD §13: "Email notifications — system updates, draw results, winner alerts"
 *
 * Uses Resend (https://resend.com) — production-grade transactional email.
 * Swap with Nodemailer/SendGrid if preferred; the interface is identical.
 */

import { logger } from "./logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = `${process.env.EMAIL_FROM_NAME ?? "Golf Charity Platform"} <${process.env.EMAIL_FROM ?? "noreply@example.com"}>`;

// ---------------------------------------------------------------------------
// Core send function (wraps Resend REST API directly — no SDK dependency)
// ---------------------------------------------------------------------------
async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> {
  if (!RESEND_API_KEY) {
    logger.warn("[Mailer] RESEND_API_KEY not set — email skipped", { subject: opts.subject });
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error("[Mailer] Failed to send email", { subject: opts.subject, error: err });
    } else {
      logger.info("[Mailer] Email sent", { subject: opts.subject, to: opts.to });
    }
  } catch (err) {
    // Non-blocking — email failures must NOT crash the main flow
    logger.error("[Mailer] Exception sending email", { error: err });
  }
}

// ---------------------------------------------------------------------------
// PRD §13: Specific notification templates
// ---------------------------------------------------------------------------

/** Sent after successful subscription payment */
export async function sendSubscriptionConfirmation(
  to: string,
  name: string,
  planLabel: string,
  renewalDate: string
): Promise<void> {
  await sendEmail({
    to,
    subject: "Welcome to Golf Charity Platform 🏌️",
    html: `
      <h2>Welcome aboard, ${name}!</h2>
      <p>Your <strong>${planLabel}</strong> subscription is now active.</p>
      <p>Your next renewal date: <strong>${renewalDate}</strong></p>
      <p>Log in to enter your scores and participate in the monthly draw.</p>
    `,
  });
}

/** Sent when draw results are published — PRD §06 */
export async function sendDrawResultsNotification(
  to: string | string[],
  drawMonth: string,
  winningNumbers: number[]
): Promise<void> {
  await sendEmail({
    to,
    subject: `🎯 Monthly Draw Results — ${drawMonth}`,
    html: `
      <h2>The ${drawMonth} Draw Results Are In!</h2>
      <p>Winning numbers: <strong>${winningNumbers.join(", ")}</strong></p>
      <p>Log in to your dashboard to see if you've won.</p>
    `,
  });
}

/** Sent to a winner when they're confirmed — PRD §09 */
export async function sendWinnerAlert(
  to: string,
  name: string,
  prizeAmount: number,
  tier: string
): Promise<void> {
  await sendEmail({
    to,
    subject: "🏆 Congratulations — You Won!",
    html: `
      <h2>Congratulations, ${name}!</h2>
      <p>You matched <strong>${tier}</strong> in the monthly draw.</p>
      <p>Your prize: <strong>₹${(prizeAmount / 100).toFixed(2)}</strong></p>
      <p>Please log in to upload your score proof to claim your winnings.</p>
    `,
  });
}

/** Sent when a winner's proof is verified and payout is initiated — PRD §09 */
export async function sendPayoutConfirmation(
  to: string,
  name: string,
  amount: number
): Promise<void> {
  await sendEmail({
    to,
    subject: "💸 Payout Initiated",
    html: `
      <h2>Your payout is on the way, ${name}!</h2>
      <p>Amount: <strong>₹${(amount / 100).toFixed(2)}</strong></p>
      <p>Please allow 3–5 business days for the transfer to complete.</p>
    `,
  });
}

/** Sent when subscription is cancelled or lapses — PRD §04 */
export async function sendSubscriptionLapsedNotice(
  to: string,
  name: string
): Promise<void> {
  await sendEmail({
    to,
    subject: "⚠️ Your Subscription Has Lapsed",
    html: `
      <h2>Hi ${name},</h2>
      <p>Your Golf Charity Platform subscription has lapsed or been cancelled.</p>
      <p>You can resubscribe anytime to continue participating in draws and supporting your chosen charity.</p>
    `,
  });
}
