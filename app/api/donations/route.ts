/**
 * app/api/donations/route.ts
 *
 * PRD §08: "Independent donation option (not tied to gameplay)"
 * PRD §08: "Users may voluntarily increase their charity percentage"
 *
 * POST /api/donations  → Create independent donation
 * GET  /api/donations  → User's donation history
 * PATCH /api/donations/charity-percent → Update user's charity % for subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeader, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import { z } from "zod";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";

const independentDonationSchema = z.object({
  charity_id: z.string().uuid(),
  amount_paise: z.number().int().min(100, "Minimum donation is ₹1"),  // 100 paise = ₹1
  notes: z.string().max(500).optional(),
});

const updateCharityPercentSchema = z.object({
  charity_percent: z
    .number()
    .min(10, "Minimum 10%")
    .max(100, "Maximum 100%"),
  charity_id: z.string().uuid().optional(),
});

// ---------------------------------------------------------------------------
// POST — Create independent donation
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("POST /api/donations");

  try {
    const authHeader = req.headers.get("Authorization");
    const user = await getUserFromHeader(authHeader);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = independentDonationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { charity_id, amount_paise, notes } = parsed.data;
    const supabase = createAdminClient();

    // Verify charity exists
    const { data: charity } = await supabase
      .from("charities")
      .select("id, name")
      .eq("id", charity_id)
      .single();

    if (!charity) {
      return NextResponse.json({ success: false, error: "Charity not found" }, { status: 404 });
    }

    // Insert independent donation — PRD §08
    const { data: donation, error } = await supabase
      .from("donations")
      .insert({
        user_id: user.id,
        charity_id,
        amount_paise,
        type: "independent",
        subscription_id: null,
        notes: notes ?? `Independent donation to ${charity.name}`,
      })
      .select()
      .single();

    if (error || !donation) {
      log.error("Donation insert failed", { error: error?.message });
      return NextResponse.json({ success: false, error: "Donation failed" }, { status: 500 });
    }

    log.info("Independent donation created", {
      userId: user.id,
      charityId: charity_id,
      amountPaise: amount_paise,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          donation_id: donation.id,
          charity_name: charity.name,
          amount_inr: (amount_paise / 100).toFixed(2),
          type: "independent",
        },
        message: "Donation recorded. Thank you for your contribution!",
      },
      { status: 201 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Donation failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET — Donation history
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("GET /api/donations");

  try {
    const authHeader = req.headers.get("Authorization");
    const user = await getUserFromHeader(authHeader);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: donations, error } = await supabase
      .from("donations")
      .select("*, charities(name, logo_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: "Failed to fetch donations" }, { status: 500 });
    }

    const totalPaise = (donations ?? []).reduce((sum, d) => sum + d.amount_paise, 0);

    return NextResponse.json(
      {
        success: true,
        data: {
          donations: (donations ?? []).map((d) => ({
            ...d,
            amount_inr: (d.amount_paise / 100).toFixed(2),
          })),
          total_donated_inr: (totalPaise / 100).toFixed(2),
          count: donations?.length ?? 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Donation history fetch failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — Update charity percentage (voluntary increase — PRD §08)
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("PATCH /api/donations");

  try {
    const authHeader = req.headers.get("Authorization");
    const user = await getUserFromHeader(authHeader);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateCharityPercentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { charity_percent, charity_id } = parsed.data;
    const supabase = createAdminClient();

    const updates: Record<string, any> = {
      charity_percent: Math.max(charity_percent, 10),  // Enforce minimum
      updated_at: new Date().toISOString(),
    };
    if (charity_id) updates.charity_id = charity_id;

    const { data: updated, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select("charity_percent, charity_id, charities(name)")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
    }

    log.info("Charity percent updated", {
      userId: user.id,
      newPercent: charity_percent,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          charity_percent: updated.charity_percent,
          charity_id: updated.charity_id,
          charity_name: (updated as any).charities?.name,
        },
        message: `Charity contribution updated to ${charity_percent}%`,
      },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Charity percent update failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
