# 🚀 Hostinger Deployment Guide - Company Outreach Feature

## Quick Deploy (Recommended)

**On your Hostinger server (168.231.116.32), run:**

```bash
cd /var/www/project_management
wget https://raw.githubusercontent.com/AlaxSwum/Project-Management/main/deploy-hostinger-company-outreach.sh
chmod +x deploy-hostinger-company-outreach.sh
sudo ./deploy-hostinger-company-outreach.sh
```

## Manual Deployment Steps

### 1. Update Code
```bash
cd /var/www/project_management
sudo git pull origin main
```

### 2. Stop Services
```bash
sudo systemctl stop nextjs-pm
sudo systemctl stop nginx
```

### 3. Rebuild Frontend
```bash
cd /var/www/project_management/frontend
sudo rm -rf .next node_modules
sudo npm install
sudo npm run build
```

### 4. Restart Services
```bash
sudo systemctl start nextjs-pm
sudo systemctl start nginx
```

## 🗄️ Database Setup (Critical)

### Step 1: Fix RLS Policies
Copy and paste this in **Supabase SQL Editor**:

```sql
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

-- Grant proper permissions
GRANT ALL ON company_outreach TO authenticated;
GRANT ALL ON company_outreach_specializations TO authenticated;
GRANT ALL ON company_outreach_members TO authenticated;
```

### Step 2: Create Tables (if not exists)
Copy from `create_company_outreach_tables_safe.sql`

### Step 3: Add Admin Access
```sql
-- Find your user ID
SELECT id, name, email FROM auth_user ORDER BY created_at DESC;

-- Add yourself as admin (replace YOUR_USER_ID)
INSERT INTO company_outreach_members (user_id, role) VALUES (YOUR_USER_ID, 'admin');
```

## 🌐 Access URLs

- **Direct:** http://168.231.116.32:3000
- **Nginx Proxy:** http://168.231.116.32
- **Company Outreach:** http://168.231.116.32/company-outreach

## 🔧 Troubleshooting

### Check Service Status
```bash
sudo systemctl status nextjs-pm
sudo systemctl status nginx
```

### View Logs
```bash
sudo journalctl -u nextjs-pm -f
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
sudo systemctl restart nextjs-pm
sudo systemctl restart nginx
```

### Common Issues

1. **Port 3000 in use:**
   ```bash
   sudo killall node
   sudo systemctl restart nextjs-pm
   ```

2. **Build errors:**
   ```bash
   cd /var/www/project_management/frontend
   sudo rm -rf .next node_modules package-lock.json
   sudo npm install
   sudo npm run build
   ```

3. **Permission issues:**
   ```bash
   sudo chown -R www-data:www-data /var/www/project_management
   sudo chmod -R 755 /var/www/project_management
   ```

## 🎯 New Features

✅ **Company Outreach Management**
- Add/edit/delete companies
- Field of specialization management
- Contact person assignments
- Follow-up tracking
- Advanced filtering

✅ **Access Control**
- Role-based access
- Admin automatic access
- Secure RLS policies

✅ **Improved UI/UX**
- Card-based design
- Real-time updates
- Better error handling

## 📱 How to Test

1. Login to your application
2. Look for **"Idea Lounge"** section in sidebar
3. Click **"Company Outreach"**
4. Test adding companies
5. Try field management features

## 🆘 Emergency Rollback

If deployment fails:
```bash
sudo systemctl stop nextjs-pm nginx
sudo mv /var/www/project_management_backup /var/www/project_management
sudo systemctl start nextjs-pm nginx
```

## 📞 Support

- Check logs first: `sudo journalctl -u nextjs-pm -f`
- Verify database setup in Supabase
- Ensure all SQL scripts were run successfully
- Test direct access: `curl http://localhost:3000` 