/**
 * types/index.ts
 *
 * PRD §16 (Evaluation): "System Design Quality — architecture decisions and data modelling"
 *
 * Shared TypeScript types for the entire application.
 * Mirrors the Supabase database schema exactly.
 * All API route handlers and services reference these types for type safety.
 */

// ---------------------------------------------------------------------------
// DATABASE TABLE TYPES
// ---------------------------------------------------------------------------

/** PRD §03: User roles */
export type UserRole = "user" | "admin";

/** PRD §04: Subscription lifecycle states */
export type SubscriptionStatus =
  | "created"      // Created but payment not yet made
  | "authenticated"
  | "active"       // Paying subscriber
  | "paused"
  | "cancelled"    // User or admin cancelled
  | "completed"    // All billing cycles done
  | "expired";     // Payment failed / lapsed

/** PRD §09: Winner verification states */
export type WinnerStatus = "pending" | "proof_submitted" | "approved" | "rejected" | "paid";

/** PRD §06: Draw lifecycle states */
export type DrawStatus = "draft" | "simulation" | "published";

/** PRD §06–07: Match tiers */
export type MatchTier = "five" | "four" | "three";

/** PRD §06: Draw mode */
export type DrawMode = "random" | "algorithmic";

// ---------------------------------------------------------------------------
// TABLE ROW TYPES
// ---------------------------------------------------------------------------

export interface User {
  id: string;                           // Supabase auth.uid()
  email: string;
  full_name: string;
  role: UserRole;
  charity_id: string | null;            // PRD §08: selected charity
  charity_percent: number;              // PRD §08: min 10%
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  razorpay_subscription_id: string;
  razorpay_plan_id: string;
  plan_type: "monthly" | "yearly";
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;    // PRD §10: "renewal date"
  prize_pool_contribution_paise: number; // PRD §07: auto-calculated per billing cycle
  charity_contribution_paise: number;   // PRD §08: auto-calculated
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Score {
  id: string;
  user_id: string;
  value: number;                        // PRD §05: Stableford 1–45
  played_at: string;                    // PRD §05: date required
  course_name: string | null;
  created_at: string;
}

export interface Draw {
  id: string;
  draw_month: string;                   // e.g. "2026-03"
  status: DrawStatus;
  draw_mode: DrawMode | null;
  winning_numbers: number[] | null;     // PRD §06: the 5 drawn numbers
  prize_pool_total_paise: number | null;
  jackpot_rollover_paise: number;       // PRD §07: carry-forward amount
  active_subscriber_count: number | null;
  description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Winner {
  id: string;
  draw_id: string;
  user_id: string;
  tier: MatchTier;                      // PRD §06: five | four | three
  prize_amount_paise: number;           // PRD §07: calculated share
  status: WinnerStatus;                 // PRD §09: pending → paid
  proof_url: string | null;            // PRD §09: uploaded screenshot
  proof_submitted_at: string | null;
  admin_note: string | null;
  verified_by: string | null;          // admin user_id
  payout_completed_at: string | null;
  created_at: string;
}

export interface Charity {
  id: string;
  name: string;
  description: string;
  website_url: string | null;
  logo_url: string | null;
  is_featured: boolean;                // PRD §08: "Featured / spotlight charity"
  events: CharityEvent[] | null;       // PRD §08: "upcoming events (e.g. golf days)"
  created_at: string;
  updated_at: string;
}

export interface CharityEvent {
  title: string;
  date: string;
  description?: string;
}

export interface Donation {
  id: string;
  user_id: string;
  charity_id: string;
  amount_paise: number;
  type: "subscription_share" | "independent";  // PRD §08: two donation types
  subscription_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// DATABASE TYPE (for Supabase client generic)
// ---------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, "created_at" | "updated_at">; Update: Partial<User> };
      subscriptions: { Row: Subscription; Insert: Omit<Subscription, "id" | "created_at" | "updated_at">; Update: Partial<Subscription> };
      scores: { Row: Score; Insert: Omit<Score, "id" | "created_at">; Update: Partial<Score> };
      draws: { Row: Draw; Insert: Omit<Draw, "id" | "created_at" | "updated_at">; Update: Partial<Draw> };
      winners: { Row: Winner; Insert: Omit<Winner, "id" | "created_at">; Update: Partial<Winner> };
      charities: { Row: Charity; Insert: Omit<Charity, "id" | "created_at" | "updated_at">; Update: Partial<Charity> };
      donations: { Row: Donation; Insert: Omit<Donation, "id" | "created_at">; Update: Partial<Donation> };
      settings: { Row: Setting; Insert: Setting; Update: Partial<Setting> };
    };
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: string };
    };
  };
}

// ---------------------------------------------------------------------------
// API RESPONSE TYPES
// ---------------------------------------------------------------------------

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ---------------------------------------------------------------------------
// DRAW ENGINE TYPES (re-exported from drawEngine for convenience)
// ---------------------------------------------------------------------------
export interface DrawResult {
  drawId: string;
  winningNumbers: number[];
  mode: DrawMode;
  publishedAt: string;
}

export interface DrawWinner {
  userId: string;
  tier: MatchTier;
  prizeAmountPaise: number;
  matchedNumbers: number[];
}

// ---------------------------------------------------------------------------
// DASHBOARD SUMMARY TYPES (PRD §10 User Dashboard, §11 Admin Dashboard)
// ---------------------------------------------------------------------------
export interface UserDashboardData {
  user: User;
  subscription: Subscription | null;
  scores: Score[];                  // Last 5, reverse chronological
  selectedCharity: Charity | null;
  drawParticipations: {
    draw: Draw;
    hasWon: boolean;
    winner?: Winner;
  }[];
  winnings: {
    total_paise: number;
    winners: (Winner & { draw: Pick<Draw, "draw_month"> })[];
  };
}

export interface AdminReportData {
  totalUsers: number;
  activeSubscribers: number;
  totalPrizePoolPaise: number;
  totalCharityContributionsPaise: number;
  drawStats: {
    totalDraws: number;
    publishedDraws: number;
    totalWinners: number;
  };
  charityBreakdown: {
    charity_id: string;
    charity_name: string;
    total_paise: number;
  }[];
}
