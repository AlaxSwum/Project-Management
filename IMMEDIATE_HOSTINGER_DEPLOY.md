# 🚀 IMMEDIATE HOSTINGER DEPLOYMENT

## Step 1: Run SQL in Supabase

**Copy and paste this EXACT SQL in your Supabase SQL Editor:**

```sql
-- Check if tables exist first
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'company_outreach%';

-- If no tables shown above, create them first:
-- Copy the entire content from: create_company_outreach_tables_safe.sql

-- Grant permissions to all authenticated users
GRANT ALL ON company_outreach TO authenticated;
GRANT ALL ON company_outreach_specializations TO authenticated;
GRANT ALL ON company_outreach_members TO authenticated;

-- Automatically add ALL admin users (NO manual ID needed)
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

-- Verify access was granted
SELECT 
    com.user_id,
    com.role as outreach_role,
    au.name,
    au.email,
    au.role as user_role,
    au.is_superuser,
    au.is_staff
FROM company_outreach_members com
JOIN auth_user au ON com.user_id = au.id;
```

## Step 2: Deploy to Hostinger

**SSH into your server and run these commands:**

```bash
# Connect to your Hostinger server
ssh root@srv875725.hstgr.cloud

# Navigate to project directory
cd /var/www/project_management

# Pull the latest code with fixes
git pull origin main

# Quick deployment
chmod +x quick-deploy-hostinger.sh
sudo ./quick-deploy-hostinger.sh

# Check status
sudo systemctl status nextjs-pm
```

## Step 3: Verify Deployment

1. **Visit:** https://srv875725.hstgr.cloud
2. **Login** with your admin account
3. **Look for "Idea Lounge"** section in sidebar
4. **"Company Outreach"** tab should appear

## 🎯 What's Fixed

✅ **No manual user ID needed** - Script automatically adds all admin users  
✅ **Any admin role gets access** - superuser, staff, admin, hr roles  
✅ **Simplified access control** - No complex database setup  
✅ **Fixed SQL errors** - Correct column names used  

## 🔧 If Issues Occur

**Restart services:**
```bash
sudo systemctl restart nextjs-pm
sudo systemctl restart nginx
```

**Check logs:**
```bash
sudo journalctl -u nextjs-pm -f
```

**Clear cache:**
```bash
cd /var/www/project_management/frontend
sudo rm -rf .next
sudo npm run build
sudo systemctl restart nextjs-pm
```

## ✅ Expected Result

After SQL + deployment:
- "Idea Lounge" section appears in sidebar
- "Company Outreach" tab is visible
- Admin users can access without manual setup 