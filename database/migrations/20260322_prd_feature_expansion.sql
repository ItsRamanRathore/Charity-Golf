-- PRD feature expansion: plans, charities enrichment, draw simulation metadata,
-- winner review states, and independent donations.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
    CREATE TYPE plan_type AS ENUM ('monthly', 'yearly');
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_plan plan_type DEFAULT 'monthly';

ALTER TABLE public.draws
  ADD COLUMN IF NOT EXISTS simulated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS simulation_summary JSONB,
  ADD COLUMN IF NOT EXISTS jackpot_rollover_amount DECIMAL(12,2) DEFAULT 0.00;

ALTER TABLE public.charities
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS upcoming_events JSONB DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'winner_status' AND e.enumlabel = 'rejected'
  ) THEN
    ALTER TYPE winner_status ADD VALUE 'rejected';
  END IF;
END $$;

ALTER TABLE public.winners
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_note TEXT;

CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  charity_id UUID REFERENCES public.charities(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Donations read own or admin" ON public.donations;
DROP POLICY IF EXISTS "Donations insert own" ON public.donations;
DROP POLICY IF EXISTS "Donations admin update" ON public.donations;

CREATE POLICY "Donations read own or admin"
ON public.donations
FOR SELECT
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Donations insert own"
ON public.donations
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Donations admin update"
ON public.donations
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
