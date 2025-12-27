-- Check RLS policy for chapters table
-- Run this to see what's wrong

-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'chapters';

-- 2. Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'chapters';

-- 3. Test query as anonymous user (simulate what the app does)
SET ROLE anon;
SELECT * FROM chapters ORDER BY order_index LIMIT 5;
RESET ROLE;

-- 4. If the above fails, try this fix:
-- DROP POLICY IF EXISTS "Allow public read access" ON chapters;
-- CREATE POLICY "Allow public read access" ON chapters
--     FOR SELECT
--     TO public, anon, authenticated
--     USING (true);

