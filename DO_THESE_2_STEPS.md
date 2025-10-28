# ✅ DO THESE 2 STEPS TO DEPLOY

Your code is **already pushed to GitHub**! Just do these 2 simple steps:

---

## STEP 1: Deploy Database (2 minutes) 🗄️

1. Open **Supabase**: https://supabase.com/dashboard
2. Go to **SQL Editor** → Click **"New query"**
3. **Copy ALL this SQL** and paste it:

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

4. Click **"RUN"**
5. ✅ **DONE!**

---

## STEP 2: Deploy to focus-project.co.uk (3 minutes) 🚀

### Option A: Via Hostinger Control Panel Terminal

1. Login: **https://hpanel.hostinger.com**
2. Click **"Terminal"** or **"SSH Access"**
3. **Copy and paste this ONE command:**

```bash
cd domains/focus-project.co.uk/public_html && git pull origin main && npm install && npm run build && pm2 restart focus-project && echo "✅ DEPLOYMENT COMPLETE!"
```

4. Press **Enter** and wait (takes 1-2 minutes)
5. ✅ **DONE!**

---

### Option B: Step by Step (if Option A doesn't work)

In Hostinger Terminal, run ONE command at a time:

```bash
cd domains/focus-project.co.uk/public_html
```
Press Enter, then:

```bash
git pull origin main
```
Press Enter, then:

```bash
npm run build
```
Wait for build (1-2 minutes), then:

```bash
pm2 restart focus-project
```
Press Enter, then:

```bash
pm2 list
```

You should see `focus-project` with status **"online"** ✅

---

## STEP 3: Test! 🎉

1. Visit: **https://focus-project.co.uk/personal**
2. Click **"+ New Task"**
3. You'll see **"To-Do List (Optional)"** section!
4. Try it:
   - Add item: "Test checklist" → Click Add
   - Add item: "Another item" → Press Enter
   - Check the boxes ✅
   - Click Remove to delete
   - Fill task title and click "Create Task"
5. **SUCCESS!** 🎉

---

## What You're Getting:

✨ **To-Do List Feature** for personal tasks:
- Add unlimited checklist items
- Check off completed items
- Clean, simple interface
- Auto-saves with task

---

## Troubleshooting:

**SQL errors?**
- Make sure you copied the ENTIRE SQL above
- Check you're in the right Supabase project

**Git pull fails?**
- Try: `git reset --hard origin/main` then `git pull`

**Build fails?**
- Try: `rm -rf .next && npm run build`

**PM2 won't restart?**
- Try: `pm2 delete focus-project`
- Then: `pm2 start npm --name focus-project -- start`

**Feature not showing?**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear browser cache

---

## ⏱️ Total Time: ~5 minutes

- Step 1: 2 minutes
- Step 2: 3 minutes
- Step 3: 30 seconds to test

---

**Ready? Start with Step 1!** 🚀

The SQL is also in the file `COPY_SQL_HERE.sql` (already open in your IDE).






