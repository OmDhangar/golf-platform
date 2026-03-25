#!/usr/bin/env node
/**
 * scripts/seed-cloudinary.mjs
 *
 * Uploads charity images and prize images to Cloudinary,
 * then upserts charity + draw seed data into Supabase.
 *
 * Usage:
 *   node scripts/seed-cloudinary.mjs
 *
 * Prerequisites:
 *   - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env
 *   - NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 *   - Run the migration SQL in Supabase SQL Editor first (from implementation_plan.md)
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env manually (no dotenv dependency needed) ───────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    process.env[key] ??= value;
  }
}

// ── Validate env ─────────────────────────────────────────────────────────────
const REQUIRED = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const missing = REQUIRED.filter((k) => !process.env[k] || process.env[k].startsWith("your_"));
if (missing.length) {
  console.error("\n❌  Missing env vars:", missing.join(", "));
  console.error("   Fill them in .env and re-run.\n");
  process.exit(1);
}

// ── Dynamic imports ───────────────────────────────────────────────────────────
const { v2: cloudinary } = await import("cloudinary");
const { createClient } = await import("@supabase/supabase-js");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Helpers ──────────────────────────────────────────────────────────────────
async function uploadImage(localPath, publicId, folder = "charities") {
  const fullPath = resolve(__dirname, "../", localPath);
  if (!existsSync(fullPath)) {
    console.warn(`  ⚠️  File not found: ${fullPath} — skipping`);
    return null;
  }
  try {
    const result = await cloudinary.uploader.upload(fullPath, {
      folder: `golf-platform/${folder}`,
      public_id: publicId,
      overwrite: true,
      resource_type: "image",
      quality: "auto:good",
      fetch_format: "auto",
      transformation: [{ width: 800, height: 600, crop: "fill", gravity: "auto" }],
    });
    console.log(`  ✅  Uploaded ${publicId} → ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.error(`  ❌  Upload failed for ${publicId}:`, err.message);
    return null;
  }
}

// ── Charity seed data ─────────────────────────────────────────────────────────
const CHARITIES = [
  {
    localImage: "public/charity-ocean.png",
    cloudinaryId: "ocean-conservancy",
    name: "Ocean Conservancy",
    description:
      "Protecting vulnerable marine ecosystems and funding rapid-response cleanup initiatives near coastal golf courses and recreational waterways.",
    category: "ENVIRONMENT",
    is_featured: true,
    total_generated_paise: 12500000,
    website_url: "https://oceanconservancy.org",
    events: [
      { title: "Coastal Clean-up Golf Day", date: "2026-05-10", description: "Annual charity tournament along Pebble Beach." },
    ],
  },
  {
    localImage: "public/charity-golf-youth.png",
    cloudinaryId: "youth-on-course",
    name: "Youth on Course",
    description:
      "Providing accessible rounds, caddie programs, and college scholarships to high school students through the game of golf.",
    category: "YOUTH ATHLETICS",
    is_featured: true,
    total_generated_paise: 43000000,
    website_url: "https://youthoncourse.org",
    events: [
      { title: "Junior Golf Championship", date: "2026-06-15", description: "Scholarship fundraiser tournament for student golfers." },
    ],
  },
  {
    localImage: "public/charity-nature.png",
    cloudinaryId: "nature-conservancy",
    name: "Nature Conservancy",
    description:
      "Conserving the lands and waters on which all life depends through data-driven land acquisition and sustainable partnerships.",
    category: "ENVIRONMENT",
    is_featured: false,
    total_generated_paise: 7500000,
    website_url: "https://nature.org",
    events: [],
  },
  {
    localImage: "public/charity-warrior.png",
    cloudinaryId: "wounded-warrior",
    name: "Wounded Warrior Project",
    description:
      "Rehabilitation and athletic programs designed for veterans recovering from physical and mental injuries sustained in service.",
    category: "HEALTH & WELLNESS",
    is_featured: true,
    total_generated_paise: 31500000,
    website_url: "https://woundedwarriorproject.org",
    events: [
      { title: "Veterans Golf Classic", date: "2026-07-04", description: "Charity tournament honouring veteran golfers." },
    ],
  },
  {
    localImage: "public/charity-water.png",
    cloudinaryId: "clean-water-action",
    name: "Clean Water Action",
    description:
      "Protecting municipal water sources and combating industrial runoff near golf courses and recreational areas.",
    category: "ENVIRONMENT",
    is_featured: false,
    total_generated_paise: 8500000,
    website_url: "https://cleanwater.org",
    events: [],
  },
  {
    localImage: "public/charity-first-tee.png",
    cloudinaryId: "first-tee",
    name: "First Tee",
    description:
      "Integrating life skills and character education through the game of golf for inner-city youth, building confidence on and off the course.",
    category: "YOUTH ATHLETICS",
    is_featured: false,
    total_generated_paise: 21000000,
    website_url: "https://firsttee.org",
    events: [
      { title: "First Tee Open", date: "2026-08-20", description: "Youth showcase tournament with coaching clinics." },
    ],
  },
];

// ── Prize seed data ───────────────────────────────────────────────────────────
// We'll use simple placeholder images for prizes since we don't have real product photos
const PRIZE_PLACEHOLDERS = [
  { cloudinaryId: "prize-titleist-set", label: "Custom Titleist Iron Set" },
  { cloudinaryId: "prize-pro-shop-credit", label: "$500 Pro Shop Credit" },
  { cloudinaryId: "prize-whoop-pro", label: "Whoop 1-Year Pro Membership" },
];

// ── Step 1: Upload charity images ─────────────────────────────────────────────
console.log("\n🖼️   Uploading charity images to Cloudinary...\n");
for (const charity of CHARITIES) {
  const url = await uploadImage(charity.localImage, charity.cloudinaryId, "charities");
  charity._uploadedUrl = url;
}

// ── Step 2: Upload prize images (using charity images as placeholders) ────────
console.log("\n🏆  Uploading prize placeholder images...\n");
const prizeUrls = [];
const prizeLocalImages = [
  "public/charity-first-tee.png",  // golf club imagery
  "public/charity-golf-youth.png", // shop credit imagery
  "public/charity-warrior.png",    // whoop imagery
];
for (let i = 0; i < PRIZE_PLACEHOLDERS.length; i++) {
  const p = PRIZE_PLACEHOLDERS[i];
  const url = await uploadImage(prizeLocalImages[i], p.cloudinaryId, "prizes");
  prizeUrls.push(url);
}

// ── Step 3: Upsert charities into Supabase ────────────────────────────────────
console.log("\n📦  Seeding charities into Supabase...\n");
for (const charity of CHARITIES) {
  const { error } = await supabase
    .from("charities")
    .upsert(
      {
        name: charity.name,
        description: charity.description,
        website_url: charity.website_url,
        logo_url: charity._uploadedUrl ?? null,
        is_featured: charity.is_featured,
        category: charity.category,
        total_generated_paise: charity.total_generated_paise,
        events: JSON.stringify(charity.events),
      },
      { onConflict: "name" }
    );
  if (error) {
    console.error(`  ❌  Failed to upsert charity "${charity.name}":`, error.message);
  } else {
    console.log(`  ✅  Upserted charity: ${charity.name}`);
  }
}

// ── Step 4: Upsert current month's draw with prize data ───────────────────────
const currentMonth = new Date().toISOString().slice(0, 7);
console.log(`\n🎲  Seeding draw for ${currentMonth}...\n`);

const { data: existingDraw, error: fetchErr } = await supabase
  .from("draws")
  .select("id")
  .eq("draw_month", currentMonth)
  .single();

const drawPayload = {
  draw_month: currentMonth,
  status: "draft",
  description: `Monthly draw for ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
  prize_1_image_url: prizeUrls[0],
  prize_1_label: PRIZE_PLACEHOLDERS[0].label,
  prize_2_image_url: prizeUrls[1],
  prize_2_label: PRIZE_PLACEHOLDERS[1].label,
  prize_3_image_url: prizeUrls[2],
  prize_3_label: PRIZE_PLACEHOLDERS[2].label,
  prize_pool_total_paise: 4500000, // ₹45,000
};

if (existingDraw?.id) {
  const { error } = await supabase
    .from("draws")
    .update(drawPayload)
    .eq("id", existingDraw.id);
  if (error) console.error("  ❌  Draw update failed:", error.message);
  else console.log(`  ✅  Updated draw for ${currentMonth}`);
} else {
  const { error } = await supabase.from("draws").insert(drawPayload);
  if (error) console.error("  ❌  Draw insert failed:", error.message);
  else console.log(`  ✅  Inserted draw for ${currentMonth}`);
}

// ── Done ──────────────────────────────────────────────────────────────────────
console.log("\n✨  Seed complete! Visit /charities to see the live data.\n");
