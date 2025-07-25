
-- =============================================
-- Create Admin Table for EcoTrack
-- Run this script in Supabase SQL Editor
-- =============================================

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admins table
CREATE POLICY "Admins can view own profile" ON admins
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can update own profile" ON admins
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can insert own profile" ON admins
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION handle_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user exists in admins table (manual admin creation)
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

-- Create trigger for user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_registration();

-- =============================================
-- Admin Table Setup Complete!
-- =============================================
