-- SQL Script to delete old tables after successful migration
-- ⚠️ WARNING: Only run this AFTER verifying that the migration was successful!
-- ⚠️ Make sure to backup your data before running this script!

-- Step 1: Verify migration was successful
-- Run these queries to confirm data is in universe_items:
/*
SELECT 
    item_type,
    COUNT(*) as count,
    SUM(view_count) as total_views
FROM universe_items
GROUP BY item_type;

SELECT 'programs' as source, COUNT(*) as count FROM programs
UNION ALL
SELECT 'advertisements', COUNT(*) FROM advertisements
UNION ALL
SELECT 'concepts', COUNT(*) FROM concepts
UNION ALL
SELECT 'universe_items TOTAL', COUNT(*) FROM universe_items;
*/

-- Step 2: Delete old reference_connections entries (optional - keep for backward compatibility)
-- Uncomment if you want to clean up the old references:
/*
DELETE FROM reference_connections 
WHERE entity_type IN ('program', 'advertisement', 'concept');
*/

-- Step 3: Delete old edit_history entries (optional - keep for history)
-- Uncomment if you want to clean up:
/*
DELETE FROM edit_history 
WHERE entity_type IN ('program', 'advertisement', 'concept');
*/

-- Step 4: Drop the old tables
-- ⚠️ POINT OF NO RETURN - Make sure you have backups!

DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS advertisements CASCADE;
DROP TABLE IF EXISTS concepts CASCADE;

-- Step 5: Update CHECK constraints to remove old types
-- This ensures the database only accepts 'character' and 'universe_item'

ALTER TABLE reference_connections DROP CONSTRAINT IF EXISTS reference_connections_entity_type_check;
ALTER TABLE reference_connections 
ADD CONSTRAINT reference_connections_entity_type_check 
CHECK (entity_type IN ('character', 'universe_item'));

ALTER TABLE edit_history DROP CONSTRAINT IF EXISTS edit_history_entity_type_check;
ALTER TABLE edit_history 
ADD CONSTRAINT edit_history_entity_type_check 
CHECK (entity_type IN ('character', 'universe_item'));

ALTER TABLE edit_approvals DROP CONSTRAINT IF EXISTS edit_approvals_entity_type_check;
ALTER TABLE edit_approvals 
ADD CONSTRAINT edit_approvals_entity_type_check 
CHECK (entity_type IN ('character', 'universe_item'));

-- Step 6: Update the increment_view_count function to remove old types
CREATE OR REPLACE FUNCTION increment_view_count(entity_type_param TEXT, entity_id_param UUID)
RETURNS void AS $$
BEGIN
    CASE entity_type_param
        WHEN 'character' THEN
            UPDATE characters SET view_count = view_count + 1 WHERE id = entity_id_param;
        WHEN 'universe_item' THEN
            UPDATE universe_items SET view_count = view_count + 1 WHERE id = entity_id_param;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification: List all remaining tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
