/**
 * app/api/winners/upload-proof/route.ts
 *
 * PRD §09: Winner Verification System
 *  - Users upload proof (screenshot of golf scores)
 *  - Admin reviews: Approve or Reject
 *  - Payment states: Pending → Paid
 *
 * Testing checklist: "Winner verification flow and payout tracking"
 *
 * POST /api/winners/upload-proof
 *   → User uploads proof screenshot URL
 *   → Status: pending → proof_submitted
 *
 * PATCH /api/winners/upload-proof
 *   → Admin approves or rejects
 *   → Status: proof_submitted → approved | rejected
 *
 * PUT /api/winners/upload-proof
 *   → Admin marks payout as completed
 *   → Status: approved → paid
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeader, requireAdmin, createServerClient, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import { uploadProofSchema, reviewWinnerSchema } from "@/lib/server/validators";
import { sendPayoutConfirmation } from "@/lib/server/mailer";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// POST — User uploads proof screenshot
// PRD §09: "Proof Upload: Screenshot of scores from the golf platform"
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("POST /api/winners/upload-proof");

  try {
    // --- 1. Authenticate ---
    const authHeader = req.headers.get("Authorization");
    const user = await getUserFromHeader(authHeader);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    // --- 2. Validate input ---
    const body = await req.json().catch(() => ({}));
    const parsed = uploadProofSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { winner_id, proof_url, notes } = parsed.data;

    // --- 3. Verify this winner record belongs to the requesting user ---
    // RLS policy "Users can upload proof for own winnings" enforces:
    //   user_id = auth.uid() AND status = 'pending'
    const supabase = createServerClient(authHeader ?? undefined);

    const { data: winner, error: winnerError } = await supabase
      .from("winners")
      .select("id, user_id, status, tier, prize_amount_paise")
      .eq("id", winner_id)
      .eq("user_id", user.id)  // Ownership check
      .single();

    if (winnerError || !winner) {
      log.warn("Winner not found or access denied", { winnerId: winner_id, userId: user.id });
      return NextResponse.json(
        { success: false, error: "Winner record not found or access denied" },
        { status: 404 }
      );
    }

    // --- 4. Validate status — only 'pending' can submit proof ---
    // PRD §09: "Upload proof for own winnings" (status must be pending)
    if (winner.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot upload proof for winner with status '${winner.status}'. Only pending winners can upload proof.`,
        },
        { status: 409 }
      );
    }

    // --- 5. Update winner record with proof ---
    const { data: updated, error: updateError } = await supabase
      .from("winners")
      .update({
        proof_url,
        notes: notes ?? null,
        status: "proof_submitted",
        proof_submitted_at: new Date().toISOString(),
      })
      .eq("id", winner_id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !updated) {
      log.error("Proof upload update failed", { error: updateError?.message });
      return NextResponse.json({ success: false, error: "Failed to submit proof" }, { status: 500 });
    }

    log.info("Proof submitted", { winnerId: winner_id, userId: user.id });

    return NextResponse.json(
      {
        success: true,
        data: {
          winner_id,
          status: "proof_submitted",
          proof_url,
          message: "Proof submitted successfully. Admin will review within 2–3 business days.",
        },
        message: "Proof uploaded successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Proof upload failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — Admin: Approve or Reject winner proof
// PRD §09: "Admin Review: Approve or Reject submission"
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("PATCH /api/winners/upload-proof");

  try {
    // --- 1. Require admin ---
    let admin;
    try {
      admin = await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    // --- 2. Validate input ---
    const body = await req.json().catch(() => ({}));
    const parsed = reviewWinnerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { winner_id, action, admin_note } = parsed.data;
    const supabase = createAdminClient();

    // --- 3. Fetch winner to verify it's in a reviewable state ---
    const { data: winner, error: fetchError } = await supabase
      .from("winners")
      .select("*, users(email, full_name)")
      .eq("id", winner_id)
      .single();

    if (fetchError || !winner) {
      return NextResponse.json({ success: false, error: "Winner not found" }, { status: 404 });
    }

    if (winner.status !== "proof_submitted") {
      return NextResponse.json(
        {
          success: false,
          error: `Winner status is '${winner.status}'. Only 'proof_submitted' winners can be reviewed.`,
        },
        { status: 409 }
      );
    }

    // --- 4. Update status based on action ---
    const newStatus = action === "approve" ? "approved" : "rejected";

    const { data: updated, error: updateError } = await supabase
      .from("winners")
      .update({
        status: newStatus,
        admin_note: admin_note ?? null,
        verified_by: admin.id,
      })
      .eq("id", winner_id)
      .select()
      .single();

    if (updateError || !updated) {
      log.error("Winner review update failed", { error: updateError?.message });
      return NextResponse.json({ success: false, error: "Review update failed" }, { status: 500 });
    }

    log.info(`Winner ${action}d`, { winnerId: winner_id, adminId: admin.id, newStatus });

    return NextResponse.json(
      {
        success: true,
        data: { winner_id, status: newStatus, action },
        message: `Winner ${action}d successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Winner review failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Admin: Mark payout as completed
// PRD §09: "Payment States: Pending → Paid"
// ---------------------------------------------------------------------------
export async function PUT(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("PUT /api/winners/upload-proof");

  try {
    // --- 1. Require admin ---
    let admin;
    try {
      admin = await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { winner_id } = body;

    if (!winner_id) {
      return NextResponse.json({ success: false, error: "winner_id is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // --- 2. Verify winner is 'approved' before marking paid ---
    const { data: winner, error: fetchError } = await supabase
      .from("winners")
      .select("*, users(email, full_name)")
      .eq("id", winner_id)
      .single();

    if (fetchError || !winner) {
      return NextResponse.json({ success: false, error: "Winner not found" }, { status: 404 });
    }

    if (winner.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error: `Winner must be 'approved' before marking as paid. Current status: ${winner.status}`,
        },
        { status: 409 }
      );
    }

    // --- 3. Mark as paid ---
    const { error: updateError } = await supabase
      .from("winners")
      .update({
        status: "paid",
        payout_completed_at: new Date().toISOString(),
      })
      .eq("id", winner_id);

    if (updateError) {
      log.error("Payout update failed", { error: updateError.message });
      return NextResponse.json({ success: false, error: "Payout update failed" }, { status: 500 });
    }

    // --- 4. Email winner that payout is done ---
    // PRD §13: "winner alerts"
    const user = winner.users as any;
    if (user?.email) {
      await sendPayoutConfirmation(
        user.email,
        user.full_name ?? "Winner",
        winner.prize_amount_paise
      );
    }

    log.info("Payout marked complete", { winnerId: winner_id, adminId: admin.id });

    return NextResponse.json(
      {
        success: true,
        data: { winner_id, status: "paid" },
        message: "Payout marked as complete. Winner notified by email.",
      },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Payout completion failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
