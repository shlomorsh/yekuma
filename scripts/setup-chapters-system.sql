-- SQL Script to set up the chapters and reference links system in Supabase
-- Run this in Supabase SQL Editor

-- Step 1: Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Add chapter_id column to references table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'references' 
        AND column_name = 'chapter_id'
    ) THEN
        ALTER TABLE "references" ADD COLUMN chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 3: Create reference_links table (for linking references to other references)
CREATE TABLE IF NOT EXISTS reference_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_reference_id UUID NOT NULL REFERENCES "references"(id) ON DELETE CASCADE,
    target_reference_id UUID NOT NULL REFERENCES "references"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(source_reference_id, target_reference_id),
    CHECK (source_reference_id != target_reference_id)
);

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_references_chapter_id ON "references"(chapter_id);
CREATE INDEX IF NOT EXISTS idx_reference_links_source ON reference_links(source_reference_id);
CREATE INDEX IF NOT EXISTS idx_reference_links_target ON reference_links(target_reference_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters(order_index);

-- Step 5: Enable RLS on chapters table
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for chapters
-- Allow anyone (including anonymous) to read chapters
DROP POLICY IF EXISTS "Allow public read access" ON chapters;
CREATE POLICY "Allow public read access" ON chapters
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert chapters
DROP POLICY IF EXISTS "Allow authenticated insert" ON chapters;
CREATE POLICY "Allow authenticated insert" ON chapters
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update chapters
DROP POLICY IF EXISTS "Allow authenticated update" ON chapters;
CREATE POLICY "Allow authenticated update" ON chapters
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Step 7: Enable RLS on reference_links table
ALTER TABLE reference_links ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for reference_links
-- Allow anyone to read reference links
DROP POLICY IF EXISTS "Allow public read access" ON reference_links;
CREATE POLICY "Allow public read access" ON reference_links
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert reference links
DROP POLICY IF EXISTS "Allow authenticated insert" ON reference_links;
CREATE POLICY "Allow authenticated insert" ON reference_links
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to delete reference links
DROP POLICY IF EXISTS "Allow authenticated delete" ON reference_links;
CREATE POLICY "Allow authenticated delete" ON reference_links
    FOR DELETE
    TO authenticated
    USING (true);

-- Step 9: Create trigger to update updated_at on chapters
CREATE OR REPLACE FUNCTION update_chapters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chapters_updated_at ON chapters;
CREATE TRIGGER update_chapters_updated_at
    BEFORE UPDATE ON chapters
    FOR EACH ROW
    EXECUTE FUNCTION update_chapters_updated_at();

