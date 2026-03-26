-- Migration: Report Attachments (images, videos, files)

CREATE TABLE IF NOT EXISTS org_report_attachments (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES org_employee_reports(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) DEFAULT '',
  file_size INTEGER DEFAULT 0,
  uploaded_by INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_attachments_report ON org_report_attachments(report_id);

-- Supabase Storage bucket for report files
-- Run this in Supabase SQL Editor:
INSERT INTO storage.buckets (id, name, public) VALUES ('report-attachments', 'report-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow uploads/reads from anon key
CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'report-attachments');
CREATE POLICY "Allow public reads" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'report-attachments');
CREATE POLICY "Allow public deletes" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'report-attachments');
