-- Fix RLS policies for chapters table
-- Run this if chapters are not loading

-- First, check current policies
SELECT * FROM pg_policies WHERE tablename = 'chapters';

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public read access" ON chapters;

-- Create policy that allows both authenticated and anonymous users
CREATE POLICY "Allow public read access" ON chapters
    FOR SELECT
    TO public
    USING (true);

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'chapters';

-- Test query (should work now)
SELECT COUNT(*) FROM chapters;

