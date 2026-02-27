-- Add agenda_overrides JSONB column to projects_meeting.
-- This stores per-occurrence agenda items for recurring meetings.
-- Format: { "2026-02-27": ["item1", "item2"], "2026-02-28": ["item3"] }
-- The base agenda_items column remains the default for all occurrences.

ALTER TABLE projects_meeting
ADD COLUMN IF NOT EXISTS agenda_overrides jsonb DEFAULT '{}';
