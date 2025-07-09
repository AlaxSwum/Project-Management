-- Create test events for positioning verification
INSERT INTO projects_meeting (title, description, date, time, duration, color, event_type, project_id, attendee_ids, created_by_id) VALUES
('event 1', 'Test positioning at 3 AM', '2025-01-10', '03:00', 60, '#FF6B6B', 'test', 2, ARRAY[50], 50),
('event 2', 'Test positioning at 5 AM', '2025-01-10', '05:00', 60, '#4ECDC4', 'test', 2, ARRAY[50], 50),
('event 3', 'Test positioning at 8 AM', '2025-01-10', '08:00', 90, '#45B7D1', 'test', 2, ARRAY[50], 50);
