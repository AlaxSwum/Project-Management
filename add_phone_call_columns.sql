-- =====================================================
-- ADD PHONE CALL STATUS AND NOTES COLUMNS
-- =====================================================
-- This script adds phone call tracking columns to the company_outreach table

-- Add phone call status column (completed/pending)
ALTER TABLE company_outreach 
ADD COLUMN IF NOT EXISTS phone_call_status VARCHAR(20) DEFAULT 'pending';

-- Add phone call notes column
ALTER TABLE company_outreach 
ADD COLUMN IF NOT EXISTS phone_call_notes TEXT;

-- Add check constraint to ensure valid phone call status values
ALTER TABLE company_outreach 
ADD CONSTRAINT phone_call_status_check 
CHECK (phone_call_status IN ('completed', 'pending'));

-- Update existing records to have default 'pending' status
UPDATE company_outreach 
SET phone_call_status = 'pending' 
WHERE phone_call_status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN company_outreach.phone_call_status IS 'Status of phone call: completed or pending';
COMMENT ON COLUMN company_outreach.phone_call_notes IS 'Notes from phone calls with the company';

SELECT 'Phone call columns added successfully!' as status;