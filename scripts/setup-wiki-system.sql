-- SQL Script to set up the Wiki system (Characters, Programs, Ads, Concepts)
-- Run this in Supabase SQL Editor after running setup-chapters-system.sql

-- Step 1: Create characters table
CREATE TABLE IF NOT EXISTS characters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    description TEXT,
    content TEXT, -- Rich content (HTML/Markdown)
    image_url TEXT,
    links JSONB DEFAULT '[]'::jsonb, -- External links
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false
);

-- Step 2: Create programs table
CREATE TABLE IF NOT EXISTS programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    description TEXT,
    content TEXT,
    image_url TEXT,
    links JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false
);

-- Step 3: Create advertisements table
CREATE TABLE IF NOT EXISTS advertisements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    description TEXT,
    content TEXT,
    image_url TEXT,
    links JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false
);

-- Step 4: Create concepts table
CREATE TABLE IF NOT EXISTS concepts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    description TEXT,
    content TEXT,
    image_url TEXT,
    links JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false
);

-- Step 5: Create reference_connections table (links wiki items to references)
CREATE TABLE IF NOT EXISTS reference_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_id UUID NOT NULL REFERENCES "references"(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('character', 'program', 'advertisement', 'concept')),
    entity_id UUID NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(reference_id, entity_type, entity_id)
);

-- Step 6: Create edit_history table (for tracking changes)
CREATE TABLE IF NOT EXISTS edit_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('character', 'program', 'advertisement', 'concept')),
    entity_id UUID NOT NULL,
    content TEXT,
    edited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 7: Create edit_approvals table (for preventing spam)
CREATE TABLE IF NOT EXISTS edit_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('character', 'program', 'advertisement', 'concept')),
    entity_id UUID NOT NULL,
    edit_id UUID REFERENCES edit_history(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(edit_id, approved_by)
);

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_characters_title ON characters(title);
CREATE INDEX IF NOT EXISTS idx_programs_title ON programs(title);
CREATE INDEX IF NOT EXISTS idx_advertisements_title ON advertisements(title);
CREATE INDEX IF NOT EXISTS idx_concepts_title ON concepts(title);
CREATE INDEX IF NOT EXISTS idx_reference_connections_ref ON reference_connections(reference_id);
CREATE INDEX IF NOT EXISTS idx_reference_connections_entity ON reference_connections(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_edit_history_entity ON edit_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_edit_history_created ON edit_history(created_at DESC);

-- Step 9: Enable RLS on all tables
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_approvals ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies for characters
DROP POLICY IF EXISTS "Allow public read access" ON characters;
CREATE POLICY "Allow public read access" ON characters
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON characters;
CREATE POLICY "Allow authenticated insert" ON characters
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON characters;
CREATE POLICY "Allow authenticated update" ON characters
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Step 11: Create RLS policies for programs
DROP POLICY IF EXISTS "Allow public read access" ON programs;
CREATE POLICY "Allow public read access" ON programs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON programs;
CREATE POLICY "Allow authenticated insert" ON programs
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON programs;
CREATE POLICY "Allow authenticated update" ON programs
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Step 12: Create RLS policies for advertisements
DROP POLICY IF EXISTS "Allow public read access" ON advertisements;
CREATE POLICY "Allow public read access" ON advertisements
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON advertisements;
CREATE POLICY "Allow authenticated insert" ON advertisements
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON advertisements;
CREATE POLICY "Allow authenticated update" ON advertisements
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Step 13: Create RLS policies for concepts
DROP POLICY IF EXISTS "Allow public read access" ON concepts;
CREATE POLICY "Allow public read access" ON concepts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON concepts;
CREATE POLICY "Allow authenticated insert" ON concepts
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON concepts;
CREATE POLICY "Allow authenticated update" ON concepts
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Step 14: Create RLS policies for reference_connections
DROP POLICY IF EXISTS "Allow public read access" ON reference_connections;
CREATE POLICY "Allow public read access" ON reference_connections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON reference_connections;
CREATE POLICY "Allow authenticated insert" ON reference_connections
    FOR INSERT TO authenticated WITH CHECK (true);

-- Step 15: Create RLS policies for edit_history
DROP POLICY IF EXISTS "Allow public read access" ON edit_history;
CREATE POLICY "Allow public read access" ON edit_history
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON edit_history;
CREATE POLICY "Allow authenticated insert" ON edit_history
    FOR INSERT TO authenticated WITH CHECK (true);

-- Step 16: Create RLS policies for edit_approvals
DROP POLICY IF EXISTS "Allow public read access" ON edit_approvals;
CREATE POLICY "Allow public read access" ON edit_approvals
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON edit_approvals;
CREATE POLICY "Allow authenticated insert" ON edit_approvals
    FOR INSERT TO authenticated WITH CHECK (true);

-- Step 17: Create triggers to update updated_at
CREATE OR REPLACE FUNCTION update_wiki_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.version = COALESCE(OLD.version, 0) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION update_wiki_updated_at();

DROP TRIGGER IF EXISTS update_programs_updated_at ON programs;
CREATE TRIGGER update_programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW
    EXECUTE FUNCTION update_wiki_updated_at();

DROP TRIGGER IF EXISTS update_advertisements_updated_at ON advertisements;
CREATE TRIGGER update_advertisements_updated_at
    BEFORE UPDATE ON advertisements
    FOR EACH ROW
    EXECUTE FUNCTION update_wiki_updated_at();

DROP TRIGGER IF EXISTS update_concepts_updated_at ON concepts;
CREATE TRIGGER update_concepts_updated_at
    BEFORE UPDATE ON concepts
    FOR EACH ROW
    EXECUTE FUNCTION update_wiki_updated_at();

-- Step 18: Create function to increment view count
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
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 19: Create function to award points for wiki contributions
CREATE OR REPLACE FUNCTION award_wiki_points(user_id_param UUID, points_to_add INTEGER, reason TEXT)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET points = COALESCE(points, 0) + points_to_add,
        updated_at = now()
    WHERE id = user_id_param;
    
    -- Log the points award (optional - can create a points_log table later)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

