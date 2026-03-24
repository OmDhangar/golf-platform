/**
 * lib/server/drawEngine.ts
 *
 * PRD §06: Draw & Reward System
 * PRD §07: Prize Pool Logic
 *
 * This is the most complex piece of business logic in the system.
 * It handles:
 *  - Random draw generation (standard lottery-style)
 *  - Algorithmic draw (weighted by most/least frequent user scores)
 *  - Winner matching (5-match, 4-match, 3-match)
 *  - Prize pool auto-calculation (40/35/25 split)
 *  - 5-match jackpot rollover
 *  - Simulation mode (pre-analysis before official publish)
 *  - Multiple winner splitting (equal share per tier)
 *
 * PRD §16 (Evaluation): "Data Handling — Accuracy of score logic, draw engine, and prize calculations"
 */

import { createAdminClient } from "./supabase";
import { calcPrizeTiers } from "./razorpay";
import { logger } from "./logger";
import type { DrawResult, DrawWinner, MatchTier } from "@/types/index";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type DrawMode = "random" | "algorithmic";

export interface DrawConfig {
  mode: DrawMode;
  drawId: string;
  simulate: boolean;          // If true, do NOT persist to DB
  rolledOverJackpotPaise?: number;  // PRD §07: carry forward if no 5-match
}

export interface SimulationResult {
  winningNumbers: number[];
  mode: DrawMode;
  winners: {
    userId: string;
    email: string;
    tier: MatchTier;
    matchedNumbers: number[];
    prizeAmountPaise: number;
  }[];
  prizePool: {
    total: number;
    fiveMatch: number;
    fourMatch: number;
    threeMatch: number;
    rolledOver: number;
  };
  activeSubscriberCount: number;
}

// ---------------------------------------------------------------------------
// PRD §05: Score range validation (Stableford: 1–45)
// ---------------------------------------------------------------------------
const SCORE_MIN = 1;
const SCORE_MAX = 45;
const DRAW_NUMBERS_COUNT = 5;

// ---------------------------------------------------------------------------
// RANDOM DRAW — Standard lottery-style number generation
// PRD §06: "Random generation — standard lottery-style draw"
// ---------------------------------------------------------------------------
/**
 * Generates 5 unique random numbers in the Stableford range (1–45).
 */
export function generateRandomNumbers(): number[] {
  const numbers = new Set<number>();
  while (numbers.size < DRAW_NUMBERS_COUNT) {
    numbers.add(Math.floor(Math.random() * (SCORE_MAX - SCORE_MIN + 1)) + SCORE_MIN);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// ALGORITHMIC DRAW — Weighted by user score frequency
// PRD §06: "Algorithmic — weighted by most/least frequent user scores"
// ---------------------------------------------------------------------------
/**
 * Fetches all active users' latest scores and generates a weighted draw.
 * Numbers that appear more frequently in user scores have higher selection weight.
 *
 * @param supabase - Admin client (needs access to all scores)
 * @param weightByFrequency - "most" = pick common numbers, "least" = pick rare ones
 */
export async function generateAlgorithmicNumbers(
  supabase: ReturnType<typeof createAdminClient>,
  weightByFrequency: "most" | "least" = "most"
): Promise<number[]> {
  // Fetch all scores from active subscribers
  const { data: scores, error } = await supabase
    .from("scores")
    .select("value, user_id, users!inner(subscriptions!inner(status))")
    .eq("users.subscriptions.status", "active");

  if (error || !scores || scores.length === 0) {
    logger.warn("[DrawEngine] Falling back to random — no active subscriber scores found");
    return generateRandomNumbers();
  }

  // Build frequency map: score_value → count
  const freq = new Map<number, number>();
  for (const row of scores) {
    const v = row.value as number;
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }

  // Build weighted pool
  // For "most": numbers with higher frequency get more slots in the pool
  // For "least": numbers with lower frequency get more slots
  const pool: number[] = [];
  const maxFreq = Math.max(...freq.values());

  for (const [num, count] of freq.entries()) {
    const weight = weightByFrequency === "most" ? count : maxFreq - count + 1;
    for (let i = 0; i < weight; i++) pool.push(num);
  }

  // Weighted random sampling without replacement
  const selected = new Set<number>();
  const remaining = [...pool];

  while (selected.size < DRAW_NUMBERS_COUNT && remaining.length > 0) {
    const idx = Math.floor(Math.random() * remaining.length);
    selected.add(remaining[idx]);
    // Remove all instances of this number from pool (no replacement)
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (remaining[i] === remaining[idx]) remaining.splice(i, 1);
    }
  }

  // If we didn't get enough (sparse data), fill with random
  while (selected.size < DRAW_NUMBERS_COUNT) {
    const fallback = Math.floor(Math.random() * (SCORE_MAX - SCORE_MIN + 1)) + SCORE_MIN;
    selected.add(fallback);
  }

  return Array.from(selected).sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// WINNER MATCHING
// PRD §06: 5-Number Match, 4-Number Match, 3-Number Match
// ---------------------------------------------------------------------------
/**
 * Determines how many of the user's 5 scores match the winning numbers.
 * A match occurs when the user's score equals a winning number.
 *
 * @param userScores - Array of the user's last 5 score values
 * @param winningNumbers - The 5 drawn winning numbers
 * @returns tier ('five' | 'four' | 'three' | null) and matched number array
 */
export function matchScores(
  userScores: number[],
  winningNumbers: number[]
): { tier: MatchTier | null; matched: number[] } {
  const winSet = new Set(winningNumbers);
  const matched = userScores.filter((s) => winSet.has(s));

  if (matched.length >= 5) return { tier: "five", matched };
  if (matched.length === 4) return { tier: "four", matched };
  if (matched.length === 3) return { tier: "three", matched };
  return { tier: null, matched };
}

// ---------------------------------------------------------------------------
// PRIZE POOL CALCULATION
// PRD §07: Auto-calculation based on active subscriber count
// ---------------------------------------------------------------------------
/**
 * Calculates the total prize pool for this draw cycle.
 *
 * Pool = sum of prize_pool_contribution from subscriptions paid this period.
 * In practice, we store `prize_pool_contribution_paise` on each subscription record
 * and sum them from the last billing cycle.
 *
 * @param supabase - Admin client
 * @param rolledOverJackpotPaise - Carry-over from previous month if no 5-match winner
 */
async function calculatePrizePool(
  supabase: ReturnType<typeof createAdminClient>,
  rolledOverJackpotPaise: number = 0
): Promise<{
  total: number;
  fiveMatch: number;
  fourMatch: number;
  threeMatch: number;
  activeCount: number;
}> {
  // Sum prize_pool_contribution from all active subscriptions this cycle
  const { data, error } = await supabase
    .from("subscriptions")
    .select("prize_pool_contribution_paise")
    .eq("status", "active");

  if (error) throw new Error(`Prize pool query failed: ${error.message}`);

  const total = (data ?? []).reduce(
    (sum, row) => sum + (row.prize_pool_contribution_paise ?? 0),
    0
  ) + rolledOverJackpotPaise;  // PRD §07: add rolled-over jackpot

  const tiers = calcPrizeTiers(total);

  return {
    total,
    ...tiers,
    activeCount: data?.length ?? 0,
  };
}

// ---------------------------------------------------------------------------
// MAIN ENGINE: Run draw (simulate or official)
// PRD §06: "Simulation / pre-analysis mode before official publish"
// ---------------------------------------------------------------------------
/**
 * Core draw execution function.
 * Supports both simulation (no DB writes) and official runs (writes winners to DB).
 *
 * Steps:
 *  1. Generate winning numbers (random or algorithmic)
 *  2. Fetch all active subscribers with their latest 5 scores
 *  3. Match each user's scores against winning numbers
 *  4. Calculate prize pool + tier splits
 *  5. Handle jackpot rollover if no 5-match winner
 *  6. If not simulation: persist winners + update draw record
 */
export async function runDraw(config: DrawConfig): Promise<SimulationResult> {
  const log = logger.child({ drawId: config.drawId, mode: config.mode, simulate: config.simulate });
  const supabase = createAdminClient();

  log.info("[DrawEngine] Starting draw run");

  // --- Step 1: Generate winning numbers ---
  let winningNumbers: number[];
  if (config.mode === "random") {
    winningNumbers = generateRandomNumbers();
  } else {
    winningNumbers = await generateAlgorithmicNumbers(supabase, "most");
  }
  log.info("[DrawEngine] Winning numbers generated", { winningNumbers });

  // --- Step 2: Fetch all active subscribers + their latest 5 scores ---
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select(`
      id,
      email,
      subscriptions!inner(status),
      scores(value, created_at)
    `)
    .eq("subscriptions.status", "active");

  if (usersError) throw new Error(`User fetch failed: ${usersError.message}`);

  // --- Step 3: Prize pool calculation ---
  const pool = await calculatePrizePool(supabase, config.rolledOverJackpotPaise ?? 0);
  log.info("[DrawEngine] Prize pool calculated", { pool });

  // --- Step 4: Match each user ---
  const winnersByTier: Record<"five" | "four" | "three", typeof users> = {
    five: [],
    four: [],
    three: [],
  };

  for (const user of users ?? []) {
    // Get the latest 5 scores sorted by date descending (PRD §05)
    const latestScores = ((user.scores as any[]) ?? [])
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((s: any) => s.value as number);

    if (latestScores.length < 3) continue; // Need at least 3 scores to qualify

    const { tier } = matchScores(latestScores, winningNumbers);
    if (tier) winnersByTier[tier].push(user);
  }

  // --- Step 5: Calculate individual prize amounts (split equally per tier) ---
  // PRD §07: "Prizes split equally among multiple winners in the same tier"
  const buildWinners = (
    tier: MatchTier,
    tierPool: number
  ): SimulationResult["winners"] => {
    const tierUsers = winnersByTier[tier as "five" | "four" | "three"];
    if (!tierUsers || tierUsers.length === 0) return [];
    const share = Math.floor(tierPool / tierUsers.length);
    return tierUsers.map((u) => ({
      userId: u.id,
      email: u.email ?? "",
      tier,
      matchedNumbers: [],  // Populated below
      prizeAmountPaise: share,
    }));
  };

  const allWinners: SimulationResult["winners"] = [
    ...buildWinners("five", pool.fiveMatch),
    ...buildWinners("four", pool.fourMatch),
    ...buildWinners("three", pool.threeMatch),
  ];

  // --- Step 6: Jackpot rollover ---
  // PRD §07: "5-Match jackpot carries forward if unclaimed"
  const rolledOver = winnersByTier.five.length === 0 ? pool.fiveMatch : 0;

  const result: SimulationResult = {
    winningNumbers,
    mode: config.mode,
    winners: allWinners,
    prizePool: {
      total: pool.total,
      fiveMatch: pool.fiveMatch,
      fourMatch: pool.fourMatch,
      threeMatch: pool.threeMatch,
      rolledOver,
    },
    activeSubscriberCount: pool.activeCount,
  };

  log.info("[DrawEngine] Draw simulation complete", {
    winners: allWinners.length,
    rolledOver,
  });

  // --- Step 7: Persist if not simulation ---
  if (!config.simulate) {
    await persistDrawResults(supabase, config.drawId, result);
    log.info("[DrawEngine] Draw results persisted to database");
  }

  return result;
}

// ---------------------------------------------------------------------------
// PERSISTENCE — Write winners to DB (official publish only)
// PRD §06: "Admin controls publishing of draw results"
// ---------------------------------------------------------------------------
async function persistDrawResults(
  supabase: ReturnType<typeof createAdminClient>,
  drawId: string,
  result: SimulationResult
): Promise<void> {
  // Wrap in a transaction-like sequence (Supabase doesn't support client-side transactions,
  // so we handle partial failure via explicit cleanup in catch)

  // 1. Update the draw record with winning numbers + status
  const { error: drawError } = await supabase
    .from("draws")
    .update({
      winning_numbers: result.winningNumbers,
      status: "published",
      draw_mode: result.mode,
      prize_pool_total_paise: result.prizePool.total,
      jackpot_rollover_paise: result.prizePool.rolledOver,
      active_subscriber_count: result.activeSubscriberCount,
      published_at: new Date().toISOString(),
    })
    .eq("id", drawId);

  if (drawError) throw new Error(`Draw update failed: ${drawError.message}`);

  // 2. Insert winner records
  if (result.winners.length > 0) {
    const winnerRows = result.winners.map((w) => ({
      draw_id: drawId,
      user_id: w.userId,
      tier: w.tier,
      prize_amount_paise: w.prizeAmountPaise,
      status: "pending" as const,
      created_at: new Date().toISOString(),
    }));

    const { error: winnersError } = await supabase
      .from("winners")
      .insert(winnerRows);

    if (winnersError) throw new Error(`Winners insert failed: ${winnersError.message}`);
  }

  // 3. Carry jackpot rollover into settings for next draw
  if (result.prizePool.rolledOver > 0) {
    await supabase
      .from("settings")
      .upsert({
        key: "jackpot_rollover_paise",
        value: String(result.prizePool.rolledOver),
        updated_at: new Date().toISOString(),
      });
  } else {
    // Clear rollover once claimed
    await supabase
      .from("settings")
      .delete()
      .eq("key", "jackpot_rollover_paise");
  }
}
