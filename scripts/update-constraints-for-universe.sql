-- Update CHECK constraints to support the new universe_items table
-- Run this in Supabase SQL Editor AFTER running migrate-data-to-universe.sql

-- Step 1: Update reference_connections CHECK constraint
-- Drop the old constraint
ALTER TABLE reference_connections DROP CONSTRAINT IF EXISTS reference_connections_entity_type_check;

-- Add new constraint that includes 'universe_item'
ALTER TABLE reference_connections 
ADD CONSTRAINT reference_connections_entity_type_check 
CHECK (entity_type IN ('character', 'program', 'advertisement', 'concept', 'universe_item'));

-- Step 2: Update edit_history CHECK constraint
-- Drop the old constraint
ALTER TABLE edit_history DROP CONSTRAINT IF EXISTS edit_history_entity_type_check;

-- Add new constraint that includes 'universe_item'
ALTER TABLE edit_history 
ADD CONSTRAINT edit_history_entity_type_check 
CHECK (entity_type IN ('character', 'program', 'advertisement', 'concept', 'universe_item'));

-- Step 3: Update edit_approvals CHECK constraint
-- Drop the old constraint
ALTER TABLE edit_approvals DROP CONSTRAINT IF EXISTS edit_approvals_entity_type_check;

-- Add new constraint that includes 'universe_item'
ALTER TABLE edit_approvals 
ADD CONSTRAINT edit_approvals_entity_type_check 
CHECK (entity_type IN ('character', 'program', 'advertisement', 'concept', 'universe_item'));

-- Step 4: Verify constraints
SELECT 
    constraint_name, 
    table_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%entity_type_check'
ORDER BY table_name;
