-- =============================================
-- Fix "Database error saving new user" 
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Remove the problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Ensure users can insert their own profile
DROP POLICY IF EXISTS insert_own_profile ON profiles;
CREATE POLICY insert_own_profile
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. Verify profiles table exists with correct structure
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

-- 4. Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create basic policies for profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- Patch Complete!
-- Now try signing up again - it should work.
-- =============================================
