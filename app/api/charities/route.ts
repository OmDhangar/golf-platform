/**
 * app/api/charities/route.ts
 *
 * PRD §08: Charity System
 *  - Public listing with search and filter
 *  - Individual charity profiles
 *  - Featured / spotlight charity section
 *  - Admin CRUD
 *
 * PRD §03: "Public Visitor can explore listed charities"
 *
 * GET   /api/charities                → List all charities (public)
 * GET   /api/charities?id=<id>        → Single charity profile
 * GET   /api/charities?featured=true  → Featured charities only
 * GET   /api/charities?search=<term>  → Search by name/description
 * POST  /api/charities                → Create charity (admin only)
 * PATCH /api/charities                → Update charity (admin only)
 * DELETE /api/charities?id=<id>       → Delete charity (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeader, requireAdmin, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import { createCharitySchema, updateCharitySchema } from "@/lib/server/validators";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";
// 1-hour ISR cache — charity data changes infrequently
export const revalidate = 3600;

// ---------------------------------------------------------------------------
// GET — Public charity listing
// PRD §08: "Charity listing page with search and filter"
// PRD §08: "Individual charity profiles: description, images, upcoming events"
// PRD §08: "Featured / spotlight charity section on homepage"
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("GET /api/charities");

  try {
    const { searchParams } = new URL(req.url);
    const charityId = searchParams.get("id");
    const featured = searchParams.get("featured") === "true";
    const search = searchParams.get("search") ?? "";

    const supabase = createAdminClient() as any;

    // --- Single charity profile ---
    if (charityId) {
      const { data: charity, error } = await supabase
        .from("charities")
        .select("*")
        .eq("id", charityId)
        .single();

      if (error || !charity) {
        return NextResponse.json({ success: false, error: "Charity not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: { charity } }, { status: 200 });
    }

    // --- List with optional filters ---
    let query = supabase
      .from("charities")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true });

    // PRD §08: "Featured / spotlight charity"
    if (featured) {
      query = query.eq("is_featured", true);
    }

    // PRD §08: "Charity listing page with search"
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: charities, error } = await query;

    if (error) {
      log.error("Charity list fetch failed", { error: error.message });
      return NextResponse.json({ success: false, error: "Failed to fetch charities" }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          charities: charities ?? [],
          count: charities?.length ?? 0,
          featured: (charities ?? []).filter((c) => c.is_featured),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Charity fetch failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Create charity (admin only)
// PRD §11: "Add, edit, delete charities. Manage content and media."
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("POST /api/charities");

  try {
    let admin;
    try {
      admin = await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createCharitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const supabase = createAdminClient() as any;

    const { data: charity, error } = await supabase
      .from("charities")
      .insert({
        name: parsed.data.name,
        description: parsed.data.description,
        website_url: parsed.data.website_url || null,
        logo_url: parsed.data.logo_url || null,
        is_featured: parsed.data.is_featured,
        category: parsed.data.category,
        total_generated_paise: parsed.data.total_generated_paise,
        events: parsed.data.events ? JSON.stringify(parsed.data.events) : "[]",
      } as any)
      .select()
      .single();

    if (error || !charity) {
      log.error("Charity create failed", { error: error?.message });
      return NextResponse.json({ success: false, error: "Failed to create charity" }, { status: 500 });
    }

    log.info("Charity created", { charityId: charity.id, adminId: admin.id });

    return NextResponse.json(
      { success: true, data: { charity }, message: "Charity created" },
      { status: 201 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Charity create failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — Update charity (admin only)
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("PATCH /api/charities");

  try {
    let admin;
    try {
      admin = await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateCharitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { charity_id, ...updates } = parsed.data;
    const supabase = createAdminClient() as any;

    const { data: charity, error } = await supabase
      .from("charities")
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq("id", charity_id)
      .select()
      .single();

    if (error || !charity) {
      return NextResponse.json(
        { success: false, error: "Charity not found or update failed" },
        { status: 404 }
      );
    }

    log.info("Charity updated", { charityId: charity_id, adminId: admin.id });

    return NextResponse.json(
      { success: true, data: { charity }, message: "Charity updated" },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Charity update failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — Delete charity (admin only)
// PRD §11: "Add, edit, delete charities"
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("DELETE /api/charities");

  try {
    let admin;
    try {
      admin = await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const charityId = searchParams.get("id");

    if (!charityId) {
      return NextResponse.json({ success: false, error: "Charity ID required" }, { status: 400 });
    }

    const supabase = createAdminClient() as any;

    // Check no users are currently assigned to this charity
    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("charity_id", charityId);

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete charity with ${count} active user(s) assigned. Reassign users first.`,
        },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("charities")
      .delete()
      .eq("id", charityId);

    if (error) {
      return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
    }

    log.info("Charity deleted", { charityId, adminId: admin.id });

    return NextResponse.json(
      { success: true, data: { deleted: true, charity_id: charityId } },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Charity delete failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
