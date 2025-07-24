-- =====================================================
-- COMPANY OUTREACH (IDEA LOUNGE) COMPLETE DATABASE SETUP
-- =====================================================
-- Run this script in Supabase SQL Editor to set up
-- all tables for Company Outreach feature
-- =====================================================

-- 1. Company Outreach Members Table (Access Control)
CREATE TABLE IF NOT EXISTS company_outreach_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_user(id),
    role VARCHAR(20) DEFAULT 'member',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by INTEGER REFERENCES auth_user(id),
    UNIQUE(user_id)
);

-- 2. Field of Specialization Table (for dropdown options)
CREATE TABLE IF NOT EXISTS company_outreach_specializations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by_id INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Company Outreach Main Table
CREATE TABLE IF NOT EXISTS company_outreach (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    field_of_specialization_ids INTEGER[], -- Array of specialization IDs
    contact_person_id INTEGER REFERENCES auth_user(id), -- Only one person can be selected
    phone_number VARCHAR(50),
    email_address VARCHAR(255),
    note TEXT,
    follow_up_person_id INTEGER REFERENCES auth_user(id),
    address TEXT,
    meet_up_person_ids INTEGER[], -- Array of user IDs for multiple selection
    follow_up_done BOOLEAN DEFAULT false, -- yes/no for follow up done
    created_by_id INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DEFAULT SPECIALIZATION DATA
-- =====================================================

INSERT INTO company_outreach_specializations (name, description) VALUES
('Technology', 'Software development, IT services, and tech solutions'),
('Education', 'Educational institutions, training centers, and learning platforms'),
('Healthcare', 'Medical services, hospitals, clinics, and health technology'),
('Finance', 'Banking, investment, insurance, and financial services'),
('Marketing', 'Advertising agencies, digital marketing, and media companies'),
('Manufacturing', 'Production, industrial equipment, and manufacturing processes'),
('Retail', 'Stores, e-commerce, and consumer goods'),
('Real Estate', 'Property development, real estate agencies, and construction'),
('Legal', 'Law firms, legal services, and compliance consulting'),
('Non-profit', 'NGOs, charities, and social impact organizations')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Company Outreach Indexes
CREATE INDEX IF NOT EXISTS idx_company_outreach_contact_person ON company_outreach(contact_person_id);
CREATE INDEX IF NOT EXISTS idx_company_outreach_follow_up_person ON company_outreach(follow_up_person_id);
CREATE INDEX IF NOT EXISTS idx_company_outreach_follow_up_done ON company_outreach(follow_up_done);
CREATE INDEX IF NOT EXISTS idx_company_outreach_created_by ON company_outreach(created_by_id);
CREATE INDEX IF NOT EXISTS idx_company_outreach_company_name ON company_outreach(company_name);

-- Specialization Indexes
CREATE INDEX IF NOT EXISTS idx_specializations_active ON company_outreach_specializations(is_active);
CREATE INDEX IF NOT EXISTS idx_specializations_name ON company_outreach_specializations(name);

-- Member Indexes
CREATE INDEX IF NOT EXISTS idx_company_outreach_members_user ON company_outreach_members(user_id);

-- =====================================================
-- AUTOMATIC ADMIN MEMBER SETUP
-- =====================================================

-- Add admin user as company outreach member (replace 1 with your actual user ID)
INSERT INTO company_outreach_members (user_id, role) VALUES (1, 'admin') ON CONFLICT (user_id) DO NOTHING;

-- Add all superusers to company outreach access automatically
INSERT INTO company_outreach_members (user_id, role)
SELECT id, 'admin'
FROM auth_user 
WHERE is_superuser = true
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Add all staff to company outreach access automatically  
INSERT INTO company_outreach_members (user_id, role)
SELECT id, 'admin'
FROM auth_user 
WHERE is_staff = true
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_company_outreach_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_company_outreach_updated_at 
    BEFORE UPDATE ON company_outreach 
    FOR EACH ROW EXECUTE FUNCTION update_company_outreach_updated_at_column();

CREATE TRIGGER update_company_outreach_specializations_updated_at 
    BEFORE UPDATE ON company_outreach_specializations 
    FOR EACH ROW EXECUTE FUNCTION update_company_outreach_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (Permissive for now)
-- =====================================================

-- Enable RLS
ALTER TABLE company_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_outreach_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_outreach_members ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (allow all authenticated users for now)
CREATE POLICY "company_outreach_select_policy" ON company_outreach
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "company_outreach_insert_policy" ON company_outreach
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "company_outreach_update_policy" ON company_outreach
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "company_outreach_delete_policy" ON company_outreach
    FOR DELETE TO authenticated USING (true);

-- Specializations policies
CREATE POLICY "company_outreach_specializations_select_policy" ON company_outreach_specializations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "company_outreach_specializations_insert_policy" ON company_outreach_specializations
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "company_outreach_specializations_update_policy" ON company_outreach_specializations
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "company_outreach_specializations_delete_policy" ON company_outreach_specializations
    FOR DELETE TO authenticated USING (true);

-- Members policies
CREATE POLICY "company_outreach_members_select_policy" ON company_outreach_members
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "company_outreach_members_insert_policy" ON company_outreach_members
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "company_outreach_members_update_policy" ON company_outreach_members
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "company_outreach_members_delete_policy" ON company_outreach_members
    FOR DELETE TO authenticated USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON company_outreach TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON company_outreach_specializations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON company_outreach_members TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This will show in the query results
SELECT 
    'Company Outreach Setup Complete!' as status,
    (SELECT COUNT(*) FROM company_outreach_members) as admin_members_added; 