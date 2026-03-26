-- Migration: Add schedule fields to org_checklists
-- Allows setting specific reset time, day of week (for weekly), and day of month (for monthly)

-- Reset time (HH:MM format, 24-hour). Defaults to midnight for existing rows.
ALTER TABLE org_checklists ADD COLUMN IF NOT EXISTS reset_time VARCHAR(5) DEFAULT '00:00';

-- Day of week for weekly checklists: 0=Sunday, 1=Monday, ..., 6=Saturday
ALTER TABLE org_checklists ADD COLUMN IF NOT EXISTS reset_day_of_week INTEGER;
ALTER TABLE org_checklists ADD CONSTRAINT chk_day_of_week CHECK (reset_day_of_week IS NULL OR (reset_day_of_week >= 0 AND reset_day_of_week <= 6));

-- Day of month for monthly checklists: 1-31
ALTER TABLE org_checklists ADD COLUMN IF NOT EXISTS reset_day_of_month INTEGER;
ALTER TABLE org_checklists ADD CONSTRAINT chk_day_of_month CHECK (reset_day_of_month IS NULL OR (reset_day_of_month >= 1 AND reset_day_of_month <= 31));
