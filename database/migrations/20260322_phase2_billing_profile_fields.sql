-- Phase 2 billing profile fields migration
-- Date: 2026-03-22

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id
  ON public.profiles (stripe_subscription_id);
