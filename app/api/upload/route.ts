/**
 * app/api/upload/route.ts
 *
 * Signed Cloudinary upload endpoint — admin only.
 *
 * POST /api/upload
 *   Body (JSON): { data: "<base64 data URI>", folder: "charities" | "prizes", public_id?: string }
 *   Returns: { secure_url, public_id, width, height }
 */

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/lib/server/supabase";
import { createRouteLogger } from "@/lib/server/logger";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ALLOWED_FOLDERS = ["charities", "prizes"] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const log = createRouteLogger("POST /api/upload");

  try {
    // Admin guard
    try {
      await requireAdmin(req.headers.get("Authorization"));
    } catch {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      data?: string;
      folder?: string;
      public_id?: string;
    };

    if (!body.data || typeof body.data !== "string") {
      return NextResponse.json({ success: false, error: "Missing `data` field (base64 data URI)" }, { status: 400 });
    }

    const folder: AllowedFolder =
      ALLOWED_FOLDERS.includes(body.folder as AllowedFolder)
        ? (body.folder as AllowedFolder)
        : "charities";

    const uploadOptions: Record<string, unknown> = {
      folder: `golf-platform/${folder}`,
      resource_type: "image",
      overwrite: true,
      quality: "auto:good",
      fetch_format: "auto",
      // Transformations for consistent display
      transformation: [{ width: 800, height: 600, crop: "fill", gravity: "auto" }],
    };

    if (body.public_id) {
      uploadOptions.public_id = body.public_id;
    }

    const result = await cloudinary.uploader.upload(body.data, uploadOptions);

    log.info("Image uploaded to Cloudinary", { public_id: result.public_id, folder });

    return NextResponse.json(
      {
        success: true,
        data: {
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    log.error("Cloudinary upload failed", { error: message });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
