-- =====================================================
-- ADD FACEBOOK URL COLUMN TO COMPANY OUTREACH
-- =====================================================
-- This script adds a facebook_url column to the company_outreach table

-- Add facebook_url column
ALTER TABLE company_outreach 
ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN company_outreach.facebook_url IS 'Facebook page URL for the company';

-- Optional: Add a check constraint to ensure valid URL format
ALTER TABLE company_outreach 
ADD CONSTRAINT facebook_url_format_check 
CHECK (facebook_url IS NULL OR facebook_url ~ '^https?://.*');

SELECT 'Facebook URL column added successfully!' as status;