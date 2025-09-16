-- Add security columns to content_calendar table
-- This will enable file-level security and folder-based assignment

-- Add security level column
ALTER TABLE content_calendar 
ADD COLUMN IF NOT EXISTS security_level VARCHAR(20) DEFAULT 'public' 
CHECK (security_level IN ('public', 'restricted', 'confidential', 'secret'));

-- Add allowed users column for restricted access
ALTER TABLE content_calendar 
ADD COLUMN IF NOT EXISTS allowed_users INTEGER[] DEFAULT '{}';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_content_calendar_security_level ON content_calendar(security_level);
CREATE INDEX IF NOT EXISTS idx_content_calendar_allowed_users ON content_calendar USING GIN(allowed_users);

-- Update existing records to have default security level
UPDATE content_calendar 
SET security_level = 'public' 
WHERE security_level IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN content_calendar.security_level IS 'Security level: public (everyone), restricted (selected users), confidential (managers+), secret (admins only)';
COMMENT ON COLUMN content_calendar.allowed_users IS 'Array of user IDs who can access this content when security_level is restricted';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'content_calendar' 
AND column_name IN ('security_level', 'allowed_users')
ORDER BY column_name;

-- Success message
SELECT 'Content Calendar security columns added successfully!' as message,
       'security_level and allowed_users columns are now available' as details;
