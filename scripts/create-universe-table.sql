-- SQL Script to create the unified universe_items table
-- This replaces the separate programs, advertisements, and concepts tables
-- Run this in Supabase SQL Editor

-- Step 1: Create universe_items table
CREATE TABLE IF NOT EXISTS universe_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    description TEXT,
    content TEXT, -- Rich content (HTML/Markdown)
    image_url TEXT,
    item_type TEXT NOT NULL CHECK (item_type IN ('program', 'advertisement', 'concept')),
    links JSONB DEFAULT '[]'::jsonb, -- External links
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_universe_items_title ON universe_items(title);
CREATE INDEX IF NOT EXISTS idx_universe_items_type ON universe_items(item_type);
CREATE INDEX IF NOT EXISTS idx_universe_items_created ON universe_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_universe_items_view_count ON universe_items(view_count DESC);

-- Step 3: Enable RLS
ALTER TABLE universe_items ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
DROP POLICY IF EXISTS "Allow public read access" ON universe_items;
CREATE POLICY "Allow public read access" ON universe_items
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON universe_items;
CREATE POLICY "Allow authenticated insert" ON universe_items
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON universe_items;
CREATE POLICY "Allow authenticated update" ON universe_items
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete" ON universe_items;
CREATE POLICY "Allow authenticated delete" ON universe_items
    FOR DELETE TO authenticated USING (true);

-- Step 5: Create trigger to update updated_at and version
CREATE OR REPLACE FUNCTION update_universe_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.version = COALESCE(OLD.version, 0) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_universe_items_updated_at ON universe_items;
CREATE TRIGGER update_universe_items_updated_at
    BEFORE UPDATE ON universe_items
    FOR EACH ROW
    EXECUTE FUNCTION update_universe_items_updated_at();

-- Step 6: Update increment_view_count function to support universe_items
CREATE OR REPLACE FUNCTION increment_view_count(entity_type_param TEXT, entity_id_param UUID)
RETURNS void AS $$
BEGIN
    CASE entity_type_param
        WHEN 'character' THEN
            UPDATE characters SET view_count = view_count + 1 WHERE id = entity_id_param;
        WHEN 'program' THEN
            UPDATE programs SET view_count = view_count + 1 WHERE id = entity_id_param;
        WHEN 'advertisement' THEN
            UPDATE advertisements SET view_count = view_count + 1 WHERE id = entity_id_param;
        WHEN 'concept' THEN
            UPDATE concepts SET view_count = view_count + 1 WHERE id = entity_id_param;
        WHEN 'universe_item' THEN
            UPDATE universe_items SET view_count = view_count + 1 WHERE id = entity_id_param;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
