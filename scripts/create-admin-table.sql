
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

-- Create function to handle admin registration
CREATE OR REPLACE FUNCTION handle_admin_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create admin profile if user_type is 'admin' in metadata
  IF NEW.raw_user_meta_data->>'user_type' = 'admin' THEN
    INSERT INTO admins (id, email, username, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating admin profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for admin registration
DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
CREATE TRIGGER on_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_admin_registration();

-- =============================================
-- Admin Table Setup Complete!
-- =============================================
