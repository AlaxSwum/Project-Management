-- =====================================================
-- FIX COMPANY OUTREACH RLS POLICIES
-- =====================================================
-- This script fixes Row Level Security issues for company outreach

-- Drop existing policies
DROP POLICY IF EXISTS "company_outreach_select_policy" ON company_outreach;
DROP POLICY IF EXISTS "company_outreach_insert_policy" ON company_outreach;
DROP POLICY IF EXISTS "company_outreach_update_policy" ON company_outreach;
DROP POLICY IF EXISTS "company_outreach_delete_policy" ON company_outreach;

-- Create more permissive policies for company_outreach
CREATE POLICY "Enable read access for authenticated users" ON company_outreach
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON company_outreach
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON company_outreach
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON company_outreach
    FOR DELETE USING (auth.role() = 'authenticated');

-- Fix specializations policies
DROP POLICY IF EXISTS "company_outreach_specializations_select_policy" ON company_outreach_specializations;
DROP POLICY IF EXISTS "company_outreach_specializations_insert_policy" ON company_outreach_specializations;
DROP POLICY IF EXISTS "company_outreach_specializations_update_policy" ON company_outreach_specializations;
DROP POLICY IF EXISTS "company_outreach_specializations_delete_policy" ON company_outreach_specializations;

CREATE POLICY "Enable read access for specializations" ON company_outreach_specializations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for specializations" ON company_outreach_specializations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for specializations" ON company_outreach_specializations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for specializations" ON company_outreach_specializations
    FOR DELETE USING (auth.role() = 'authenticated');

-- Fix members policies
DROP POLICY IF EXISTS "company_outreach_members_select_policy" ON company_outreach_members;
DROP POLICY IF EXISTS "company_outreach_members_insert_policy" ON company_outreach_members;
DROP POLICY IF EXISTS "company_outreach_members_update_policy" ON company_outreach_members;
DROP POLICY IF EXISTS "company_outreach_members_delete_policy" ON company_outreach_members;

CREATE POLICY "Enable read access for members" ON company_outreach_members
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for members" ON company_outreach_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for members" ON company_outreach_members
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for members" ON company_outreach_members
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant proper permissions
GRANT ALL ON company_outreach TO authenticated;
GRANT ALL ON company_outreach_specializations TO authenticated;
GRANT ALL ON company_outreach_members TO authenticated;

SELECT 'Company Outreach RLS policies fixed!' as status; 