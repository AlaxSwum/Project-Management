# 🚀 Deploy Latest Changes to Hostinger Server

## 📋 **Latest Changes Ready for Deployment:**

### ✅ **Recent Updates (Last 5 Commits):**
1. **Personal Tasks System Fixes** - Fixed database structure and removed duration field
2. **Expense Management System** - Complete with folder sharing and user suggestions  
3. **Daily Reports** - Hierarchical Project → Date → User structure
4. **Mobile Navigation** - Consistent hamburger icons across all pages
5. **Content Calendar** - Reverted to stable working version

## 🎯 **What's Included in This Deployment:**

### **💰 Expense Management System:**
- **New "Expenses" tab** in navigation (💰 icon)
- **Folder-based organization** with team sharing
- **Monthly expense sheets** with spreadsheet view
- **User autocomplete** when adding members to folders
- **Role-based permissions** (Owner/Editor/Viewer)
- **Multi-currency support** (USD, EUR, GBP, MMK)
- **Receipt attachments** and detailed tracking

### **📊 Daily Reports System:**
- **Hierarchical view** - Project → Date → User structure
- **Daily Report Form** (no more weekly reports)
- **Meeting minutes tracking** with visual indicators
- **Calendar visualization** of reports

### **📱 Mobile Improvements:**
- **Consistent hamburger icons** across all pages
- **Responsive design** for expense management
- **Mobile-optimized layouts**

### **🔧 Personal Tasks Fixes:**
- **Database structure improvements**
- **Removed problematic duration field**
- **Enhanced stability**

## 🚀 **Manual Deployment Steps:**

### **Step 1: SSH into your server**
```bash
ssh root@srv875725.hstgr.cloud
```

### **Step 2: Navigate to project directory**
```bash
cd /var/www/project_management
```

### **Step 3: Pull latest changes**
```bash
git pull origin main
```

### **Step 4: Stop services**
```bash
systemctl stop nextjs-pm
```

### **Step 5: Clear cache and rebuild**
```bash
cd frontend
rm -rf .next node_modules/.cache
npm cache clean --force
npm install
npm run build
```

### **Step 6: Set permissions and restart**
```bash
cd ..
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management
systemctl start nextjs-pm
```

### **Step 7: Verify deployment**
```bash
systemctl status nextjs-pm
```

## 📋 **Database Deployments Needed:**

### **1. Expense Management Database:**
Copy and run in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS expense_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    folder_type VARCHAR(50) DEFAULT 'expense',
    budget_limit DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD'
);

CREATE TABLE IF NOT EXISTS expense_folder_members (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES expense_folders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    added_by INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(folder_id, user_id)
);

CREATE TABLE IF NOT EXISTS expense_items (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES expense_folders(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL,
    created_by_name TEXT NOT NULL,
    created_by_email TEXT NOT NULL,
    item_name VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(15,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (price * quantity) STORED,
    currency VARCHAR(3) DEFAULT 'USD',
    expense_date DATE NOT NULL,
    month_year VARCHAR(7) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO expense_categories (name, description) VALUES
('Office Supplies', 'Pens, paper, office equipment'),
('Travel', 'Transportation, accommodation'),
('Meals & Entertainment', 'Business meals, client entertainment'),
('Software & Subscriptions', 'Software licenses, subscriptions'),
('Equipment', 'Hardware, computers, office equipment'),
('Marketing', 'Advertising, promotional materials'),
('Training & Education', 'Courses, conferences, training'),
('Utilities', 'Internet, phone, electricity'),
('Rent & Facilities', 'Office rent, facility costs'),
('Miscellaneous', 'Other business expenses')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE expense_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_folder_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories DISABLE ROW LEVEL SECURITY;

GRANT ALL ON expense_folders TO authenticated;
GRANT ALL ON expense_folders TO anon;
GRANT ALL ON expense_folder_members TO authenticated;
GRANT ALL ON expense_folder_members TO anon;
GRANT ALL ON expense_items TO authenticated;
GRANT ALL ON expense_items TO anon;
GRANT ALL ON expense_categories TO authenticated;
GRANT ALL ON expense_categories TO anon;

SELECT 'SUCCESS: Expense Management System deployed!' as result;
```

### **2. Daily Reports Database (if not done already):**
```sql
CREATE TABLE IF NOT EXISTS daily_reports (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    employee_name TEXT NOT NULL,
    employee_email TEXT NOT NULL,
    project_id INTEGER REFERENCES projects_project(id) ON DELETE SET NULL,
    project_name TEXT,
    report_date DATE NOT NULL,
    date_display TEXT NOT NULL,
    key_activities TEXT NOT NULL,
    ongoing_tasks TEXT,
    challenges TEXT,
    team_performance TEXT,
    next_day_priorities TEXT,
    meeting_minutes TEXT,
    has_meeting_minutes BOOLEAN DEFAULT FALSE,
    other_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_employee ON daily_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_project ON daily_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_reports_unique ON daily_reports(employee_id, report_date, project_id);

ALTER TABLE daily_reports DISABLE ROW LEVEL SECURITY;
GRANT ALL ON daily_reports TO authenticated;
GRANT ALL ON daily_reports TO anon;
```

## 🎯 **After Deployment You'll Have:**

- ✅ **Fixed Personal Tasks** - No more duration field errors
- ✅ **Complete Expense Management** - Folder sharing with user suggestions
- ✅ **Hierarchical Daily Reports** - Project → Date → User structure  
- ✅ **Mobile Consistency** - Fixed hamburger icons
- ✅ **Responsive Design** - Works on all devices
- ✅ **Primary Background** - Clean professional appearance

## 📞 **Need Help?**
If you encounter any issues during deployment, the build logs show everything compiled successfully, so the deployment should work smoothly.

**Your latest changes are ready to deploy!** 🚀
