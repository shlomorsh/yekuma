-- Fix RLS policies for all tables including universe_items
-- Run this in Supabase SQL Editor

-- ============================================
-- Fix characters table RLS policy
-- ============================================
DROP POLICY IF EXISTS "Allow public read access" ON characters;
CREATE POLICY "Allow public read access" ON characters
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON characters;
CREATE POLICY "Allow authenticated insert" ON characters
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON characters;
CREATE POLICY "Allow authenticated update" ON characters
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Fix universe_items table RLS policy
-- ============================================
DROP POLICY IF EXISTS "Allow public read access" ON universe_items;
CREATE POLICY "Allow public read access" ON universe_items
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON universe_items;
CREATE POLICY "Allow authenticated insert" ON universe_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON universe_items;
CREATE POLICY "Allow authenticated update" ON universe_items
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON universe_items;
CREATE POLICY "Allow authenticated delete" ON universe_items
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================
-- Fix chapters table RLS policy
-- ============================================
DROP POLICY IF EXISTS "Allow public read access" ON chapters;
CREATE POLICY "Allow public read access" ON chapters
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON chapters;
CREATE POLICY "Allow authenticated insert" ON chapters
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON chapters;
CREATE POLICY "Allow authenticated update" ON chapters
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Verify RLS is enabled on all tables
-- ============================================
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE universe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Verify policies exist
-- ============================================
SELECT 
    tablename,
    policyname,
    cmd as command
FROM pg_policies
WHERE tablename IN ('characters', 'universe_items', 'chapters')
ORDER BY tablename, policyname;



