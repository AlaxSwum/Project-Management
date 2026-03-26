-- Services table: NHS and Private services with sub-services support
-- Each service belongs to a company, has a type (nhs/private), and can have sub-services via parent_id

CREATE TABLE IF NOT EXISTS org_services (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES org_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('nhs', 'private')),
  parent_id INTEGER REFERENCES org_services(id) ON DELETE CASCADE,
  age_eligibility TEXT DEFAULT '',        -- e.g. "Ages 1-17", "Women 16-64"
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES auth_user(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_services_company ON org_services(company_id);
CREATE INDEX IF NOT EXISTS idx_org_services_parent ON org_services(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_services_type ON org_services(type);

-- Patient service records: logs when a patient uses a service
CREATE TABLE IF NOT EXISTS org_service_records (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES org_companies(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES org_services(id) ON DELETE CASCADE,
  sub_service_id INTEGER REFERENCES org_services(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT DEFAULT '',
  staff_user_id INTEGER NOT NULL REFERENCES auth_user(id),
  notes TEXT DEFAULT '',
  record_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_service_records_company ON org_service_records(company_id);
CREATE INDEX IF NOT EXISTS idx_org_service_records_service ON org_service_records(service_id);
CREATE INDEX IF NOT EXISTS idx_org_service_records_date ON org_service_records(record_date);
CREATE INDEX IF NOT EXISTS idx_org_service_records_staff ON org_service_records(staff_user_id);
