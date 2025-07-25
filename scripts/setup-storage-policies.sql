
-- Setup storage policies for pickup agents to upload collection photos

-- First, create the collection-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'collection-photos',
  'collection-photos', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to the collection-photos bucket
CREATE POLICY "Allow public uploads to collection-photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'collection-photos');

-- Allow public access to collection photos
CREATE POLICY "Allow public access to collection-photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'collection-photos');

-- Also ensure the images bucket exists with public access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to the images bucket (fallback)
CREATE POLICY "Allow public uploads to images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'images');

-- Allow public access to images
CREATE POLICY "Allow public access to images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'images');
