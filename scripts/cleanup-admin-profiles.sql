

-- =============================================
-- Clean up Admin Users from Profiles Table
-- Run this script in Supabase SQL Editor
-- =============================================

-- Remove admin users from profiles table if they exist in admins table
DELETE FROM profiles 
WHERE id IN (SELECT id FROM admins);

-- Drop the trigger first before dropping functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;

-- Now drop the functions
DROP FUNCTION IF EXISTS handle_user_registration();
DROP FUNCTION IF EXISTS handle_admin_registration();
DROP FUNCTION IF EXISTS handle_new_user();

-- Create updated function that checks admins table first
CREATE OR REPLACE FUNCTION handle_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user exists in admins table
  IF EXISTS (SELECT 1 FROM admins WHERE id = NEW.id) THEN
    -- User is an admin, don't create profile
    RETURN NEW;
  END IF;
  
  -- Create regular user profile
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
    RAISE LOG 'Error creating user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_registration();

-- =============================================
-- Cleanup Complete!
-- Now admin signups will only go to admins table
-- =============================================

