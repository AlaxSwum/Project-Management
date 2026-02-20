-- Employee Daily/Weekly/Monthly Reports
CREATE TABLE IF NOT EXISTS org_employee_reports (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES org_departments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  report_date DATE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  tasks_completed TEXT DEFAULT '',
  challenges TEXT DEFAULT '',
  plans_for_next TEXT DEFAULT '',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, user_id, report_type, report_date)
);

CREATE INDEX IF NOT EXISTS idx_employee_reports_dept ON org_employee_reports(department_id);
CREATE INDEX IF NOT EXISTS idx_employee_reports_user ON org_employee_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_reports_date ON org_employee_reports(report_date);
