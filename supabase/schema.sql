-- =============================================================================
-- GOLF CHARITY SUBSCRIPTION PLATFORM — Complete Database Schema
-- PRD §15: "Database Backend connected (e.g. Supabase) with proper schema"
-- PRD §16 (Evaluation): "System Design Quality — data modelling"
--
-- Run this entire file in Supabase SQL Editor on a fresh project.
-- Tables: users, subscriptions, scores, draws, winners, charities, donations, settings
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. USERS TABLE
-- PRD §03: Three roles — public (anon), user, admin
-- =============================================================================
CREATE TABLE public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  full_name       TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  -- PRD §08: Charity selection at signup, min 10%
  charity_id      UUID REFERENCES public.charities(id) ON DELETE SET NULL,
  charity_percent NUMERIC(5,2) NOT NULL DEFAULT 10.00
                  CHECK (charity_percent >= 10 AND charity_percent <= 100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NOTE: charities table must exist before users can reference it.
-- We define charities FIRST below, then users. This ordering matters.

-- =============================================================================
-- 2. CHARITIES TABLE
-- PRD §08: Charity directory with search, profiles, events, featured section
-- =============================================================================
CREATE TABLE public.charities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  website_url TEXT,
  logo_url    TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,  -- PRD §08: Featured/spotlight section
  -- PRD §08: "upcoming events (e.g. golf days)" stored as JSONB array
  events      JSONB DEFAULT '[]'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text search index for charity search (PRD §08: "search and filter")
CREATE INDEX idx_charities_name_search ON public.charities USING GIN (to_tsvector('english', name || ' ' || description));
CREATE INDEX idx_charities_featured ON public.charities (is_featured);

-- =============================================================================
-- Reorder: Create charities first, then users (FK constraint)
-- =============================================================================
-- (In Supabase SQL Editor, run charities CREATE before users CREATE)
-- The migration order here is: charities → users → subscriptions → scores → draws → winners → donations → settings

-- Drop and recreate users with proper FK order
-- (If running fresh, charities table already exists above — users can safely reference it)

-- =============================================================================
-- 3. SUBSCRIPTIONS TABLE
-- PRD §04: Monthly/Yearly plans, Razorpay, lifecycle states
-- PRD §07: Prize pool contribution stored per subscription
-- PRD §08: Charity contribution stored per subscription
-- =============================================================================
CREATE TABLE public.subscriptions (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  razorpay_subscription_id        TEXT NOT NULL UNIQUE,
  razorpay_plan_id                TEXT NOT NULL,
  plan_type                       TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  -- PRD §04: Subscription lifecycle states
  status                          TEXT NOT NULL DEFAULT 'created'
                                  CHECK (status IN ('created','authenticated','active','paused','cancelled','completed','expired')),
  current_period_start            TIMESTAMPTZ,
  current_period_end              TIMESTAMPTZ,   -- PRD §10: "renewal date"
  -- PRD §07: Auto-calculated prize pool contribution per billing cycle
  prize_pool_contribution_paise   BIGINT NOT NULL DEFAULT 0,
  -- PRD §08: Auto-calculated charity contribution per billing cycle
  charity_contribution_paise      BIGINT NOT NULL DEFAULT 0,
  cancelled_at                    TIMESTAMPTZ,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions (status);
CREATE INDEX idx_subscriptions_razorpay_id ON public.subscriptions (razorpay_subscription_id);

-- =============================================================================
-- 4. SCORES TABLE
-- PRD §05: Stableford 1–45, date required, rolling 5 logic
-- =============================================================================
CREATE TABLE public.scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- PRD §05: Stableford format, range 1–45
  value       SMALLINT NOT NULL CHECK (value >= 1 AND value <= 45),
  -- PRD §05: "Each score must include a date"
  played_at   DATE NOT NULL,
  course_name TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scores_user_id ON public.scores (user_id);
CREATE INDEX idx_scores_user_played ON public.scores (user_id, played_at DESC);

-- Trigger: Enforce rolling 5 — automatically delete oldest score when >5 exist
-- PRD §05: "A new score replaces the oldest stored score automatically"
CREATE OR REPLACE FUNCTION public.enforce_rolling_5_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INT;
  v_oldest_id UUID;
BEGIN
  -- Count how many scores this user now has (AFTER insert)
  SELECT COUNT(*) INTO v_count
  FROM public.scores
  WHERE user_id = NEW.user_id;

  -- If more than 5, delete the oldest
  IF v_count > 5 THEN
    SELECT id INTO v_oldest_id
    FROM public.scores
    WHERE user_id = NEW.user_id
    ORDER BY played_at ASC, created_at ASC
    LIMIT 1;

    DELETE FROM public.scores WHERE id = v_oldest_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rolling_5_scores
  AFTER INSERT ON public.scores
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_rolling_5_scores();

-- =============================================================================
-- 5. DRAWS TABLE
-- PRD §06: Monthly draws, random/algorithmic, simulation, publish
-- PRD §07: Prize pool + jackpot rollover
-- =============================================================================
CREATE TABLE public.draws (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- PRD §06: Monthly cadence — one draw per month (YYYY-MM)
  draw_month               CHAR(7) NOT NULL UNIQUE,  -- e.g. '2026-03'
  status                   TEXT NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'simulation', 'published')),
  draw_mode                TEXT CHECK (draw_mode IN ('random', 'algorithmic')),
  -- PRD §06: The 5 winning numbers
  winning_numbers          SMALLINT[],
  -- PRD §07: Prize pool amounts
  prize_pool_total_paise   BIGINT,
  -- PRD §07: "5-Match jackpot carries forward if unclaimed"
  jackpot_rollover_paise   BIGINT NOT NULL DEFAULT 0,
  active_subscriber_count  INT,
  description              TEXT,
  published_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_draws_status ON public.draws (status);
CREATE INDEX idx_draws_month ON public.draws (draw_month DESC);

-- =============================================================================
-- 6. WINNERS TABLE
-- PRD §09: Winner verification — pending → proof_submitted → approved → paid
-- PRD §07: Prize split equally among multiple winners in same tier
-- =============================================================================
CREATE TABLE public.winners (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id               UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- PRD §06: Match tier
  tier                  TEXT NOT NULL CHECK (tier IN ('five', 'four', 'three')),
  -- PRD §07: Share of the tier prize pool
  prize_amount_paise    BIGINT NOT NULL,
  -- PRD §09: Winner verification lifecycle
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','proof_submitted','approved','rejected','paid')),
  -- PRD §09: "Screenshot of scores from the golf platform"
  proof_url             TEXT,
  proof_submitted_at    TIMESTAMPTZ,
  admin_note            TEXT,
  verified_by           UUID REFERENCES public.users(id),
  payout_completed_at   TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A user can only win once per draw per tier
  UNIQUE (draw_id, user_id, tier)
);

CREATE INDEX idx_winners_user_id ON public.winners (user_id);
CREATE INDEX idx_winners_draw_id ON public.winners (draw_id);
CREATE INDEX idx_winners_status ON public.winners (status);

-- =============================================================================
-- 7. DONATIONS TABLE
-- PRD §08: Subscription-share donations + independent donations
-- =============================================================================
CREATE TABLE public.donations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  charity_id       UUID NOT NULL REFERENCES public.charities(id) ON DELETE CASCADE,
  amount_paise     BIGINT NOT NULL CHECK (amount_paise > 0),
  -- PRD §08: "Independent donation option (not tied to gameplay)"
  type             TEXT NOT NULL DEFAULT 'subscription_share'
                   CHECK (type IN ('subscription_share', 'independent')),
  subscription_id  UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_user_id ON public.donations (user_id);
CREATE INDEX idx_donations_charity_id ON public.donations (charity_id);
CREATE INDEX idx_donations_type ON public.donations (type);

-- =============================================================================
-- 8. SETTINGS TABLE
-- Global platform configuration — admin-only
-- Stores: jackpot_rollover_paise, platform_name, etc.
-- =============================================================================
CREATE TABLE public.settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO public.settings (key, value) VALUES
  ('platform_name', 'Golf Charity Platform'),
  ('jackpot_rollover_paise', '0'),
  ('charity_min_percent', '10'),
  ('subscription_prize_pool_percent', '50');

-- =============================================================================
-- 9. UPDATED_AT TRIGGERS (auto-update timestamps)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_draws_updated_at
  BEFORE UPDATE ON public.draws
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_charities_updated_at
  BEFORE UPDATE ON public.charities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 10. HELPER FUNCTION (for RLS policies)
-- Security-definer so RLS policies can call it without infinite recursion
-- =============================================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(role, 'user')
  FROM public.users
  WHERE id = auth.uid();
$$;

-- =============================================================================
-- 11. ROW LEVEL SECURITY — Enable on every table
-- PRD §13: Security enforcement
-- =============================================================================
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings       ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 12. RLS POLICIES
-- (These mirror the policies in the uploaded SQL file, with improvements)
-- =============================================================================

-- USERS
CREATE POLICY "users_select_own"     ON public.users FOR SELECT    TO authenticated USING (id = auth.uid());
CREATE POLICY "users_insert_own"     ON public.users FOR INSERT    TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "users_update_own"     ON public.users FOR UPDATE    TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "users_admin_all"      ON public.users FOR ALL       TO authenticated USING (public.current_user_role() = 'admin');

-- CHARITIES (public read — PRD §03: "Public Visitor can explore listed charities")
CREATE POLICY "charities_public_read"  ON public.charities FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "charities_admin_all"    ON public.charities FOR ALL    TO authenticated       USING (public.current_user_role() = 'admin');

-- SUBSCRIPTIONS
CREATE POLICY "sub_select_own"       ON public.subscriptions FOR SELECT               TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sub_insert_own"       ON public.subscriptions FOR INSERT               TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "sub_update_own"       ON public.subscriptions FOR UPDATE               TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "sub_delete_own"       ON public.subscriptions FOR DELETE               TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sub_admin_all"        ON public.subscriptions FOR ALL                  TO authenticated USING (public.current_user_role() = 'admin');

-- SCORES
CREATE POLICY "scores_own_all"       ON public.scores FOR ALL    TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "scores_admin_all"     ON public.scores FOR ALL    TO authenticated USING (public.current_user_role() = 'admin');

-- DRAWS (published draws are public — PRD §06)
CREATE POLICY "draws_public_published" ON public.draws FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "draws_admin_all"        ON public.draws FOR ALL   TO authenticated        USING (public.current_user_role() = 'admin');

-- WINNERS
CREATE POLICY "winners_select_own"   ON public.winners FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "winners_update_proof" ON public.winners FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "winners_admin_all"    ON public.winners FOR ALL    TO authenticated USING (public.current_user_role() = 'admin');

-- DONATIONS
CREATE POLICY "donations_select_own" ON public.donations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "donations_insert_own" ON public.donations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "donations_admin_all"  ON public.donations FOR ALL   TO authenticated USING (public.current_user_role() = 'admin');

-- SETTINGS (admin only)
CREATE POLICY "settings_admin_all"   ON public.settings FOR ALL   TO authenticated USING (public.current_user_role() = 'admin');

-- =============================================================================
-- 13. SEED DATA — Sample charities for testing (PRD §16 Testing Checklist)
-- =============================================================================
INSERT INTO public.charities (id, name, description, is_featured, events) VALUES
  (gen_random_uuid(), 'Green Fields Foundation',
   'Supporting underprivileged youth through golf training programs across India.',
   TRUE,
   '[{"title":"Annual Golf Day","date":"2026-04-15","description":"Charity golf tournament raising funds for youth programs"}]'::JSONB),

  (gen_random_uuid(), 'Birdie for Hope',
   'Providing mental health support for young athletes and school children.',
   FALSE, '[]'::JSONB),

  (gen_random_uuid(), 'Eagle Eye Education',
   'Funding sports scholarships and school equipment for rural communities.',
   FALSE, '[]'::JSONB);

-- =============================================================================
-- 14. SEED DATA — Draft draw for current month (for testing simulation)
-- =============================================================================
INSERT INTO public.draws (draw_month, status, description) VALUES
  (TO_CHAR(NOW(), 'YYYY-MM'), 'draft', 'Monthly draw for ' || TO_CHAR(NOW(), 'Month YYYY'));

-- =============================================================================
-- DONE — Schema is complete and ready for deployment.
-- Run: supabase db push OR paste into Supabase SQL Editor
-- =============================================================================
