# Task Checklist Feature - Quick Start Guide

## What's New? 🎉

Your personal tasks page now supports **To-Do Lists** (checklists)! When creating a new task, you can add multiple checklist items that you can tick off as you complete them.

## Quick Deployment (2 Minutes)

### 1. Deploy Database (1 minute)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Copy and paste this SQL:

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

ALTER TABLE task_checklist_items ENABLE ROW LEVEL SECURITY;

GRANT ALL ON task_checklist_items TO authenticated;
```

4. Click **Run** ✅

### 2. Deploy Frontend (1 minute)

**Option A - Automated Script:**
```bash
cd /Users/swumpyaesone/Documents/project_management
./deploy-checklist-feature.sh
```

**Option B - Manual Deployment:**
```bash
ssh u704561835@154.56.55.56
cd domains/focus-project.co.uk/public_html
git pull origin main
npm run build
pm2 restart focus-project
```

## How to Use

### Creating a Task with Checklist

1. Go to https://focus-project.co.uk/personal
2. Click **"+ New Task"**
3. Fill in task title and description
4. In the **"To-Do List"** section:
   - Type: "Research market trends" → Click **Add**
   - Type: "Create presentation" → Click **Add**
   - Type: "Review with team" → Click **Add**
5. Check off items as needed
6. Click **Create Task**

### Example Use Cases

**Project Planning:**
```
Task: Launch Marketing Campaign
Checklist:
☐ Design social media graphics
☐ Write email copy
☐ Schedule posts
☐ Review analytics
☐ Adjust strategy
```

**Daily Routine:**
```
Task: Morning Routine
Checklist:
☐ Check emails
☐ Review calendar
☐ Update task list
☐ Team standup
```

**Shopping/Errands:**
```
Task: Weekend Shopping
Checklist:
☐ Groceries
☐ Hardware store
☐ Pick up package
☐ Get gas
```

## Features

✅ **Add unlimited items** - No limit on checklist items
✅ **Simple interface** - Clean, easy to use design
✅ **Real-time updates** - Check/uncheck items instantly
✅ **Keyboard shortcuts** - Press Enter to add items quickly
✅ **Easy removal** - Remove items you don't need
✅ **Auto-save** - Items saved with the task automatically

## Visual Guide

```
┌─────────────────────────────────────┐
│  Create New Task                    │
├─────────────────────────────────────┤
│                                     │
│  Task Title: Launch Website        │
│                                     │
│  Description: ...                  │
│                                     │
│  To-Do List (Optional)             │
│  ┌──────────────────────┐  [Add]   │
│  │ Add checklist item... │          │
│  └──────────────────────┘          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ☑ Design homepage          │❌│ │
│  │ ☐ Setup hosting            │❌│ │
│  │ ☐ Configure domain         │❌│ │
│  │ ☐ Test all pages          │❌│ │
│  └─────────────────────────────┘   │
│                                     │
│           [Cancel]  [Create Task]   │
└─────────────────────────────────────┘
```

## Tips & Tricks

1. **Use Enter key** - Press Enter after typing to quickly add items
2. **Check before creating** - You can check off items even before saving the task
3. **Keep items short** - Brief items are easier to scan
4. **Use for any task** - Works great for shopping, projects, daily tasks, etc.
5. **Remove mistakes** - Click the red "Remove" button to delete items

## Troubleshooting

**Items not appearing?**
- Make sure you clicked "Add" or pressed Enter
- Check that you entered text in the input field

**Can't save task?**
- Ensure you filled in the required "Task Title"
- Check browser console for errors (F12)

**Database errors?**
- Verify you ran the SQL script in Supabase
- Check that the `task_checklist_items` table exists

**Frontend not updating?**
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Ensure the server was restarted after deployment

## File Locations

- **SQL Script**: `DEPLOY_TASK_CHECKLIST_FEATURE.sql`
- **Frontend Code**: `hostinger_deployment_v2/src/app/personal/page.tsx`
- **Deployment Script**: `deploy-checklist-feature.sh`
- **Full Guide**: `DEPLOY_TASK_CHECKLIST_FEATURE.md`

## Support

Need help? Check:
1. Browser console (F12) for frontend errors
2. Supabase logs for database errors
3. PM2 logs: `pm2 logs focus-project`

---

**Created**: October 20, 2025  
**Status**: ✅ Ready to Deploy  
**Estimated Setup Time**: 2 minutes

