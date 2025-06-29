-- =============================================
-- EcoTrack Optimized Database Setup Script
-- Simplified version for better performance
-- =============================================

-- 1. CREATE TABLES (Simplified)
-- =============================================

-- Create profiles table with indexes
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  eco_coins INTEGER DEFAULT 0,
  waste_collected INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_reports INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- fast look-up by username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_eco_coins ON profiles(eco_coins DESC);

-- Create waste_reports table
CREATE TABLE IF NOT EXISTS waste_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('dry-waste', 'e-waste', 'reusable', 'hazardous')),
  image_url TEXT,
  location_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'collected', 'rejected')),
  coins_earned INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for waste reports
CREATE INDEX IF NOT EXISTS idx_waste_reports_user_id ON waste_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_waste_reports_created_at ON waste_reports(created_at DESC);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  coins_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  coins_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

------------------------------------------------------------------
-- Clean-up in case they already exist
------------------------------------------------------------------
DROP TRIGGER  IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

------------------------------------------------------------------
-- Allow a freshly-signed-in user to insert her own profile row
------------------------------------------------------------------
-- (If your script already has this policy you can keep just one copy)
DROP  POLICY IF EXISTS insert_own_profile ON profiles;
CREATE POLICY insert_own_profile
  ON profiles
  FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- 2. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. CREATE SIMPLIFIED POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_policy" ON profiles;
DROP POLICY IF EXISTS "waste_reports_policy" ON waste_reports;
DROP POLICY IF EXISTS "rewards_policy" ON rewards;
DROP POLICY IF EXISTS "achievements_policy" ON achievements;
DROP POLICY IF EXISTS "activity_logs_policy" ON activity_logs;

-- Create simplified policies
CREATE POLICY "profiles_policy" ON profiles USING (true) WITH CHECK (auth.uid() = id);
CREATE POLICY "waste_reports_policy" ON waste_reports USING (true) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rewards_policy" ON rewards FOR SELECT USING (true);
CREATE POLICY "achievements_policy" ON achievements FOR SELECT USING (true);
CREATE POLICY "activity_logs_policy" ON activity_logs USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. CREATE SIMPLIFIED TRIGGER FUNCTION
-- =============================================

-- Simple function to handle new user registration
-- CREATE OR REPLACE FUNCTION handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO profiles (id, email, username, full_name)
--   VALUES (
--     NEW.id,
--     NEW.email,
--     COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
--     COALESCE(NEW.raw_user_meta_data->>'full_name', '')
--   );
--   RETURN NEW;
-- EXCEPTION
--   WHEN OTHERS THEN
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREATE TRIGGER
-- =============================================

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. INSERT SAMPLE DATA
-- =============================================

-- Insert sample rewards
INSERT INTO rewards (title, description, cost, category, image_url, is_available) VALUES
('Coffee Voucher', 'Free coffee', 120, 'Food & Drink', '/placeholder.svg?height=80&width=80', true),
('Movie Discount', '10% off movie ticket', 100, 'Entertainment', '/placeholder.svg?height=80&width=80', true),
('Plant Sapling', 'Free tree sapling', 80, 'Environment', '/placeholder.svg?height=80&width=80', true)
ON CONFLICT DO NOTHING;

-- Insert sample achievements
INSERT INTO achievements (title, description, icon, condition_type, condition_value, coins_reward) VALUES
('First Report', 'Submit your first report', '🌱', 'reports_count', 1, 10),
('Eco Warrior', 'Submit 10 reports', '🏆', 'reports_count', 10, 50),
('Streak Master', '7-day streak', '🔥', 'streak_days', 7, 25)
ON CONFLICT DO NOTHING;

-- =============================================
-- Optimized Setup Complete!
-- =============================================
