-- ==========================================
-- Migration: Secure ID Scans RLS Storage Policies
-- ==========================================

-- Ensure storage bucket 'id-documents' exists and is private
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 1. Allow authenticated landlords to upload their own ID scans
DROP POLICY IF EXISTS "Allow landlords to upload own ID" ON storage.objects;
CREATE POLICY "Allow landlords to upload own ID"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'id-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Restrict viewing access to the document owner or admin roles
DROP POLICY IF EXISTS "Allow owners and admins to view ID" ON storage.objects;
CREATE POLICY "Allow owners and admins to view ID"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (auth.jwt() ->> 'role') = 'admin'
  )
);
