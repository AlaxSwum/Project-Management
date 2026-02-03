-- =====================================================
-- AUTOMATIC ADMIN ACCESS FOR COMPANY OUTREACH
-- =====================================================
-- This script automatically adds all admin users to company outreach

-- First, let's see all users and their roles
SELECT 
    id,
    name,
    email,
    role,
    is_superuser,
    is_staff
FROM auth_user 
ORDER BY updated_at DESC;

-- Automatically add ALL admin users to company outreach
-- This includes superusers, staff, admin role, and hr role
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

-- Verify who got access
SELECT 
    com.id,
    com.user_id,
    com.role as outreach_role,
    au.name,
    au.email,
    au.role as user_role,
    au.is_superuser,
    au.is_staff
FROM company_outreach_members com
JOIN auth_user au ON com.user_id = au.id
ORDER BY com.added_at DESC;

SELECT 'All admin users now have Company Outreach access!' as status; 