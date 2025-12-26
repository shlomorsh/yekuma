-- SQL Script to set up the reputation system tables and functions in Supabase
-- Run this in Supabase SQL Editor

-- Step 1: Ensure references table has required columns
DO $$ 
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'references' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE "references" ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- Add verified column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'references' 
        AND column_name = 'verified'
    ) THEN
        ALTER TABLE "references" ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;

    -- Add verification_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'references' 
        AND column_name = 'verification_count'
    ) THEN
        ALTER TABLE "references" ADD COLUMN verification_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Step 2: Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2b: Add foreign key constraint from references.user_id to profiles.id
-- This allows Supabase to use the join syntax, but we'll use manual queries instead
-- Keeping this commented out as it's optional and may cause issues with existing data
-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (
--         SELECT 1 
--         FROM information_schema.table_constraints 
--         WHERE table_schema = 'public' AND table_name = 'references' 
--         AND constraint_name = 'references_user_id_profiles_fkey'
--     ) THEN
--         ALTER TABLE "references" 
--         ADD CONSTRAINT references_user_id_profiles_fkey 
--         FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
--     END IF;
-- END $$;

-- Step 3: Create verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_id UUID NOT NULL REFERENCES "references"(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(reference_id, user_id)
);

-- Step 4: Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for profiles
-- Allow anyone to read profiles
DROP POLICY IF EXISTS "Allow public read access" ON profiles;
CREATE POLICY "Allow public read access" ON profiles
    FOR SELECT
    USING (true);

-- Allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
CREATE POLICY "Allow users to update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
CREATE POLICY "Allow users to insert own profile" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Step 6: Enable RLS on verifications table
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for verifications
-- Allow anyone to read verifications
DROP POLICY IF EXISTS "Allow public read access" ON verifications;
CREATE POLICY "Allow public read access" ON verifications
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert verifications
DROP POLICY IF EXISTS "Allow authenticated insert" ON verifications;
CREATE POLICY "Allow authenticated insert" ON verifications
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Step 8: Create function to increment points (optional, for better performance)
CREATE OR REPLACE FUNCTION increment_points(user_id_param UUID, points_to_add INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET points = COALESCE(points, 0) + points_to_add,
        updated_at = now()
    WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create index on verifications for better performance
CREATE INDEX IF NOT EXISTS idx_verifications_reference_id ON verifications(reference_id);
CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_references_user_id ON "references"(user_id);
CREATE INDEX IF NOT EXISTS idx_references_timestamp ON "references"(timestamp);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points DESC);

-- Step 10: Create trigger to update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

