-- TEMPORARY FIX: Disable RLS to test if that's the issue
-- WARNING: Only use this for testing! Re-enable RLS after.

-- Disable RLS temporarily
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT * FROM chapters ORDER BY order_index;

-- If this works, the problem is with RLS policies
-- Re-enable RLS and fix the policies:
-- ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
-- Then run fix-chapters-rls-final.sql

