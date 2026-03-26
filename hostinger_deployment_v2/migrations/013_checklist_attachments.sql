-- Migration: Checklist Attachments
-- Allows staff to upload files/images to checklist items before completing them

CREATE TABLE IF NOT EXISTS org_checklist_attachments (
  id SERIAL PRIMARY KEY,
  checklist_id INTEGER NOT NULL REFERENCES org_checklists(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) DEFAULT '',
  file_size INTEGER DEFAULT 0,
  uploaded_by INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_attachments_checklist ON org_checklist_attachments(checklist_id);

-- Storage bucket (run in Supabase dashboard or via API):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('checklist-attachments', 'checklist-attachments', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies (public read, authenticated upload/delete):
-- CREATE POLICY "Public read checklist attachments" ON storage.objects FOR SELECT USING (bucket_id = 'checklist-attachments');
-- CREATE POLICY "Auth upload checklist attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'checklist-attachments');
-- CREATE POLICY "Auth delete checklist attachments" ON storage.objects FOR DELETE USING (bucket_id = 'checklist-attachments');
