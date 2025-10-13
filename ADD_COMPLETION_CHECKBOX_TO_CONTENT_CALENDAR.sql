-- =====================================================
-- ADD COMPLETION CHECKBOX TO CONTENT CALENDAR
-- =====================================================
-- This adds an 'is_completed' column to track content completion status

-- Check if column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'content_calendar' 
        AND column_name = 'is_completed'
    ) THEN
        -- Add is_completed column to content_calendar table
        ALTER TABLE content_calendar 
        ADD COLUMN is_completed BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE '✓ Added is_completed column to content_calendar table';
    ELSE
        RAISE NOTICE 'is_completed column already exists';
    END IF;
END $$;

-- Set all existing items to not completed by default
UPDATE content_calendar 
SET is_completed = FALSE 
WHERE is_completed IS NULL;

-- Show the updated table structure
SELECT 
    'Content Calendar Columns After Update:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'content_calendar'
ORDER BY ordinal_position;

-- Success message
SELECT '
✅ COMPLETION CHECKBOX FEATURE ADDED!

New Column:
- is_completed (BOOLEAN) - Default: FALSE

This allows you to:
1. Mark content items as completed with a checkbox
2. See completed items highlighted in green
3. Track completion status across sessions

The column has been added to the database.
Now update your frontend component to use this field.
' as message;

