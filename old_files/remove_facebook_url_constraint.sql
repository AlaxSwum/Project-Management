-- =====================================================
-- REMOVE FACEBOOK URL FORMAT CHECK CONSTRAINT
-- =====================================================
-- This script removes the facebook_url_format_check constraint
-- to allow companies to be created without Facebook URLs
-- =====================================================

-- Remove the Facebook URL format check constraint
ALTER TABLE company_outreach 
DROP CONSTRAINT IF EXISTS facebook_url_format_check;

-- Verify the constraint has been removed
SELECT 
    tc.constraint_name,
    tc.table_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'company_outreach' 
    AND tc.constraint_name = 'facebook_url_format_check';

SELECT 'Facebook URL format check constraint removed successfully!' as status;
