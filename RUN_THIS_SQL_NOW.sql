-- ⚡ QUICK SQL - Copy and run this in Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor → New Query → Paste → Run

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'content_calendar' 
        AND column_name = 'is_completed'
    ) THEN
        ALTER TABLE content_calendar ADD COLUMN is_completed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✓ Added is_completed column';
    ELSE
        RAISE NOTICE 'Column already exists - OK!';
    END IF;
END $$;

UPDATE content_calendar SET is_completed = FALSE WHERE is_completed IS NULL;

SELECT '✅ DONE! Ready to deploy frontend.' as message;

