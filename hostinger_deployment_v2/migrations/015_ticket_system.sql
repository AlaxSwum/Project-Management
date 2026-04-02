-- ============================================
-- Migration: Ticket System for Hush Healthcare
-- Tables: systems, user_system_access, tickets,
--         ticket_comments, ticket_attachments,
--         ticket_activity_log, ticket_notifications
-- ============================================

-- 1. Ticket Systems (the 3 systems)
CREATE TABLE IF NOT EXISTS ticket_systems (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  colour TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed the 3 systems
INSERT INTO ticket_systems (name, slug, prefix, description, colour) VALUES
  ('HOPEIMS', 'hopeims', 'HOPE', 'Patient Medication Record system', '#2563EB'),
  ('Rother Care Website', 'rother-care-website', 'RCW', 'WordPress website for Rother Care Pharmacy', '#059669'),
  ('Booking System', 'booking-system', 'BOOK', 'Online appointment/service booking platform', '#D97706')
ON CONFLICT (slug) DO NOTHING;

-- 2. User System Access (which staff can access which systems)
CREATE TABLE IF NOT EXISTS ticket_user_system_access (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  system_id INTEGER NOT NULL REFERENCES ticket_systems(id) ON DELETE CASCADE,
  granted_by INTEGER REFERENCES auth_user(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, system_id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_user_system_user ON ticket_user_system_access(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_user_system_system ON ticket_user_system_access(system_id);

-- 3. Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  system_id INTEGER NOT NULL REFERENCES ticket_systems(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'bug' CHECK (type IN ('bug', 'feature_request', 'improvement', 'task', 'support')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'in_review', 'testing', 'done', 'closed', 'on_hold', 'wont_fix')),
  resolution TEXT CHECK (resolution IN ('fixed', 'wont_fix', 'duplicate', 'cannot_reproduce', 'by_design', 'workaround')),
  reporter_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  assignee_id INTEGER REFERENCES auth_user(id),
  due_date DATE,
  environment TEXT CHECK (environment IN ('production', 'staging', 'development', 'local')),
  browser_device TEXT,
  steps_to_reproduce TEXT,
  expected_behaviour TEXT,
  actual_behaviour TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_tickets_system ON tickets(system_id);
CREATE INDEX IF NOT EXISTS idx_tickets_reporter ON tickets(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);

-- 4. Ticket Comments
CREATE TABLE IF NOT EXISTS ticket_comments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);

-- 5. Ticket Attachments
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  file_type TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON ticket_attachments(ticket_id);

-- 6. Ticket Activity Log (auto-populated by triggers)
CREATE TABLE IF NOT EXISTS ticket_activity_log (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_activity_ticket ON ticket_activity_log(ticket_id);

-- 7. Ticket Notifications
CREATE TABLE IF NOT EXISTS ticket_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_notifications_user ON ticket_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_notifications_unread ON ticket_notifications(user_id, is_read) WHERE is_read = FALSE;

-- 8. Ticket Number Sequence Tables (per system)
CREATE TABLE IF NOT EXISTS ticket_number_seq (
  system_id INTEGER NOT NULL REFERENCES ticket_systems(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (system_id)
);

-- Seed sequences
INSERT INTO ticket_number_seq (system_id, last_number)
SELECT id, 0 FROM ticket_systems
ON CONFLICT (system_id) DO NOTHING;

-- 9. Function: Generate next ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number(p_system_id INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_next INTEGER;
BEGIN
  SELECT prefix INTO v_prefix FROM ticket_systems WHERE id = p_system_id;
  IF v_prefix IS NULL THEN
    RAISE EXCEPTION 'System not found';
  END IF;

  UPDATE ticket_number_seq
  SET last_number = last_number + 1
  WHERE system_id = p_system_id
  RETURNING last_number INTO v_next;

  RETURN v_prefix || '-' || LPAD(v_next::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger: Auto-generate ticket number on insert
CREATE OR REPLACE FUNCTION trigger_set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number(NEW.system_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_ticket_number ON tickets;
CREATE TRIGGER trg_set_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_ticket_number();

-- 11. Trigger: Auto-set closed_at and updated_at
CREATE OR REPLACE FUNCTION trigger_ticket_status_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  IF NEW.status IN ('done', 'closed') AND OLD.status NOT IN ('done', 'closed') THEN
    NEW.closed_at := NOW();
  END IF;
  IF NEW.status NOT IN ('done', 'closed') THEN
    NEW.closed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ticket_status_update ON tickets;
CREATE TRIGGER trg_ticket_status_update
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ticket_status_update();

-- 12. Trigger: Log ticket changes to activity log
CREATE OR REPLACE FUNCTION trigger_ticket_activity_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO ticket_activity_log (ticket_id, actor_id, action, old_value, new_value)
      VALUES (NEW.id, COALESCE(NEW.assignee_id, NEW.reporter_id), 'status_changed', OLD.status, NEW.status);
    END IF;
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO ticket_activity_log (ticket_id, actor_id, action, old_value, new_value)
      VALUES (NEW.id, COALESCE(NEW.assignee_id, NEW.reporter_id), 'priority_changed', OLD.priority, NEW.priority);
    END IF;
    IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
      INSERT INTO ticket_activity_log (ticket_id, actor_id, action, old_value, new_value)
      VALUES (NEW.id, COALESCE(NEW.assignee_id, NEW.reporter_id), 'assigned',
        (SELECT name FROM auth_user WHERE id = OLD.assignee_id),
        (SELECT name FROM auth_user WHERE id = NEW.assignee_id));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ticket_activity_log ON tickets;
CREATE TRIGGER trg_ticket_activity_log
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ticket_activity_log();

-- 13. Grant admin/developer access to all systems
-- Admin users get access to everything
INSERT INTO ticket_user_system_access (user_id, system_id)
SELECT u.id, s.id FROM auth_user u, ticket_systems s WHERE u.role = 'admin'
ON CONFLICT (user_id, system_id) DO NOTHING;

-- Grant access to developer (swumpyaesone.personal@gmail.com)
INSERT INTO ticket_user_system_access (user_id, system_id)
SELECT u.id, s.id FROM auth_user u, ticket_systems s WHERE u.email = 'swumpyaesone.personal@gmail.com'
ON CONFLICT (user_id, system_id) DO NOTHING;

-- Set developer role for main developer account
UPDATE auth_user SET role = 'admin' WHERE email = 'swumpyaesone.personal@gmail.com';
