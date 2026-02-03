-- Add Discord ID column to classes_participant table
-- This script adds a new column for storing Discord IDs of class participants

-- Add the discord_id column
ALTER TABLE classes_participant 
ADD COLUMN discord_id VARCHAR(255);

-- Add a comment to the column for documentation
COMMENT ON COLUMN classes_participant.discord_id IS 'Discord ID/username of the participant for communication purposes';

-- Create an index for better performance when searching by Discord ID
CREATE INDEX idx_classes_participant_discord_id 
ON classes_participant(discord_id) 
WHERE discord_id IS NOT NULL;

-- Optional: Add a check constraint to ensure Discord ID format (if needed)
-- ALTER TABLE classes_participant 
-- ADD CONSTRAINT chk_discord_id_format 
-- CHECK (discord_id IS NULL OR length(discord_id) >= 2);

SELECT 'Discord ID column added successfully to classes_participant table!' as message; 