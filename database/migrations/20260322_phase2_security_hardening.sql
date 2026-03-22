-- Phase 2 security hardening migration
-- Date: 2026-03-22

-- Helper to centralize admin checks in policies.
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_user_id
      AND p.role = 'admin'
  );
$$;

-- Ensure RLS is enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- Rebuild profiles access policies.
DROP POLICY IF EXISTS "Profiles self access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self update" ON public.profiles;
DROP POLICY IF EXISTS "Profiles admin read" ON public.profiles;
DROP POLICY IF EXISTS "Profiles admin update" ON public.profiles;

CREATE POLICY "Profiles self access"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Profiles self update"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles admin update"
ON public.profiles
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Rebuild draws policies with admin write boundaries.
DROP POLICY IF EXISTS "Draws select access" ON public.draws;
DROP POLICY IF EXISTS "Draws admin insert" ON public.draws;
DROP POLICY IF EXISTS "Draws admin update" ON public.draws;
DROP POLICY IF EXISTS "Draws admin delete" ON public.draws;

CREATE POLICY "Draws select access"
ON public.draws
FOR SELECT
USING (status = 'published' OR public.is_admin(auth.uid()));

CREATE POLICY "Draws admin insert"
ON public.draws
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Draws admin update"
ON public.draws
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Draws admin delete"
ON public.draws
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Rebuild winners policies. Users can read only their own rows.
-- Admins own all write flows so winner records cannot be self-awarded.
DROP POLICY IF EXISTS "Winners self access" ON public.winners;
DROP POLICY IF EXISTS "Winners self insert" ON public.winners;
DROP POLICY IF EXISTS "Winners admin read" ON public.winners;
DROP POLICY IF EXISTS "Winners admin insert" ON public.winners;
DROP POLICY IF EXISTS "Winners admin update" ON public.winners;
DROP POLICY IF EXISTS "Winners admin delete" ON public.winners;

CREATE POLICY "Winners read access"
ON public.winners
FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Winners admin insert"
ON public.winners
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Winners admin update"
ON public.winners
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Winners admin delete"
ON public.winners
FOR DELETE
USING (public.is_admin(auth.uid()));
