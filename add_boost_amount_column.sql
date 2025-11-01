-- Add boost_amount column to content_calendar table
ALTER TABLE content_calendar
ADD COLUMN IF NOT EXISTS boost_amount DECIMAL(10, 2) DEFAULT 0;

-- Add comment
COMMENT ON COLUMN content_calendar.boost_amount IS 'Amount spent on boosting this content';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ boost_amount column added to content_calendar table';
    RAISE NOTICE 'You can now track boost amounts for each content item';
END $$;

