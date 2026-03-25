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

export type User = {
  id: string;                           // Supabase auth.uid()
  email: string;
  full_name: string;
  role: UserRole;
  charity_id: string | null;            // PRD §08: selected charity
  charity_percent: number;              // PRD §08: min 10%
  created_at: string;
  updated_at: string;
};

export type Subscription = {
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
};

export type Score = {
  id: string;
  user_id: string;
  value: number;
  played_at: string;
  course_name: string | null;
  created_at: string;
};

export type Draw = {
  id: string;
  draw_month: string;
  status: DrawStatus;
  draw_mode: DrawMode | null;
  winning_numbers: number[] | null;
  prize_pool_total_paise: number | null;
  jackpot_rollover_paise: number;
  active_subscriber_count: number | null;
  description: string | null;
  published_at: string | null;
  prize_1_image_url: string | null;
  prize_2_image_url: string | null;
  prize_3_image_url: string | null;
  prize_1_label: string | null;
  prize_2_label: string | null;
  prize_3_label: string | null;
  created_at: string;
  updated_at: string;
};

export type Winner = {
  id: string;
  draw_id: string;
  user_id: string;
  tier: MatchTier;
  prize_amount_paise: number;
  status: WinnerStatus;
  proof_url: string | null;
  proof_submitted_at: string | null;
  admin_note: string | null;
  verified_by: string | null;
  payout_completed_at: string | null;
  created_at: string;
};

export type Charity = {
  id: string;
  name: string;
  description: string;
  website_url: string | null;
  logo_url: string | null;
  is_featured: boolean;
  events: CharityEvent[] | null;
  category: string | null;
  total_generated_paise: number | null;
  created_at: string;
  updated_at: string;
};

export type CharityEvent = {
  title: string;
  date: string;
  description?: string;
};

export type Donation = {
  id: string;
  user_id: string;
  charity_id: string;
  amount_paise: number;
  type: "subscription_share" | "independent";
  subscription_id: string | null;
  notes: string | null;
  created_at: string;
};

export type Setting = {
  key: string;
  value: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// DATABASE TYPE (for Supabase client generic)
// ---------------------------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          role?: UserRole;
          charity_id?: string | null;
          charity_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          charity_id?: string | null;
          charity_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: {
          id?: string;
          user_id: string;
          razorpay_subscription_id: string;
          razorpay_plan_id: string;
          plan_type: "monthly" | "yearly";
          status: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          prize_pool_contribution_paise: number;
          charity_contribution_paise: number;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          razorpay_subscription_id?: string;
          razorpay_plan_id?: string;
          plan_type?: "monthly" | "yearly";
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          prize_pool_contribution_paise?: number;
          charity_contribution_paise?: number;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scores: {
        Row: Score;
        Insert: {
          id?: string;
          user_id: string;
          value: number;
          played_at: string;
          course_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          value?: number;
          played_at?: string;
          course_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      draws: {
        Row: Draw;
        Insert: {
          id?: string;
          draw_month: string;
          status: DrawStatus;
          draw_mode?: DrawMode | null;
          winning_numbers?: number[] | null;
          prize_pool_total_paise?: number | null;
          jackpot_rollover_paise?: number;
          active_subscriber_count?: number | null;
          description?: string | null;
          published_at?: string | null;
          prize_1_image_url?: string | null;
          prize_2_image_url?: string | null;
          prize_3_image_url?: string | null;
          prize_1_label?: string | null;
          prize_2_label?: string | null;
          prize_3_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          draw_month?: string;
          status?: DrawStatus;
          draw_mode?: DrawMode | null;
          winning_numbers?: number[] | null;
          prize_pool_total_paise?: number | null;
          jackpot_rollover_paise?: number;
          active_subscriber_count?: number | null;
          description?: string | null;
          published_at?: string | null;
          prize_1_image_url?: string | null;
          prize_2_image_url?: string | null;
          prize_3_image_url?: string | null;
          prize_1_label?: string | null;
          prize_2_label?: string | null;
          prize_3_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      winners: {
        Row: Winner;
        Insert: {
          id?: string;
          draw_id: string;
          user_id: string;
          tier: MatchTier;
          prize_amount_paise: number;
          status: WinnerStatus;
          proof_url?: string | null;
          proof_submitted_at?: string | null;
          admin_note?: string | null;
          verified_by?: string | null;
          payout_completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          draw_id?: string;
          user_id?: string;
          tier?: MatchTier;
          prize_amount_paise?: number;
          status?: WinnerStatus;
          proof_url?: string | null;
          proof_submitted_at?: string | null;
          admin_note?: string | null;
          verified_by?: string | null;
          payout_completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      charities: {
        Row: Charity;
        Insert: {
          id?: string;
          name: string;
          description: string;
          website_url?: string | null;
          logo_url?: string | null;
          is_featured?: boolean;
          events?: CharityEvent[] | null;
          category?: string | null;
          total_generated_paise?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          website_url?: string | null;
          logo_url?: string | null;
          is_featured?: boolean;
          events?: CharityEvent[] | null;
          category?: string | null;
          total_generated_paise?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      donations: {
        Row: Donation;
        Insert: {
          id?: string;
          user_id: string;
          charity_id: string;
          amount_paise: number;
          type: "subscription_share" | "independent";
          subscription_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          charity_id?: string;
          amount_paise?: number;
          type?: "subscription_share" | "independent";
          subscription_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: Setting;
        Insert: Setting;
        Update: Partial<Setting>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ---------------------------------------------------------------------------
// API RESPONSE TYPES
// ---------------------------------------------------------------------------

export type ApiSuccess<T = unknown> = {
  success: true;
  data: T;
  message?: string;
}

export type ApiError = {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ---------------------------------------------------------------------------
// DRAW ENGINE TYPES (re-exported from drawEngine for convenience)
// ---------------------------------------------------------------------------
export type DrawResult = {
  drawId: string;
  winningNumbers: number[];
  mode: DrawMode;
  publishedAt: string;
}

export type DrawWinner = {
  userId: string;
  tier: MatchTier;
  prizeAmountPaise: number;
  matchedNumbers: number[];
}

// ---------------------------------------------------------------------------
// DASHBOARD SUMMARY TYPES (PRD §10 User Dashboard, §11 Admin Dashboard)
// ---------------------------------------------------------------------------
export type UserDashboardData = {
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

export type AdminReportData = {
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

