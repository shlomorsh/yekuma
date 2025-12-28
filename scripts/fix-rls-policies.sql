-- Fix RLS policies to allow anonymous read access
-- Run this in Supabase SQL Editor

-- First, disable RLS temporarily to test
-- ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE characters DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE programs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE advertisements DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE concepts DISABLE ROW LEVEL SECURITY;

-- Fix chapters table RLS policy
DROP POLICY IF EXISTS "Allow public read access" ON chapters;
CREATE POLICY "Allow public read access" ON chapters
    FOR SELECT
    USING (true);

-- Fix characters table RLS policy  
DROP POLICY IF EXISTS "Allow public read access" ON characters;
CREATE POLICY "Allow public read access" ON characters
    FOR SELECT
    USING (true);

-- Fix programs table RLS policy
DROP POLICY IF EXISTS "Allow public read access" ON programs;
CREATE POLICY "Allow public read access" ON programs
    FOR SELECT
    USING (true);

-- Fix advertisements table RLS policy
DROP POLICY IF EXISTS "Allow public read access" ON advertisements;
CREATE POLICY "Allow public read access" ON advertisements
    FOR SELECT
    USING (true);

-- Fix concepts table RLS policy
DROP POLICY IF EXISTS "Allow public read access" ON concepts;
CREATE POLICY "Allow public read access" ON concepts
    FOR SELECT
    USING (true);

-- Verify RLS is enabled
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

