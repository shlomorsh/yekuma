-- Final fix for chapters RLS policy
-- The issue: {public} role doesn't include Supabase's anon role

-- Step 1: Drop ALL existing policies on chapters
DROP POLICY IF EXISTS "Allow public read access" ON chapters;
DROP POLICY IF EXISTS "Allow authenticated insert" ON chapters;
DROP POLICY IF EXISTS "Allow authenticated update" ON chapters;

-- Step 2: Temporarily disable RLS to test
-- ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies that work with Supabase
-- Allow SELECT for everyone (anon, authenticated, public)
CREATE POLICY "Allow public read access" ON chapters
    FOR SELECT
    USING (true);

-- Allow INSERT for authenticated users
CREATE POLICY "Allow authenticated insert" ON chapters
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow UPDATE for authenticated users
CREATE POLICY "Allow authenticated update" ON chapters
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verify it was created correctly
SELECT 
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'chapters';

-- Test the query (should work now)
SELECT COUNT(*) FROM chapters;
SELECT * FROM chapters ORDER BY order_index LIMIT 3;

