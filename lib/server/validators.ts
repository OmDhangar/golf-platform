/**
 * lib/server/validators.ts
 *
 * PRD §16 (Evaluation): "Data Handling — Accuracy of score logic, draw engine, prize calculations"
 * All Zod schemas for every API endpoint. Single source of truth for request validation.
 *
 * Validates:
 *  - Auth (signup, login)
 *  - Scores (Stableford 1–45, date required — PRD §05)
 *  - Subscriptions (plan type, charity percent — PRD §04, §08)
 *  - Draws (mode, simulate flag — PRD §06)
 *  - Winners (proof upload — PRD §09)
 *  - Admin (user updates, draw config)
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// COMMON REUSABLES
// ---------------------------------------------------------------------------
const uuidSchema = z.string().uuid("Invalid UUID format");

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------
export const signupSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long"),
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .trim(),
  // PRD §08: Charity must be selected at signup (required for all users)
  charity_id: uuidSchema,
  // PRD §08: Min 10% charity contribution
  charity_percent: z
    .number()
    .min(10, "Minimum charity contribution is 10%")
    .max(100, "Cannot exceed 100%")
    .default(10),
  // PRD §04: Plan selection during signup (free option added)
  plan_type: z.enum(["free", "monthly", "yearly"], {
    errorMap: () => ({ message: "Plan must be free, monthly, or yearly" }),
  }),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

// ---------------------------------------------------------------------------
// SCORES — PRD §05
// Score range: 1–45 (Stableford format)
// Each score must include a date
// Only latest 5 retained
// ---------------------------------------------------------------------------
export const scoreCreateSchema = z.object({
  value: z
    .number()
    .int("Score must be a whole number")
    .min(1, "Stableford score minimum is 1")
    .max(45, "Stableford score maximum is 45"),
  played_at: dateStringSchema,
  course_name: z
    .string()
    .max(200, "Course name too long")
    .trim()
    .optional(),
});

export const scoreUpdateSchema = z.object({
  score_id: uuidSchema,
  value: z
    .number()
    .int()
    .min(1, "Stableford minimum is 1")
    .max(45, "Stableford maximum is 45")
    .optional(),
  played_at: dateStringSchema.optional(),
  course_name: z.string().max(200).trim().optional(),
});

// ---------------------------------------------------------------------------
// SUBSCRIPTIONS — PRD §04
// ---------------------------------------------------------------------------
export const createSubscriptionSchema = z.object({
  plan_type: z.enum(["monthly", "yearly"]),
  // PRD §08: Charity selection
  charity_id: uuidSchema,
  charity_percent: z
    .number()
    .min(10, "Minimum charity contribution is 10%")
    .max(100)
    .default(10),
});

export const razorpayWebhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    subscription: z
      .object({
        entity: z.object({
          id: z.string(),
          status: z.string(),
          plan_id: z.string(),
          current_end: z.number().optional(),
          notes: z.record(z.string()).optional(),
        }),
      })
      .optional(),
    payment: z
      .object({
        entity: z.object({
          id: z.string(),
          amount: z.number(),
          subscription_id: z.string().optional(),
          status: z.string(),
        }),
      })
      .optional(),
  }),
});

// ---------------------------------------------------------------------------
// DRAWS — PRD §06
// ---------------------------------------------------------------------------
export const simulateDrawSchema = z.object({
  draw_id: uuidSchema,
  mode: z.enum(["random", "algorithmic"], {
    errorMap: () => ({ message: "Draw mode must be random or algorithmic" }),
  }),
  weight_by: z.enum(["most", "least"]).default("most"),
});

export const publishDrawSchema = z.object({
  draw_id: uuidSchema,
  mode: z.enum(["random", "algorithmic"]),
  weight_by: z.enum(["most", "least"]).default("most"),
  // Admin can override the winning numbers (e.g. after manual review)
  override_numbers: z
    .array(z.number().int().min(1).max(45))
    .length(5, "Must provide exactly 5 numbers")
    .optional(),
  confirm: z
    .literal(true, { errorMap: () => ({ message: "Must confirm publish with confirm: true" }) }),
});

export const createDrawSchema = z.object({
  draw_month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "draw_month must be YYYY-MM format"),
  description: z.string().max(500).optional(),
  prize_pool_total_paise: z.number().int().min(0).default(0),
  prize_1_label: z.string().max(200).optional().or(z.literal("")).nullable(),
  prize_2_label: z.string().max(200).optional().or(z.literal("")).nullable(),
  prize_3_label: z.string().max(200).optional().or(z.literal("")).nullable(),
  prize_1_image_url: z.string().url().optional().or(z.literal("")).nullable(),
  prize_2_image_url: z.string().url().optional().or(z.literal("")).nullable(),
  prize_3_image_url: z.string().url().optional().or(z.literal("")).nullable(),
});

// ---------------------------------------------------------------------------
// WINNERS — PRD §09
// ---------------------------------------------------------------------------
export const uploadProofSchema = z.object({
  winner_id: uuidSchema,
  // URL of uploaded screenshot (uploaded to Supabase Storage)
  proof_url: z
    .string()
    .url("Valid URL required for proof screenshot")
    .max(1000),
  notes: z.string().max(500).trim().optional(),
});

export const reviewWinnerSchema = z.object({
  winner_id: uuidSchema,
  action: z.enum(["approve", "reject"], {
    errorMap: () => ({ message: "Action must be approve or reject" }),
  }),
  admin_note: z.string().max(500).trim().optional(),
});

// ---------------------------------------------------------------------------
// CHARITIES — PRD §08
// ---------------------------------------------------------------------------
export const createCharitySchema = z.object({
  name: z.string().min(2).max(200).trim(),
  description: z.string().max(2000).trim(),
  website_url: z.string().url().optional().or(z.literal("")).nullable(),
  logo_url: z.string().url().optional().or(z.literal("")).nullable(),
  is_featured: z.boolean().default(false),
  category: z.string().default("General"),
  total_generated_paise: z.number().int().min(0).default(0),
  events: z
    .array(
      z.object({
        title: z.string().max(200),
        date: dateStringSchema,
        description: z.string().max(500).optional(),
      })
    )
    .optional(),
});

export const updateCharitySchema = createCharitySchema.partial().extend({
  charity_id: uuidSchema,
});

// ---------------------------------------------------------------------------
// ADMIN USER MANAGEMENT — PRD §11
// ---------------------------------------------------------------------------
export const adminUpdateUserSchema = z.object({
  user_id: uuidSchema,
  full_name: z.string().min(2).max(100).trim().optional(),
  role: z.enum(["user", "admin"]).optional(),
  charity_id: uuidSchema.optional(),
  charity_percent: z.number().min(10).max(100).optional(),
});

// ---------------------------------------------------------------------------
// REPORTS QUERY — PRD §11 (Reports & Analytics)
// ---------------------------------------------------------------------------
export const reportsQuerySchema = z.object({
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  include: z
    .array(z.enum(["users", "prize_pool", "charity", "draw_stats"]))
    .default(["users", "prize_pool", "charity", "draw_stats"]),
});

// ---------------------------------------------------------------------------
// PAGINATION (reusable)
// ---------------------------------------------------------------------------
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ---------------------------------------------------------------------------
// TYPE EXPORTS (inferred from schemas)
// ---------------------------------------------------------------------------
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ScoreCreateInput = z.infer<typeof scoreCreateSchema>;
export type ScoreUpdateInput = z.infer<typeof scoreUpdateSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type SimulateDrawInput = z.infer<typeof simulateDrawSchema>;
export type PublishDrawInput = z.infer<typeof publishDrawSchema>;
export type UploadProofInput = z.infer<typeof uploadProofSchema>;
export type ReviewWinnerInput = z.infer<typeof reviewWinnerSchema>;
export type CreateCharityInput = z.infer<typeof createCharitySchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type ReportsQueryInput = z.infer<typeof reportsQuerySchema>;
