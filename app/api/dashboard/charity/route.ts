import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeader, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import { z } from "zod";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";

const updateCharitySchema = z.object({
  charity_id: z.string().uuid("Invalid charity ID"),
});

export async function PATCH(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("PATCH /api/dashboard/charity");

  try {
    const authHeader = req.headers.get("Authorization");
    const user = await getUserFromHeader(authHeader);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateCharitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const supabase = createAdminClient() as any;

    // Verify charity exists
    const { data: charity, error: charityError } = await supabase
      .from("charities")
      .select("id")
      .eq("id", parsed.data.charity_id)
      .single();

    if (charityError || !charity) {
      return NextResponse.json(
        { success: false, error: "Invalid charity selected" },
        { status: 400 }
      );
    }

    // Update user
    const { error: updateError } = await supabase
      .from("users")
      .update({ charity_id: parsed.data.charity_id })
      .eq("id", user.id);

    if (updateError) {
      log.error("User charity update failed", { error: updateError.message });
      return NextResponse.json({ success: false, error: "Failed to update charity" }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, data: { charity_id: parsed.data.charity_id }, message: "Charity updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    const err = logAndBuildError(log, error, "Charity update failed");
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
