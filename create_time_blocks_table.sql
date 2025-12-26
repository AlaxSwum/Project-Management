-- Time Blocks Table for Personal Productivity App
-- Run this SQL in your Supabase SQL Editor

-- Create the time_blocks table
CREATE TABLE IF NOT EXISTS time_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'focus' CHECK (type IN ('focus', 'meeting', 'personal')),
    checklist JSONB DEFAULT '[]'::jsonb,
    meeting_link TEXT,
    notification_time INTEGER DEFAULT 10, -- minutes before
    color VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_id ON time_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_date ON time_blocks(date);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON time_blocks(user_id, date);

-- Enable Row Level Security
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own time blocks
CREATE POLICY "Users can view their own time blocks"
    ON time_blocks
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own time blocks
CREATE POLICY "Users can insert their own time blocks"
    ON time_blocks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own time blocks
CREATE POLICY "Users can update their own time blocks"
    ON time_blocks
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own time blocks
CREATE POLICY "Users can delete their own time blocks"
    ON time_blocks
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_time_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS set_time_blocks_updated_at ON time_blocks;
CREATE TRIGGER set_time_blocks_updated_at
    BEFORE UPDATE ON time_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_time_blocks_updated_at();

-- Grant permissions
GRANT ALL ON time_blocks TO authenticated;
GRANT ALL ON time_blocks TO service_role;

-- Success message
SELECT 'Time blocks table created successfully!' as message;

