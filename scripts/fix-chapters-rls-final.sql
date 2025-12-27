-- Final fix for chapters RLS policy
-- The issue: {public} role doesn't include Supabase's anon role

-- Drop the existing policy
DROP POLICY IF EXISTS "Allow public read access" ON chapters;

-- Create new policy that explicitly allows anon and authenticated users
CREATE POLICY "Allow public read access" ON chapters
    FOR SELECT
    TO anon, authenticated, public
    USING (true);

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

