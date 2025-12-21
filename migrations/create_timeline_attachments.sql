-- Create timeline_item_attachments table for Google Drive file uploads
CREATE TABLE IF NOT EXISTS timeline_item_attachments (
  id SERIAL PRIMARY KEY,
  timeline_item_id INTEGER NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  google_drive_id VARCHAR(200),
  file_size INTEGER,
  uploaded_by_id INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_timeline_attachments_item ON timeline_item_attachments(timeline_item_id);

-- Enable RLS
ALTER TABLE timeline_item_attachments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all for timeline_item_attachments" ON timeline_item_attachments FOR ALL USING (true);
