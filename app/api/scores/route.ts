/**
 * app/api/scores/route.ts
 *
 * PRD §05: Score Management System
 *  - POST: Enter new score (Stableford 1–45, date required)
 *  - GET:  Fetch latest 5 scores in reverse chronological order
 *  - PATCH: Edit an existing score
 *
 * Rolling 5 logic:
 *  "Only the latest 5 scores are retained at any time."
 *  "A new score replaces the oldest stored score automatically."
 *
 * Testing checklist: "Score entry — 5-score rolling logic"
 *
 * POST /api/scores  → Add score (auto-delete oldest if >5 exist)
 * GET  /api/scores  → Get latest 5 scores, reverse chronological
 * PATCH /api/scores → Edit a specific score
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeader, createServerClient, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import { scoreCreateSchema, scoreUpdateSchema } from "@/lib/server/validators";
import type { ApiResponse, Score } from "@/types/index";

export const runtime = "nodejs";

// PRD §05: Maximum scores retained per user
const MAX_SCORES = 5;

// ---------------------------------------------------------------------------
// POST — Submit new score with rolling 5 logic
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("POST /api/scores");

  try {
    // --- 1. Authenticate ---
    const authHeader = req.headers.get("Authorization");
    const user = await getUserFromHeader(authHeader);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    log.info("Score submission", { userId: user.id });

    // --- 2. Validate input ---
    const body = await req.json().catch(() => ({}));
    const parsed = scoreCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { value, played_at, course_name } = parsed.data;

    // --- 3. Check active subscription (PRD §04: restricted access for non-subscribers) ---
    const supabase = createServerClient(authHeader ?? undefined);
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!sub) {
      return NextResponse.json(
        { success: false, error: "Active subscription required to submit scores", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      );
    }

    // --- 4. Fetch current scores to implement rolling 5 ---
    // PRD §05: "Only the latest 5 scores are retained at any time"
    // We use admin client for the deletion step (RLS on DELETE uses user_id = auth.uid())
    const adminClient = createAdminClient();

    const { data: currentScores, error: fetchError } = await adminClient
      .from("scores")
      .select("id, played_at, created_at")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (fetchError) {
      log.error("Failed to fetch current scores", { error: fetchError.message });
      return NextResponse.json({ success: false, error: "Failed to fetch scores" }, { status: 500 });
    }

    // --- 5. Rolling deletion — remove oldest if already at 5 ---
    // PRD §05: "A new score replaces the oldest stored score automatically"
    if ((currentScores ?? []).length >= MAX_SCORES) {
      // The oldest score is the LAST in our descending sort
      const toDelete = currentScores![currentScores!.length - 1];

      log.info("Rolling score deletion", {
        userId: user.id,
        deletingScoreId: toDelete.id,
        deletingPlayedAt: toDelete.played_at,
      });

      const { error: deleteError } = await adminClient
        .from("scores")
        .delete()
        .eq("id", toDelete.id)
        .eq("user_id", user.id);  // Extra safety check on user_id

      if (deleteError) {
        log.error("Failed to delete oldest score", { error: deleteError.message });
        return NextResponse.json({ success: false, error: "Failed to manage score history" }, { status: 500 });
      }
    }

    // --- 6. Insert the new score ---
    const { data: newScore, error: insertError } = await adminClient
      .from("scores")
      .insert({
        user_id: user.id,
        value,
        played_at,
        course_name: course_name ?? null,
      })
      .select()
      .single();

    if (insertError || !newScore) {
      log.error("Score insert failed", { error: insertError?.message });
      return NextResponse.json({ success: false, error: "Failed to save score" }, { status: 500 });
    }

    // --- 7. Fetch updated list (reverse chronological, max 5) ---
    const { data: updatedScores } = await adminClient
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(MAX_SCORES);

    log.info("Score submitted successfully", {
      userId: user.id,
      newScoreId: newScore.id,
      scoreValue: value,
      totalScores: updatedScores?.length ?? 0,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          new_score: newScore,
          all_scores: updatedScores ?? [],  // PRD §05: reverse chronological
          scores_count: updatedScores?.length ?? 0,
        },
        message: "Score submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Score submission failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET — Retrieve latest 5 scores (reverse chronological)
// PRD §05: "Scores are displayed in reverse chronological order (most recent first)"
// PRD §10: User Dashboard — Score entry and edit interface
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("GET /api/scores");

  try {
    const authHeader = req.headers.get("Authorization");
    const user = await getUserFromHeader(authHeader);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const supabase = createServerClient(authHeader ?? undefined);

    // RLS policy "Users can manage own scores" ensures only the user's scores are returned
    const { data: scores, error } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(MAX_SCORES);  // PRD §05: Always cap at 5

    if (error) {
      log.error("Score fetch failed", { userId: user.id, error: error.message });
      return NextResponse.json({ success: false, error: "Failed to fetch scores" }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          scores: scores ?? [],
          count: scores?.length ?? 0,
          max_allowed: MAX_SCORES,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Score fetch failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — Edit an existing score
// PRD §10: "Score entry and edit interface"
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("PATCH /api/scores");

  try {
    const authHeader = req.headers.get("Authorization");
    const user = await getUserFromHeader(authHeader);
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = scoreUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { score_id, value, played_at, course_name } = parsed.data;

    const supabase = createServerClient(authHeader ?? undefined);

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!sub) {
      return NextResponse.json(
        { success: false, error: "Active subscription required to edit scores", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      );
    }

    // Build update object (only include provided fields)
    const updates: Partial<Score> = {};
    if (value !== undefined) {
      // Validate range again (defence in depth)
      if (value < 1 || value > 45) {
        return NextResponse.json(
          { success: false, error: "Score must be between 1 and 45 (Stableford)" },
          { status: 422 }
        );
      }
      updates.value = value;
    }
    if (played_at !== undefined) updates.played_at = played_at;
    if (course_name !== undefined) updates.course_name = course_name;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    // Use user-scoped client so RLS policy enforces ownership
    const { data: updated, error } = await supabase
      .from("scores")
      .update(updates)
      .eq("id", score_id)
      .eq("user_id", user.id)  // RLS double-check
      .select()
      .single();

    if (error || !updated) {
      log.warn("Score update failed — not found or not owned by user", {
        scoreId: score_id,
        userId: user.id,
        error: error?.message,
      });
      return NextResponse.json(
        { success: false, error: "Score not found or access denied" },
        { status: 404 }
      );
    }

    log.info("Score updated", { userId: user.id, scoreId: score_id });

    return NextResponse.json(
      { success: true, data: { score: updated }, message: "Score updated" },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Score update failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
