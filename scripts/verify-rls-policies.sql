-- Verify RLS policies for all tables
-- Run this in Supabase SQL Editor to check if policies are correctly set up

-- Check RLS status for all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('characters', 'universe_items', 'chapters', 'programs', 'advertisements', 'concepts')
ORDER BY tablename;

-- Check existing policies for characters table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'characters'
ORDER BY policyname;

-- Check existing policies for universe_items table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'universe_items'
ORDER BY policyname;

-- Check existing policies for chapters table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'chapters'
ORDER BY policyname;

-- Test query to verify public read access (should return data if RLS is correct)
-- Uncomment to test:
-- SELECT COUNT(*) as character_count FROM characters;
-- SELECT COUNT(*) as universe_items_count FROM universe_items;
-- SELECT COUNT(*) as chapters_count FROM chapters;




