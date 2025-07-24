-- =====================================================
-- ADD ADMIN ACCESS TO COMPANY OUTREACH
-- =====================================================
-- Use this script to add yourself or other users as admin

-- Step 1: Find your user ID
SELECT 
    id,
    name,
    email,
    role,
    is_superuser,
    is_staff
FROM auth_user 
ORDER BY created_at DESC;

-- Step 2: Add yourself as admin (replace YOUR_USER_ID with your actual ID from above)
-- INSERT INTO company_outreach_members (user_id, role) VALUES (YOUR_USER_ID, 'admin');

-- Example: If your user ID is 5, uncomment and run this:
-- INSERT INTO company_outreach_members (user_id, role) VALUES (5, 'admin');

-- Step 3: Verify the access was added
SELECT 
    com.id,
    com.user_id,
    com.role,
    au.name,
    au.email
FROM company_outreach_members com
JOIN auth_user au ON com.user_id = au.id
ORDER BY com.added_at DESC;

-- Optional: Remove access for a user (replace USER_ID with actual ID)
-- DELETE FROM company_outreach_members WHERE user_id = USER_ID;

SELECT 'Admin access script ready!' as status; 