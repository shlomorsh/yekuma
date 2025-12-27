-- Test chapters query directly to see if it works
-- Run this in Supabase SQL Editor

-- Test 1: Check if we can read as anon role
SET ROLE anon;
SELECT COUNT(*) as count FROM chapters;
SELECT * FROM chapters ORDER BY order_index LIMIT 3;
RESET ROLE;

-- Test 2: Check if we can read as authenticated role  
SET ROLE authenticated;
SELECT COUNT(*) as count FROM chapters;
SELECT * FROM chapters ORDER BY order_index LIMIT 3;
RESET ROLE;

-- Test 3: Check current role
SELECT current_user, session_user;

-- Test 4: Try disabling RLS temporarily (just for testing!)
-- ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;
-- SELECT * FROM chapters;
-- ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

