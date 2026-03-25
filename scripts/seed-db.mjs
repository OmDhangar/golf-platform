#!/usr/bin/env node
/**
 * scripts/seed-db.mjs
 *
 * 1. Uploads public images to Cloudinary for each charity and prize
 * 2. Gets the secure Cloudinary URLs
 * 3. Ingests the charities and the active draw into Supabase using those URLs
 *
 * Usage:  node scripts/seed-db.mjs
 *
 * Requires in .env:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env ────────────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    process.env[t.slice(0, eq).trim()] ??= t.slice(eq + 1).trim();
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ── Supabase REST helper ─────────────────────────────────────────────────────
async function supabaseUpsert(table, rows, onConflict = "name") {
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Prefer": "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase error ${res.status}: ${text}`);
  return JSON.parse(text);
}

// ── Cloudinary Upload Helper ─────────────────────────────────────────────────
async function uploadImageToCloudinary(localPath, publicId, folder = "charities") {
  const fullPath = resolve(__dir, "../", localPath);
  if (!existsSync(fullPath)) {
    console.warn(`  ⚠️  File not found: ${fullPath} — skipping upload`);
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
    console.log(`  ☁️   Uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.error(`  ❌  Cloudinary upload failed for ${publicId}:`, err.message);
    return null;
  }
}

// ── Detect if new columns should be included ──────────────────────────────
const WITH_NEW_COLS = process.argv.includes("--with-new-cols");
if (!WITH_NEW_COLS) {
  console.log("ℹ️   Running in base-schema mode.");
  console.log("   (Migration columns like 'category' will be omitted. Pass --with-new-cols to include them.)\n");
}

// ── Charity seed data ────────────────────────────────────────────────────────
const CHARITIES_BASE = [
  {
    logo_url: "https://res.cloudinary.com/djegu50p5/image/upload/v1774453846/charity-ocean_bbt3l3.jpg",
    name: "Ocean Conservancy",
    description: "Protecting vulnerable marine ecosystems and funding rapid-response cleanup initiatives near coastal golf courses and recreational waterways.",
    website_url: "https://oceanconservancy.org",
    is_featured: true,
    events: JSON.stringify([{ title: "Coastal Clean-up Golf Day", date: "2026-05-10", description: "Annual charity tournament along Pebble Beach." }]),
  },
  {
    logo_url: "https://res.cloudinary.com/djegu50p5/image/upload/v1774453845/charity-golf-youth_kj7pbs.jpg",
    name: "Youth on Course",
    description: "Providing accessible rounds, caddie programs, and college scholarships to high school students through the game of golf.",
    website_url: "https://youthoncourse.org",
    is_featured: true,
    events: JSON.stringify([{ title: "Junior Golf Championship", date: "2026-06-15", description: "Scholarship fundraiser tournament for student golfers." }]),
  },
  {
    logo_url: "https://res.cloudinary.com/djegu50p5/image/upload/v1774453845/charity-nature_pgfmkw.jpg",
    name: "Nature Conservancy",
    description: "Conserving the lands and waters on which all life depends through data-driven land acquisition and sustainable partnerships.",
    website_url: "https://nature.org",
    is_featured: false,
    events: JSON.stringify([]),
  },
  {
    logo_url: "https://res.cloudinary.com/djegu50p5/image/upload/v1774453846/charity-warrior_cbmazy.jpg",
    name: "Wounded Warrior Project",
    description: "Rehabilitation and athletic programs designed for veterans recovering from physical and mental injuries sustained in service.",
    website_url: "https://woundedwarriorproject.org",
    is_featured: true,
    events: JSON.stringify([{ title: "Veterans Golf Classic", date: "2026-07-04", description: "Charity tournament honouring veteran golfers." }]),
  },
  {
    logo_url: "https://res.cloudinary.com/djegu50p5/image/upload/v1774453846/charity-water_dyp3m2.jpg",
    name: "Clean Water Action",
    description: "Protecting municipal water sources and combating industrial runoff near golf courses and recreational areas.",
    website_url: "https://cleanwater.org",
    is_featured: false,
    events: JSON.stringify([]),
  },
  {
    logo_url: "https://res.cloudinary.com/djegu50p5/image/upload/v1774453845/charity-first-tee_smjrnq.jpg",
    name: "First Tee",
    description: "Integrating life skills and character education through the game of golf for inner-city youth, building confidence on and off the course.",
    website_url: "https://firsttee.org",
    is_featured: false,
    events: JSON.stringify([{ title: "First Tee Open", date: "2026-08-20", description: "Youth showcase tournament with coaching clinics." }]),
  },
];

const EXTRA = [
  { category: "ENVIRONMENT",     total_generated_paise: 12_500_000 },
  { category: "YOUTH ATHLETICS", total_generated_paise: 43_000_000 },
  { category: "ENVIRONMENT",     total_generated_paise:  7_500_000 },
  { category: "HEALTH & WELLNESS", total_generated_paise: 31_500_000 },
  { category: "ENVIRONMENT",     total_generated_paise:  8_500_000 },
  { category: "YOUTH ATHLETICS", total_generated_paise: 21_000_000 },
];

const CHARITIES = CHARITIES_BASE.map((c, i) =>
  WITH_NEW_COLS ? { ...c, ...EXTRA[i] } : c
);

// ── Prize placeholders ────────────────────────────────────────────────────────
const PRIZE_PLACEHOLDERS = [
  { localImage: "public/charity-first-tee.png", cloudinaryId: "prize-titleist-set", label: "Custom Titleist Iron Set" },
  { localImage: "public/charity-golf-youth.png", cloudinaryId: "prize-pro-shop-credit", label: "$500 Pro Shop Credit" },
  { localImage: "public/charity-warrior.png", cloudinaryId: "prize-whoop-pro", label: "Whoop 1-Year Pro Membership" },
];

// ── Run ───────────────────────────────────────────────────────────────────────
console.log(`\n🌐  Target Supabase: ${SUPABASE_URL}`);
console.log(`🚀  Starting Cloudinary Uploads & Database Ingestion...\n`);

console.log("📦  Processing Charities...");
let successCount = 0;

for (const charityInfo of CHARITIES) {
  console.log(`\n▶️  ${charityInfo.name}`);
  const charityData = { ...charityInfo };
  
  // 2. Ingest to Supabase
  try {
    const getUrl = `${SUPABASE_URL}/rest/v1/charities?name=eq.${encodeURIComponent(charityData.name)}&select=id`;
    const getRes = await fetch(getUrl, { headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` } });
    const existing = await getRes.json();
    
    if (existing && existing.length > 0) {
      const patchUrl = `${SUPABASE_URL}/rest/v1/charities?id=eq.${existing[0].id}`;
      const patchRes = await fetch(patchUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify(charityData)
      });
      if (!patchRes.ok) throw new Error(await patchRes.text());
      console.log(`  ✅  Updated existing DB entry with URL: ${charityData.logo_url}`);
    } else {
      const postUrl = `${SUPABASE_URL}/rest/v1/charities`;
      const postRes = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}`, "Prefer": "return=representation" },
        body: JSON.stringify([charityData])
      });
      if (!postRes.ok) throw new Error(await postRes.text());
      console.log(`  ✅  Inserted to DB with URL: ${charityData.logo_url}`);
    }
    successCount++;
  } catch (err) {
    console.error(`  ❌  DB insert failed: ${err.message}`);
  }
}

// ── Draw Processing ───────────────────────────────────────────────────────────
const currentMonth = new Date().toISOString().slice(0, 7);
console.log(`\n🎲  Processing Draw for ${currentMonth}...`);

const prizeUrls = [];
for (const p of PRIZE_PLACEHOLDERS) {
  const secureUrl = await uploadImageToCloudinary(p.localImage, p.cloudinaryId, "prizes");
  prizeUrls.push(secureUrl || null);
}

const DRAW = {
  draw_month: currentMonth,
  status: "draft",
  description: `Monthly draw for ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
  prize_pool_total_paise: 4_500_000,
  jackpot_rollover_paise: 0,
  prize_1_label: PRIZE_PLACEHOLDERS[0].label,
  prize_1_image_url: prizeUrls[0],
  prize_2_label: PRIZE_PLACEHOLDERS[1].label,
  prize_2_image_url: prizeUrls[1],
  prize_3_label: PRIZE_PLACEHOLDERS[2].label,
  prize_3_image_url: prizeUrls[2],
};

try {
  await supabaseUpsert("draws", [DRAW], "draw_month");
  console.log(`  ✅  Draw ${currentMonth} upserted with Cloudinary prize URLs`);
} catch (err) {
  if (err.message.includes("column") || err.message.includes("prize_")) {
    console.warn("  ⚠️   Prize columns not found — run the migration SQL first.");
    console.warn("       Inserting draw without prize data...");
    try {
      const { prize_1_label, prize_1_image_url, prize_2_label, prize_2_image_url, prize_3_label, prize_3_image_url, ...basicDraw } = DRAW;
      await supabaseUpsert("draws", [basicDraw], "draw_month");
      console.log(`  ✅  Draw ${currentMonth} upserted (without prize columns)`);
    } catch (e2) {
      console.error(`  ❌  Draw insert failed: ${e2.message}`);
    }
  } else {
    console.error(`  ❌  Draw: ${err.message}`);
  }
}

console.log(`\n✨  Done! ${successCount}/${CHARITIES.length} charities fully processed.\n`);
