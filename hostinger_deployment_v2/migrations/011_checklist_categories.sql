-- Migration: Checklist Categories
-- Categories group checklist items (daily/weekly/monthly all live under one category)

CREATE TABLE IF NOT EXISTS org_checklist_categories (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES org_companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_by INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link checklists to categories (nullable for backward compat)
ALTER TABLE org_checklists ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES org_checklist_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_checklist_categories_company ON org_checklist_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_checklists_category ON org_checklists(category_id);
