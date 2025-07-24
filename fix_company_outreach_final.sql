-- =====================================================
-- FINAL COMPANY OUTREACH FIX
-- =====================================================
-- This script fixes all RLS policies and relationship issues

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'company_outreach%';

-- If no tables shown above, run create_company_outreach_tables_safe.sql first!

-- =====================================================
-- FIX RLS POLICIES - PART 1: Drop all existing policies
-- =====================================================

-- Drop company_outreach policies
DROP POLICY IF EXISTS "company_outreach_select_policy" ON company_outreach;
DROP POLICY IF EXISTS "company_outreach_insert_policy" ON company_outreach;
DROP POLICY IF EXISTS "company_outreach_update_policy" ON company_outreach;
DROP POLICY IF EXISTS "company_outreach_delete_policy" ON company_outreach;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON company_outreach;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON company_outreach;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON company_outreach;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON company_outreach;

-- Drop company_outreach_specializations policies  
DROP POLICY IF EXISTS "company_outreach_specializations_select_policy" ON company_outreach_specializations;
DROP POLICY IF EXISTS "company_outreach_specializations_insert_policy" ON company_outreach_specializations;
DROP POLICY IF EXISTS "company_outreach_specializations_update_policy" ON company_outreach_specializations;
DROP POLICY IF EXISTS "company_outreach_specializations_delete_policy" ON company_outreach_specializations;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON company_outreach_specializations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON company_outreach_specializations;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON company_outreach_specializations;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON company_outreach_specializations;

-- Drop company_outreach_members policies
DROP POLICY IF EXISTS "company_outreach_members_select_policy" ON company_outreach_members;
DROP POLICY IF EXISTS "company_outreach_members_insert_policy" ON company_outreach_members;
DROP POLICY IF EXISTS "company_outreach_members_update_policy" ON company_outreach_members;
DROP POLICY IF EXISTS "company_outreach_members_delete_policy" ON company_outreach_members;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON company_outreach_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON company_outreach_members;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON company_outreach_members;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON company_outreach_members;

-- =====================================================
-- FIX RLS POLICIES - PART 2: Create permissive policies
-- =====================================================

-- Company Outreach table policies
CREATE POLICY "co_select_all" ON company_outreach
    FOR SELECT USING (true);

CREATE POLICY "co_insert_all" ON company_outreach
    FOR INSERT WITH CHECK (true);

CREATE POLICY "co_update_all" ON company_outreach
    FOR UPDATE USING (true);

CREATE POLICY "co_delete_all" ON company_outreach
    FOR DELETE USING (true);

-- Company Outreach Specializations table policies
CREATE POLICY "cos_select_all" ON company_outreach_specializations
    FOR SELECT USING (true);

CREATE POLICY "cos_insert_all" ON company_outreach_specializations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "cos_update_all" ON company_outreach_specializations
    FOR UPDATE USING (true);

CREATE POLICY "cos_delete_all" ON company_outreach_specializations
    FOR DELETE USING (true);

-- Company Outreach Members table policies
CREATE POLICY "com_select_all" ON company_outreach_members
    FOR SELECT USING (true);

CREATE POLICY "com_insert_all" ON company_outreach_members
    FOR INSERT WITH CHECK (true);

CREATE POLICY "com_update_all" ON company_outreach_members
    FOR UPDATE USING (true);

CREATE POLICY "com_delete_all" ON company_outreach_members
    FOR DELETE USING (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant all permissions to authenticated role
GRANT ALL ON company_outreach TO authenticated;
GRANT ALL ON company_outreach_specializations TO authenticated;
GRANT ALL ON company_outreach_members TO authenticated;

-- Grant all permissions to anon role (for public access)
GRANT ALL ON company_outreach TO anon;
GRANT ALL ON company_outreach_specializations TO anon;
GRANT ALL ON company_outreach_members TO anon;

-- Grant all permissions to public role
GRANT ALL ON company_outreach TO public;
GRANT ALL ON company_outreach_specializations TO public;
GRANT ALL ON company_outreach_members TO public;

-- =====================================================
-- ADD ADMIN ACCESS AUTOMATICALLY
-- =====================================================

-- Add all admin users to company outreach members
INSERT INTO company_outreach_members (user_id, role)
SELECT 
    id,
    'admin'
FROM auth_user 
WHERE 
    is_superuser = true 
    OR is_staff = true 
    OR role = 'admin' 
    OR role = 'hr'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- =====================================================
-- VERIFY SETUP
-- =====================================================

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename LIKE 'company_outreach%'
ORDER BY tablename, policyname;

-- Check permissions
SELECT table_name, grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name LIKE 'company_outreach%'
ORDER BY table_name, grantee;

-- Check admin access
SELECT 
    au.name,
    au.email,
    au.role,
    au.is_superuser,
    au.is_staff,
    com.role as outreach_role
FROM company_outreach_members com
JOIN auth_user au ON com.user_id = au.id
ORDER BY au.name;

SELECT 'Company Outreach RLS and permissions fixed!' as status; 