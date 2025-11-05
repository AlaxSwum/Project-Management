-- =====================================================
-- FIND YOUR CURRENT SALES/PHARMACY TRACKING TABLES
-- Run this in Supabase SQL Editor to see what exists
-- =====================================================

-- 1. List ALL your public tables
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================

-- 2. Show tables that might contain sales data
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%sales%' OR
    table_name LIKE '%pharmacy%' OR
    table_name LIKE '%daily%' OR
    table_name LIKE '%tracking%' OR
    table_name LIKE '%transaction%' OR
    table_name LIKE '%inventory%' OR
    table_name LIKE '%product%' OR
    table_name LIKE '%service%'
)
ORDER BY table_name;

-- =====================================================

-- 3. If you have a daily_sales or similar table, show its structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'daily_sales'  -- Change this name if different
ORDER BY ordinal_position;

-- =====================================================

-- 4. Show sample data from the table (if it exists)
-- Uncomment the table name you find above
-- SELECT * FROM daily_sales LIMIT 10;
-- SELECT * FROM pharmacy_sales LIMIT 10;
-- SELECT * FROM daily_tracking LIMIT 10;

-- =====================================================

-- 5. If the data is in a different table, check these common names:
-- SELECT * FROM sales LIMIT 5;
-- SELECT * FROM transactions LIMIT 5;
-- SELECT * FROM daily_records LIMIT 5;
-- SELECT * FROM pharmacy_daily LIMIT 5;

-- =====================================================
-- INSTRUCTIONS:
-- 1. Run sections 1 and 2 first to find the table name
-- 2. Once you find it, update section 3 with the correct table name
-- 3. Run section 4 to see sample data
-- 4. Copy the results and show me
-- =====================================================

