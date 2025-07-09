
-- =============================================
-- Add Admin Support to EcoTrack Database
-- Run this script in Supabase SQL Editor
-- =============================================

-- Add user_type column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user' CHECK (user_type IN ('user', 'admin'));

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- Update the handle_new_user function to support admin registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type_value TEXT DEFAULT 'user';
BEGIN
  -- Check if this is an admin signup (you can customize this logic)
  IF NEW.raw_user_meta_data->>'user_type' = 'admin' THEN
    user_type_value := 'admin';
  END IF;

  INSERT INTO profiles (id, email, username, full_name, eco_coins, waste_collected, streak, level, total_reports, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    0,
    0,
    0,
    1,
    0,
    user_type_value
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Admin Support Setup Complete!
-- =============================================

-- To create an admin user, you can either:
-- 1. Register normally and then run: UPDATE profiles SET user_type = 'admin' WHERE email = 'admin@example.com';
-- 2. Or modify the signup process to pass user_type in metadata
