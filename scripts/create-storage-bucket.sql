-- =============================================
-- Create Storage Bucket for Profile Images
-- Run this in Supabase SQL Editor
-- =============================================

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create images bucket if it doesn't exist  
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up RLS policies for images bucket
CREATE POLICY "Report images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Users can upload report images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own report images" ON storage.objects
FOR UPDATE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own report images" ON storage.objects
FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
