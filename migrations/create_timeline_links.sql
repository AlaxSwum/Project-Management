-- Create timeline_item_links table for resource links
CREATE TABLE IF NOT EXISTS timeline_item_links (
  id SERIAL PRIMARY KEY,
  timeline_item_id INTEGER NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  url TEXT NOT NULL,
  link_type VARCHAR(50) DEFAULT 'other', -- drive, document, design, video, other
  created_by_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_timeline_links_item ON timeline_item_links(timeline_item_id);

-- Enable RLS
ALTER TABLE timeline_item_links ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'timeline_item_links' AND policyname = 'Allow all for timeline_item_links'
  ) THEN
    CREATE POLICY "Allow all for timeline_item_links" ON timeline_item_links FOR ALL USING (true);
  END IF;
END $$;
