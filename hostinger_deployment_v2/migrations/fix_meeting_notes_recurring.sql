-- Fix: Allow per-day meeting notes for recurring meetings.
-- Old constraint: UNIQUE(meeting_id) - only one note per meeting, shared across all occurrences.
-- New constraint: UNIQUE(meeting_id, date) - one note per meeting per day.

-- Drop the old unique index (one note per meeting)
DROP INDEX IF EXISTS idx_meeting_notes_unique_meeting;

-- Create new unique index (one note per meeting per date)
CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_notes_unique_meeting_date
  ON meeting_notes(meeting_id, date);
