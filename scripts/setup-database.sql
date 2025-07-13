-- =============================================
-- EcoTrack Database Setup Script
-- Run this entire script in Supabase SQL Editor
-- =============================================

-- 1. CREATE TABLES
-- =============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
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

-- Create waste_reports table
CREATE TABLE IF NOT EXISTS waste_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('dry-waste', 'e-waste', 'reusable', 'hazardous')),
  image_url TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'collected', 'rejected')),
  ai_detected_category TEXT,
  coins_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dirty_area_reports table
CREATE TABLE IF NOT EXISTS dirty_area_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'in-progress', 'cleaned', 'rejected')),
  coins_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  description TEXT,
  cost INTEGER NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT -1, -- -1 means unlimited
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_rewards table (for redeemed rewards)
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'redeemed' CHECK (status IN ('redeemed', 'used', 'expired')),
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('reports_count', 'streak_days', 'coins_earned', 'waste_collected')),
  condition_value INTEGER NOT NULL,
  coins_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
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

-- 2. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dirty_area_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. CREATE RLS POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles for leaderboard" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view all profiles for leaderboard" ON profiles
  FOR SELECT USING (true);

-- Drop existing waste report policies
DROP POLICY IF EXISTS "Users can view all waste reports" ON waste_reports;
DROP POLICY IF EXISTS "Users can create own waste reports" ON waste_reports;
DROP POLICY IF EXISTS "Users can update own waste reports" ON waste_reports;

-- Waste reports policies
CREATE POLICY "Users can view all waste reports" ON waste_reports
  FOR SELECT USING (true);

CREATE POLICY "Users can create own waste reports" ON waste_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own waste reports" ON waste_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Drop existing dirty area report policies
DROP POLICY IF EXISTS "Users can view all dirty area reports" ON dirty_area_reports;
DROP POLICY IF EXISTS "Users can create own dirty area reports" ON dirty_area_reports;
DROP POLICY IF EXISTS "Users can update own dirty area reports" ON dirty_area_reports;

-- Dirty area reports policies
CREATE POLICY "Users can view all dirty area reports" ON dirty_area_reports
  FOR SELECT USING (true);

CREATE POLICY "Users can create own dirty area reports" ON dirty_area_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dirty area reports" ON dirty_area_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Drop existing reward policies
DROP POLICY IF EXISTS "Anyone can view rewards" ON rewards;

-- Rewards policies
CREATE POLICY "Anyone can view rewards" ON rewards
  FOR SELECT USING (true);

-- Drop existing user reward policies
DROP POLICY IF EXISTS "Users can view own redeemed rewards" ON user_rewards;
DROP POLICY IF EXISTS "Users can redeem rewards" ON user_rewards;

-- User rewards policies
CREATE POLICY "Users can view own redeemed rewards" ON user_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem rewards" ON user_rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Drop existing achievement policies
DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;

-- Achievements policies
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

-- Drop existing user achievement policies
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can earn achievements" ON user_achievements;

-- User achievements policies
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can earn achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Drop existing activity log policies
DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can create own activity logs" ON activity_logs;

-- Activity logs policies
CREATE POLICY "Users can view own activity logs" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity logs" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. CREATE FUNCTIONS
-- =============================================

-- Function to handle new user registration (simplified)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username, full_name, eco_coins, waste_collected, streak, level, total_reports)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    0,
    0,
    0,
    1,
    0
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_user_achievements(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  achievement_record RECORD;
  user_profile RECORD;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = user_uuid;
  
  -- Check each achievement
  FOR achievement_record IN 
    SELECT a.* FROM achievements a
    WHERE a.id NOT IN (
      SELECT ua.achievement_id FROM user_achievements ua WHERE ua.user_id = user_uuid
    )
  LOOP
    -- Check if user meets the achievement condition
    CASE achievement_record.condition_type
      WHEN 'reports_count' THEN
        IF user_profile.total_reports >= achievement_record.condition_value THEN
          PERFORM award_achievement(user_uuid, achievement_record.id, achievement_record.coins_reward);
        END IF;
      WHEN 'streak_days' THEN
        IF user_profile.streak >= achievement_record.condition_value THEN
          PERFORM award_achievement(user_uuid, achievement_record.id, achievement_record.coins_reward);
        END IF;
      WHEN 'coins_earned' THEN
        IF user_profile.eco_coins >= achievement_record.condition_value THEN
          PERFORM award_achievement(user_uuid, achievement_record.id, achievement_record.coins_reward);
        END IF;
      WHEN 'waste_collected' THEN
        IF user_profile.waste_collected >= achievement_record.condition_value THEN
          PERFORM award_achievement(user_uuid, achievement_record.id, achievement_record.coins_reward);
        END IF;
    END CASE;
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error checking achievements for user %: %', user_uuid, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to award achievement
CREATE OR REPLACE FUNCTION award_achievement(user_uuid UUID, achievement_uuid UUID, coins_reward INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Insert user achievement
  INSERT INTO user_achievements (user_id, achievement_id)
  VALUES (user_uuid, achievement_uuid);
  
  -- Award coins
  UPDATE profiles 
  SET eco_coins = eco_coins + coins_reward
  WHERE id = user_uuid;
  
  -- Log activity
  INSERT INTO activity_logs (user_id, activity_type, title, description, coins_earned)
  SELECT 
    user_uuid,
    'achievement',
    'Achievement Unlocked: ' || a.title,
    a.description,
    coins_reward
  FROM achievements a WHERE a.id = achievement_uuid;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error awarding achievement % to user %: %', achievement_uuid, user_uuid, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to redeem reward
CREATE OR REPLACE FUNCTION redeem_reward(user_uuid UUID, reward_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  reward_cost INTEGER;
  user_coins INTEGER;
BEGIN
  -- Get reward cost and user coins
  SELECT cost INTO reward_cost FROM rewards WHERE id = reward_uuid AND is_available = true;
  SELECT eco_coins INTO user_coins FROM profiles WHERE id = user_uuid;
  
  -- Check if user has enough coins
  IF user_coins >= reward_cost THEN
    -- Deduct coins
    UPDATE profiles SET eco_coins = eco_coins - reward_cost WHERE id = user_uuid;
    
    -- Add to user rewards
    INSERT INTO user_rewards (user_id, reward_id) VALUES (user_uuid, reward_uuid);
    
    -- Log activity
    INSERT INTO activity_logs (user_id, activity_type, title, description, coins_earned)
    SELECT 
      user_uuid,
      'reward_redeemed',
      'Reward Redeemed: ' || r.title,
      r.description,
      -reward_cost
    FROM rewards r WHERE r.id = reward_uuid;
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error redeeming reward % for user %: %', reward_uuid, user_uuid, SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats after report submission
CREATE OR REPLACE FUNCTION update_user_stats_after_report()
RETURNS TRIGGER AS $$
DECLARE
  coins_to_award INTEGER;
  waste_amount INTEGER;
BEGIN
  -- Determine coins based on report type and category
  IF TG_TABLE_NAME = 'waste_reports' THEN
    CASE NEW.category
      WHEN 'e-waste' THEN coins_to_award := 20;
      WHEN 'hazardous' THEN coins_to_award := 25;
      ELSE coins_to_award := 15;
    END CASE;
    waste_amount := 5; -- Default waste amount in kg
  ELSE
    coins_to_award := 10; -- Dirty area reports
    waste_amount := 0;
  END IF;

  -- Update user profile
  UPDATE profiles 
  SET 
    eco_coins = eco_coins + coins_to_award,
    total_reports = total_reports + 1,
    waste_collected = waste_collected + waste_amount,
    updated_at = NOW()
  WHERE id = NEW.user_id;

  -- Update the report with coins earned
  IF TG_TABLE_NAME = 'waste_reports' THEN
    UPDATE waste_reports SET coins_earned = coins_to_award WHERE id = NEW.id;
  ELSE
    UPDATE dirty_area_reports SET coins_earned = coins_to_award WHERE id = NEW.id;
  END IF;

  -- Log the activity
  INSERT INTO activity_logs (user_id, activity_type, title, description, coins_earned)
  VALUES (
    NEW.user_id,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_TABLE_NAME = 'waste_reports' THEN 'Waste Report Submitted'
      ELSE 'Dirty Area Reported'
    END,
    NEW.title,
    coins_to_award
  );

  -- Check for achievements
  PERFORM check_user_achievements(NEW.user_id);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error updating user stats after report: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. CREATE TRIGGERS
-- =============================================

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers for updating user stats
DROP TRIGGER IF EXISTS update_stats_after_waste_report ON waste_reports;
CREATE TRIGGER update_stats_after_waste_report
  AFTER INSERT ON waste_reports
  FOR EACH ROW EXECUTE FUNCTION update_user_stats_after_report();

DROP TRIGGER IF EXISTS update_stats_after_dirty_report ON dirty_area_reports;
CREATE TRIGGER update_stats_after_dirty_report
  AFTER INSERT ON dirty_area_reports
  FOR EACH ROW EXECUTE FUNCTION update_user_stats_after_report();

-- 6. SEED DATA
-- =============================================

-- Insert sample rewards
INSERT INTO rewards (title, description, cost, category, image_url, is_available) VALUES
('Coffee Shop Voucher', 'Free coffee with any purchase', 120, 'Food & Drink', '/placeholder.svg?height=80&width=80', true),
('Movie Ticket Discount', '10% off on any movie ticket', 100, 'Entertainment', '/placeholder.svg?height=80&width=80', true),
('Zomato Voucher', '₹50 off on orders above ₹200', 200, 'Food & Drink', '/placeholder.svg?height=80&width=80', true),
('Amazon Gift Card', '5% off on any purchase', 300, 'Shopping', '/placeholder.svg?height=80&width=80', true),
('Plant Sapling', 'Free tree sapling for planting', 80, 'Environment', '/placeholder.svg?height=80&width=80', true),
('Eco-friendly Bag', 'Reusable shopping bag', 150, 'Environment', '/placeholder.svg?height=80&width=80', true)
ON CONFLICT DO NOTHING;

-- Insert sample achievements
INSERT INTO achievements (title, description, icon, condition_type, condition_value, coins_reward) VALUES
('First Report', 'Submit your first waste report', '🌱', 'reports_count', 1, 10),
('Eco Warrior', 'Submit 10 waste reports', '🏆', 'reports_count', 10, 50),
('Streak Master', 'Maintain a 7-day streak', '🔥', 'streak_days', 7, 25),
('Coin Collector', 'Earn 500 EcoCoins', '💰', 'coins_earned', 500, 100),
('Waste Warrior', 'Collect 100kg of waste', '♻️', 'waste_collected', 100, 75),
('Super Reporter', 'Submit 25 reports', '⚡', 'reports_count', 25, 100)
ON CONFLICT DO NOTHING;

-- =============================================
-- Setup Complete!
-- =============================================
