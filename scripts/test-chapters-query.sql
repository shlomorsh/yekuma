-- Test query to check if chapters can be read
-- Run this in Supabase SQL Editor to test

-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'chapters'
);

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'chapters';

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'chapters';

-- Try to select chapters (should work if RLS is correct)
SELECT * FROM chapters ORDER BY order_index;

-- Check if there are any rows
SELECT COUNT(*) FROM chapters;

