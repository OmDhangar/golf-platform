#!/usr/bin/env node
/**
 * scripts/migrate.mjs
 * Runs ALTER TABLE migrations on Supabase via the pg-based RPC or direct REST.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

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

const MIGRATIONS = [
  "ALTER TABLE public.charities ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General'",
  "ALTER TABLE public.charities ADD COLUMN IF NOT EXISTS total_generated_paise BIGINT DEFAULT 0",
  "ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS prize_1_image_url TEXT",
  "ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS prize_2_image_url TEXT",
  "ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS prize_3_image_url TEXT",
  "ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS prize_1_label TEXT",
  "ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS prize_2_label TEXT",
  "ALTER TABLE public.draws ADD COLUMN IF NOT EXISTS prize_3_label TEXT",
];

console.log("\n🔧  Running schema migrations...\n");

for (const sql of MIGRATIONS) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    const text = await res.text();
    // 404 = function doesn't exist, 200/204 = success
    if (res.ok || res.status === 204) {
      console.log(`  ✅  ${sql.slice(0, 60)}...`);
    } else if (res.status === 404) {
      console.warn(`  ⚠️   exec_sql RPC not found. Please run SQL manually in Supabase dashboard.`);
      console.warn(`      SQL: ${sql}`);
    } else {
      console.error(`  ❌  (${res.status}) ${text}`);
    }
  } catch (err) {
    console.error(`  ❌  ${err.message}`);
  }
}

console.log("\n✅  Migration attempt complete.\n");
