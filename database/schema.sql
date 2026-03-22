-- Golf Charity Subscription Platform — Database Schema

-- 1. Create Custom Types & Enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sub_status') THEN
        CREATE TYPE sub_status AS ENUM ('active', 'inactive', 'past_due', 'canceled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'draw_type') THEN
        CREATE TYPE draw_type AS ENUM ('random', 'algorithmic');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'draw_status') THEN
        CREATE TYPE draw_status AS ENUM ('pending', 'published');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'winner_status') THEN
        CREATE TYPE winner_status AS ENUM ('pending', 'verified', 'paid');
    END IF;
END $$;

-- 2. Create Charities Table
CREATE TABLE IF NOT EXISTS charities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    image_url TEXT,
    total_raised DECIMAL(12,2) DEFAULT 0.00,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    role user_role DEFAULT 'user',
    subscription_status sub_status DEFAULT 'inactive',
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    subscription_current_period_end TIMESTAMP WITH TIME ZONE,
    charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
    charity_percentage INT DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Scores Table (Rolling 5 scores logic managed via App server or Trigger)
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    score INT NOT NULL CHECK (score >= 1 AND score <= 45),
    score_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Draws Table
CREATE TABLE IF NOT EXISTS draws (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    type draw_type DEFAULT 'random',
    status draw_status DEFAULT 'pending',
    numbers INT[] DEFAULT '{}', -- Winning numbers/results
    prize_pool DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Winners Table
CREATE TABLE IF NOT EXISTS winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_id UUID REFERENCES draws(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    match_tier INT NOT NULL CHECK (match_tier IN (3,4,5)),
    prize_amount DECIMAL(12,2) DEFAULT 0.00,
    proof_url TEXT,
    status winner_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Supabase RLS (Row Level Security) Configuration
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM profiles p
        WHERE p.id = p_user_id
            AND p.role = 'admin'
    );
$$;

-- POLICIES
-- Charities: Read for all, Admin can manage
CREATE POLICY "Charities read access" ON charities FOR SELECT USING (true);

-- Profiles: Users can view/edit their own, Admin can view/edit all
CREATE POLICY "Profiles self access" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin(auth.uid()));
CREATE POLICY "Profiles self update" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles admin update" ON profiles FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Scores: Users can view/edit their own
CREATE POLICY "Scores self access" ON scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Scores self insert" ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Scores self update" ON scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Scores self delete" ON scores FOR DELETE USING (auth.uid() = user_id);

-- Draws: Published draws visible to everyone, Pending draws visible to Admin only
CREATE POLICY "Draws select access" ON draws FOR SELECT USING (status = 'published' OR is_admin(auth.uid()));
CREATE POLICY "Draws admin insert" ON draws FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Draws admin update" ON draws FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Draws admin delete" ON draws FOR DELETE USING (is_admin(auth.uid()));

-- Winners: Self access, Admin access
CREATE POLICY "Winners read access" ON winners FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Winners admin insert" ON winners FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Winners admin update" ON winners FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Winners admin delete" ON winners FOR DELETE USING (is_admin(auth.uid()));