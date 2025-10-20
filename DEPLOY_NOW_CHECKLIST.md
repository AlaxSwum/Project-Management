# Deploy Checklist Feature NOW - Step by Step

## ⚡ Quick Deployment Guide

### Step 1: Deploy Database (Do This First!) ⭐

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run This SQL** (Copy and paste the entire script below):

```sql
-- Create task_checklist_items table
CREATE TABLE IF NOT EXISTS task_checklist_items (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    item_text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    item_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_task_checklist_task 
        FOREIGN KEY (task_id) 
        REFERENCES projects_meeting(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_checklist_task_id ON task_checklist_items(task_id);
CREATE INDEX IF NOT EXISTS idx_task_checklist_user_id ON task_checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_task_checklist_order ON task_checklist_items(task_id, item_order);

CREATE OR REPLACE FUNCTION update_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_task_checklist_updated_at ON task_checklist_items;
CREATE TRIGGER update_task_checklist_updated_at 
    BEFORE UPDATE ON task_checklist_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_checklist_updated_at();

ALTER TABLE task_checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own task checklist items" ON task_checklist_items;
DROP POLICY IF EXISTS "Users can insert their own task checklist items" ON task_checklist_items;
DROP POLICY IF EXISTS "Users can update their own task checklist items" ON task_checklist_items;
DROP POLICY IF EXISTS "Users can delete their own task checklist items" ON task_checklist_items;

CREATE POLICY "Users can view their own task checklist items" 
    ON task_checklist_items FOR SELECT 
    USING (user_id = current_setting('app.current_user_id', true)::INTEGER);

CREATE POLICY "Users can insert their own task checklist items" 
    ON task_checklist_items FOR INSERT 
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::INTEGER);

CREATE POLICY "Users can update their own task checklist items" 
    ON task_checklist_items FOR UPDATE 
    USING (user_id = current_setting('app.current_user_id', true)::INTEGER)
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::INTEGER);

CREATE POLICY "Users can delete their own task checklist items" 
    ON task_checklist_items FOR DELETE 
    USING (user_id = current_setting('app.current_user_id', true)::INTEGER);

GRANT ALL ON task_checklist_items TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE task_checklist_items_id_seq TO authenticated;
```

4. **Click "RUN"** ✅
5. **Verify Success** - You should see a success message

---

### Step 2: Deploy Frontend

**Option A: Via Git (Recommended)**

If you have Git set up on your server:

```bash
# SSH into your server
ssh u704561835@154.56.55.56

# Navigate to your project
cd domains/focus-project.co.uk/public_html

# Commit and push changes from local first
git add .
git commit -m "Add task checklist feature"
git push origin main

# Pull on server
git pull origin main

# Rebuild
npm install
npm run build

# Restart
pm2 restart focus-project

# Check status
pm2 list
```

**Option B: Direct File Upload via FTP/SFTP**

1. Connect to your server using FileZilla or similar
2. Upload the file:
   - Local: `hostinger_deployment_v2/src/app/personal/page.tsx`
   - Remote: `domains/focus-project.co.uk/public_html/src/app/personal/page.tsx`

3. SSH into server and rebuild:
```bash
ssh u704561835@154.56.55.56
cd domains/focus-project.co.uk/public_html
npm run build
pm2 restart focus-project
```

**Option C: Copy File Content Manually**

1. Open your current file on the server:
```bash
ssh u704561835@154.56.55.56
cd domains/focus-project.co.uk/public_html/src/app/personal
nano page.tsx  # or vi page.tsx
```

2. Replace the entire content with the updated file from:
   `hostinger_deployment_v2/src/app/personal/page.tsx`

3. Save and rebuild:
```bash
cd ~/domains/focus-project.co.uk/public_html
npm run build
pm2 restart focus-project
```

---

### Step 3: Test the Feature

1. Visit: https://focus-project.co.uk/personal
2. Click **"+ New Task"**
3. You should see **"To-Do List (Optional)"** section
4. Try adding some checklist items
5. Create the task
6. Verify it works!

---

## ✅ Verification Checklist

- [ ] SQL script ran successfully in Supabase
- [ ] Table `task_checklist_items` created
- [ ] Frontend file updated on server
- [ ] Application rebuilt (`npm run build`)
- [ ] PM2 restarted
- [ ] Website accessible
- [ ] Checklist feature visible in "New Task" modal
- [ ] Can add checklist items
- [ ] Can check/uncheck items
- [ ] Can remove items
- [ ] Task creates successfully with checklist

---

## 🔧 Troubleshooting

**SSH Connection Issues?**
- Check your internet connection
- Verify Hostinger server is running
- Try accessing via Hostinger control panel instead

**SQL Errors?**
- Make sure you're connected to the right database
- Check if tables already exist
- Verify you have admin permissions

**Build Errors?**
- Check Node.js version: `node --version`
- Clear cache: `rm -rf .next`
- Reinstall: `npm install`

**PM2 Issues?**
- Check logs: `pm2 logs focus-project`
- Restart: `pm2 restart focus-project`
- Check status: `pm2 status`

---

## 📱 Quick Commands Reference

```bash
# SSH into server
ssh u704561835@154.56.55.56

# Navigate to project
cd domains/focus-project.co.uk/public_html

# Pull latest changes
git pull origin main

# Install & build
npm install && npm run build

# Restart app
pm2 restart focus-project

# Check status
pm2 status

# View logs
pm2 logs focus-project --lines 50

# Clear build cache
rm -rf .next && npm run build
```

---

**Ready to deploy?** Start with Step 1 (Database) now! 🚀

