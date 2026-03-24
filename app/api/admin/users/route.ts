/**
 * app/api/admin/users/route.ts
 *
 * PRD §11 (Admin Dashboard): User Management
 *  - View and edit user profiles
 *  - Edit golf scores
 *  - Manage subscriptions
 *
 * ADMIN ONLY — Uses service_role client (bypasses RLS).
 *
 * GET   /api/admin/users          → List all users with subscription status
 * GET   /api/admin/users?id=<id>  → Single user with full details
 * PATCH /api/admin/users          → Update user profile or role
 * DELETE /api/admin/users?id=<id> → Soft delete / deactivate user
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import { adminUpdateUserSchema, paginationSchema } from "@/lib/server/validators";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET — List users (paginated) or single user detail
// PRD §11: "View and edit user profiles"
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("GET /api/admin/users");

  try {
    let admin;
    try {
      admin = await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    const search = searchParams.get("search") ?? "";

    const supabase = createAdminClient();

    // --- Single user detail ---
    if (userId) {
      const { data: user, error } = await supabase
        .from("users")
        .select(`
          *,
          subscriptions(id, status, plan_type, current_period_end, prize_pool_contribution_paise, charity_contribution_paise),
          scores(id, value, played_at, course_name, created_at),
          charities(id, name),
          donations(id, amount_paise, type, created_at)
        `)
        .eq("id", userId)
        .single();

      if (error || !user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }

      // Sort scores reverse chronological (PRD §05)
      (user as any).scores = ((user as any).scores ?? []).sort(
        (a: any, b: any) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
      );

      return NextResponse.json({ success: true, data: { user } }, { status: 200 });
    }

    // --- Paginated user list ---
    const pageParsed = paginationSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });
    const { page, limit } = pageParsed.success ? pageParsed.data : { page: 1, limit: 20 };
    const from = (page - 1) * limit;

    let query = supabase
      .from("users")
      .select(`
        id, email, full_name, role, charity_percent, created_at,
        subscriptions(status, plan_type, current_period_end),
        charities(name)
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query;

    if (error) {
      log.error("User list fetch failed", { error: error.message });
      return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          users: users ?? [],
          pagination: {
            page,
            limit,
            total: count ?? 0,
            pages: Math.ceil((count ?? 0) / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Admin user list failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — Update user profile / role
// PRD §11: "View and edit user profiles"
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("PATCH /api/admin/users");

  try {
    let admin;
    try {
      admin = await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = adminUpdateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { user_id, full_name, role, charity_id, charity_percent } = parsed.data;
    const supabase = createAdminClient();

    // Build update — only include provided fields
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updates.full_name = full_name;
    if (role !== undefined) updates.role = role;
    if (charity_id !== undefined) updates.charity_id = charity_id;
    if (charity_percent !== undefined) updates.charity_percent = Math.max(charity_percent, 10);

    const { data: updated, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user_id)
      .select()
      .single();

    if (error || !updated) {
      log.error("User update failed", { userId: user_id, error: error?.message });
      return NextResponse.json({ success: false, error: "User update failed" }, { status: 500 });
    }

    log.info("User updated by admin", { targetUserId: user_id, adminId: admin.id, updates });

    return NextResponse.json(
      { success: true, data: { user: updated }, message: "User updated" },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Admin user update failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — Soft-cancel user's subscription (not hard delete)
// PRD §11: "Manage subscriptions"
// Note: We don't hard-delete users to preserve draw/winner history integrity
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("DELETE /api/admin/users");

  try {
    let admin;
    try {
      admin = await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Cancel all active subscriptions for the user
    const { error: subError } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("user_id", userId)
      .in("status", ["active", "created", "authenticated"]);

    if (subError) {
      log.error("Subscription cancellation failed", { userId, error: subError.message });
      return NextResponse.json(
        { success: false, error: "Failed to cancel subscription" },
        { status: 500 }
      );
    }

    log.info("User subscriptions cancelled by admin", { targetUserId: userId, adminId: admin.id });

    return NextResponse.json(
      {
        success: true,
        data: { user_id: userId, subscriptions_cancelled: true },
        message: "User subscriptions cancelled. User record preserved for history integrity.",
      },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Admin user delete failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
