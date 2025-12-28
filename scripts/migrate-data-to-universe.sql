-- SQL Script to migrate data from programs, advertisements, and concepts tables to universe_items
-- Run this in Supabase SQL Editor AFTER running create-universe-table.sql
-- This script preserves all existing data and metadata

-- Step 1: Migrate data from programs table
INSERT INTO universe_items (
    id,
    title,
    description,
    content,
    image_url,
    item_type,
    links,
    created_by,
    updated_by,
    created_at,
    updated_at,
    version,
    view_count,
    verified
)
SELECT 
    id,
    title,
    description,
    content,
    image_url,
    'program' as item_type,
    links,
    created_by,
    updated_by,
    created_at,
    updated_at,
    version,
    view_count,
    verified
FROM programs
ON CONFLICT (title) DO NOTHING;

-- Step 2: Migrate data from advertisements table
INSERT INTO universe_items (
    id,
    title,
    description,
    content,
    image_url,
    item_type,
    links,
    created_by,
    updated_by,
    created_at,
    updated_at,
    version,
    view_count,
    verified
)
SELECT 
    id,
    title,
    description,
    content,
    image_url,
    'advertisement' as item_type,
    links,
    created_by,
    updated_by,
    created_at,
    updated_at,
    version,
    view_count,
    verified
FROM advertisements
ON CONFLICT (title) DO NOTHING;

-- Step 3: Migrate data from concepts table
INSERT INTO universe_items (
    id,
    title,
    description,
    content,
    image_url,
    item_type,
    links,
    created_by,
    updated_by,
    created_at,
    updated_at,
    version,
    view_count,
    verified
)
SELECT 
    id,
    title,
    description,
    content,
    image_url,
    'concept' as item_type,
    links,
    created_by,
    updated_by,
    created_at,
    updated_at,
    version,
    view_count,
    verified
FROM concepts
ON CONFLICT (title) DO NOTHING;

-- Step 4: Verify the migration
-- This will show you the count of items by type
SELECT 
    item_type,
    COUNT(*) as count,
    SUM(view_count) as total_views,
    COUNT(*) FILTER (WHERE verified = true) as verified_count
FROM universe_items
GROUP BY item_type
ORDER BY item_type;

-- Step 5: Compare with original tables
-- Uncomment to verify the counts match
/*
SELECT 'programs' as table_name, COUNT(*) as count FROM programs
UNION ALL
SELECT 'advertisements', COUNT(*) FROM advertisements
UNION ALL
SELECT 'concepts', COUNT(*) FROM concepts
UNION ALL
SELECT 'universe_items', COUNT(*) FROM universe_items;
*/

-- Step 6: Update reference_connections to point to universe_items
-- This preserves the connections between references and universe items
-- Note: We're adding new records, not replacing old ones (for safety)
INSERT INTO reference_connections (
    reference_id,
    entity_type,
    entity_id,
    created_by,
    created_at
)
SELECT 
    rc.reference_id,
    'universe_item' as entity_type,
    rc.entity_id,
    rc.created_by,
    rc.created_at
FROM reference_connections rc
WHERE rc.entity_type IN ('program', 'advertisement', 'concept')
ON CONFLICT (reference_id, entity_type, entity_id) DO NOTHING;

-- Step 7: Update edit_history for universe items
INSERT INTO edit_history (
    entity_type,
    entity_id,
    content,
    edited_by,
    created_at
)
SELECT 
    'universe_item' as entity_type,
    eh.entity_id,
    eh.content,
    eh.edited_by,
    eh.created_at
FROM edit_history eh
WHERE eh.entity_type IN ('program', 'advertisement', 'concept')
ON CONFLICT DO NOTHING;
