-- Migration to add visit images feature
-- Run this in your Supabase SQL Editor

-- 1. Add images column to visits table
ALTER TABLE visits ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- 2. Storage bucket 'visit-images' already created manually ✅

-- 3. Storage RLS policies for visit-images bucket
-- Enable RLS on the storage.objects table for visit-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('visit-images', 'visit-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy to allow authenticated users to upload images to their own doctor folder
CREATE POLICY "Users can upload visit images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'visit-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow public access to visit images (since bucket is public)
CREATE POLICY "Public access to visit images" ON storage.objects
FOR SELECT USING (bucket_id = 'visit-images');

-- Policy to allow authenticated users to view their own visit images
CREATE POLICY "Users can view own visit images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'visit-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow authenticated users to delete their own visit images
CREATE POLICY "Users can delete own visit images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'visit-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Comment explaining the images JSONB structure
COMMENT ON COLUMN visits.images IS 'Array of image objects: [{"url": "storage_path", "filename": "original_name", "uploaded_at": "timestamp"}]';
