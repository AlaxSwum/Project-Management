# 🚀 Manual Deployment Guide for Latest Changes

## 📋 **Current Status:**
- ✅ All code is built and ready (28.9 kB expenses page)
- ✅ Git repository is up to date
- ❌ SSH connection has permission issues

## 🔧 **Alternative Deployment Methods:**

### **Method 1: Hostinger Control Panel**

1. **Login to Hostinger Control Panel**
2. **Go to File Manager** or **hPanel → Files**
3. **Navigate to** `/var/www/project_management`
4. **Upload the latest files** or use Git pull
5. **Restart the service** via control panel

### **Method 2: Direct Server Terminal**

If you have access to Hostinger's web terminal:

```bash
cd /var/www/project_management
git pull origin main
systemctl stop nextjs-pm
cd frontend
rm -rf .next node_modules/.cache
npm install
npm run build
cd ..
systemctl start nextjs-pm
```

### **Method 3: Fix SSH and Retry**

**Check SSH Key:**
```bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
cat ~/.ssh/id_rsa.pub
```

**Add the public key to your server's authorized_keys**

**Then retry deployment:**
```bash
ssh root@srv875725.hstgr.cloud
```

### **Method 4: Use Different SSH Options**

Try with password authentication:
```bash
ssh -o PreferredAuthentications=password root@srv875725.hstgr.cloud
```

## 📊 **What Will Be Deployed:**

### **💰 Expense Management System:**
- **New "Expenses" tab** in navigation
- **Folder-based organization** with team sharing
- **User autocomplete** for member management
- **Monthly expense sheets** with spreadsheet view
- **Role-based permissions** (Owner/Editor/Viewer)
- **Multi-currency support**
- **Receipt attachments**

### **📊 Daily Reports:**
- **Hierarchical view** - Project → Date → User
- **Meeting minutes tracking**
- **Calendar visualization**

### **🔧 Personal Tasks:**
- **Fixed database structure**
- **Removed problematic duration field**
- **Enhanced stability**

### **📱 Mobile Improvements:**
- **Consistent hamburger icons**
- **Responsive design**
- **Primary background color**

## 🗄️ **Database Deployment Required:**

After frontend deployment, run this in **Supabase SQL Editor:**

```sql
-- EXPENSE MANAGEMENT TABLES
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

## 🎯 **After Deployment:**
- **Expenses tab** will appear in navigation
- **Create expense folders** and share with team
- **Add expenses** with items, prices, quantities
- **Monthly views** with automatic totals
- **User autocomplete** when adding members

**The code is ready - just need to get it onto your server!** 🚀