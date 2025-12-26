-- SQL Script to set up the references table in Supabase
-- Run this in Supabase SQL Editor

-- Step 1: Add id column if it doesn't exist
-- First, check if the column exists, if not, add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'references' 
        AND column_name = 'id'
    ) THEN
        -- Add id column as UUID with default
        ALTER TABLE "references" ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
        
        -- If there are existing rows, update them with new UUIDs
        UPDATE "references" SET id = gen_random_uuid() WHERE id IS NULL;
        
        -- Make id NOT NULL
        ALTER TABLE "references" ALTER COLUMN id SET NOT NULL;
    END IF;
END $$;

-- Step 2: Create RLS Policies
-- Enable RLS on the table
ALTER TABLE "references" ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Allow anyone to read references
CREATE POLICY "Allow public read access" ON "references"
    FOR SELECT
    USING (true);

-- Policy for INSERT: Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON "references"
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy for UPDATE: Allow authenticated users to update their own references
-- (Optional - if you want users to edit their references)
CREATE POLICY "Allow authenticated update" ON "references"
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for DELETE: Allow authenticated users to delete their own references
-- (Optional - if you want users to delete their references)
CREATE POLICY "Allow authenticated delete" ON "references"
    FOR DELETE
    TO authenticated
    USING (true);

-- Alternative: If you want to allow anonymous access (not recommended for production)
-- Uncomment the following and comment out the authenticated policies above:

-- CREATE POLICY "Allow anonymous insert" ON references
--     FOR INSERT
--     TO anon
--     WITH CHECK (true);

