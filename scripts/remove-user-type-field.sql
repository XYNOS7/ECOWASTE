
-- =============================================
-- Remove user_type field from profiles table
-- Run this script in Supabase SQL Editor
-- =============================================

-- Remove user_type column from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS user_type;

-- Drop the index if it exists
DROP INDEX IF EXISTS idx_profiles_user_type;

-- Update the handle_new_user function to only create regular user profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create regular user profile (admins are handled separately)
  IF COALESCE(NEW.raw_user_meta_data->>'user_type', 'user') = 'user' THEN
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
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger for regular user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- Cleanup Complete!
-- =============================================
