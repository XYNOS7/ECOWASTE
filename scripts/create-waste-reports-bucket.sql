
-- Create storage bucket for waste report images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'waste-reports',
  'waste-reports', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for waste-reports bucket
CREATE POLICY "Users can upload waste report images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'waste-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view waste report images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'waste-reports');

CREATE POLICY "Users can update their own waste report images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'waste-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own waste report images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'waste-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
