# 🚀 Deploy Checklist Feature to focus-project.co.uk

## ⚡ Quick Deployment (10 minutes)

---

## STEP 1: Deploy Database to Supabase ✅

### What to do:
1. Open Supabase Dashboard: **https://supabase.com/dashboard**
2. Select your project
3. Go to **SQL Editor** → Click **"New query"**
4. Copy ALL the SQL from `COPY_SQL_HERE.sql` (it's open in your IDE!)
5. Paste into Supabase SQL Editor
6. Click **"RUN"** or press Cmd+Enter
7. Wait for success message: "✅ Task Checklist Feature deployed successfully!"

**✅ DONE!** Database is ready.

---

## STEP 2: Deploy Frontend to focus-project.co.uk 🌐

Since SSH is timing out, use **Hostinger Control Panel**:

### Option A: Using Hostinger File Manager (RECOMMENDED)

#### 1. Login to Hostinger
- Go to: **https://hpanel.hostinger.com**
- Enter your credentials

#### 2. Access File Manager
- Click on your **focus-project.co.uk** website
- Click **"File Manager"** button
- Or go to: **Files** → **File Manager**

#### 3. Navigate to the File
- Click through folders: 
  - `domains` 
  - → `focus-project.co.uk` 
  - → `public_html` 
  - → `src` 
  - → `app` 
  - → `personal`
- You should see `page.tsx`

#### 4. Update the File

**Method 1 - Upload (Easier):**
- Click **"Upload"** button at the top
- Select file from your computer:
  ```
  /Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/personal/page.tsx
  ```
- Click to upload
- Confirm overwrite when prompted
- ✅ File uploaded!

**Method 2 - Edit in Browser:**
- Right-click `page.tsx` → **"Edit"**
- Delete ALL existing content
- Open your local file: `hostinger_deployment_v2/src/app/personal/page.tsx`
- Copy ALL content (Cmd+A, Cmd+C)
- Paste into Hostinger editor
- Click **"Save"**
- ✅ File updated!

#### 5. Rebuild the Application

**In Hostinger Control Panel:**
- Find **"Terminal"** or **"SSH Access"** (usually under Advanced or Tools)
- Click to open web terminal
- Run these commands one by one:

```bash
cd domains/focus-project.co.uk/public_html
```
Press Enter, then:

```bash
npm run build
```
Wait for build to complete (1-2 minutes), then:

```bash
pm2 restart focus-project
```

**Check status:**
```bash
pm2 list
```

You should see `focus-project` with status "online" ✅

---

### Option B: Using FTP/SFTP Client (FileZilla, Cyberduck, etc.)

#### 1. Connect to Server
- **Host:** `154.56.55.56` or `focus-project.co.uk`
- **Username:** `u704561835`
- **Port:** `22` (for SFTP) or `21` (for FTP)
- **Protocol:** SFTP (recommended)

#### 2. Navigate Remote Folder
- Remote path: `/domains/focus-project.co.uk/public_html/src/app/personal/`

#### 3. Upload File
- Local file: `/Users/swumpyaesone/Documents/project_management/hostinger_deployment_v2/src/app/personal/page.tsx`
- Drag and drop to remote folder
- Confirm overwrite

#### 4. Rebuild
Use Hostinger Terminal (from Option A, step 5) to run:
```bash
cd domains/focus-project.co.uk/public_html
npm run build
pm2 restart focus-project
```

---

### Option C: Wait for SSH (Run this script when SSH works)

When SSH connection is working again:

```bash
cd /Users/swumpyaesone/Documents/project_management
./commands-to-run-when-ssh-works.sh
```

Or manually:
```bash
ssh u704561835@154.56.55.56 "cd domains/focus-project.co.uk/public_html && npm run build && pm2 restart focus-project"
```

---

## STEP 3: Test the Feature ✨

### Verify Deployment:

1. **Open your website:** https://focus-project.co.uk/personal

2. **Login** if needed

3. **Click "+ New Task"** button

4. **Look for "To-Do List (Optional)"** section - it should appear between "Color" and the buttons

5. **Test the feature:**
   - Type "Buy groceries" in the checklist input
   - Click **"Add"** or press Enter
   - Item should appear below
   - Type "Call dentist" and press Enter
   - Type "Finish report" and press Enter
   - Click checkboxes to mark items complete
   - Click "Remove" to delete an item
   - Fill in task title: "Weekend Tasks"
   - Click **"Create Task"**

6. **Success!** ✅ Your checklist feature is working!

---

## 📋 Deployment Checklist

Track your progress:

- [ ] **Database deployed** - SQL run in Supabase
- [ ] **File uploaded** - page.tsx updated on server
- [ ] **Application built** - `npm run build` completed
- [ ] **PM2 restarted** - App restarted successfully
- [ ] **Website accessible** - https://focus-project.co.uk/personal loads
- [ ] **Feature visible** - "To-Do List" section appears in new task modal
- [ ] **Can add items** - Items add successfully
- [ ] **Can check items** - Checkboxes work
- [ ] **Can remove items** - Remove button works
- [ ] **Task creates** - Task saves with checklist items
- [ ] **🎉 COMPLETE!**

---

## 🔧 Troubleshooting

### "Can't access Hostinger Control Panel"
- Verify credentials
- Try password reset if needed
- Contact Hostinger support: support@hostinger.com

### "SQL error in Supabase"
- Check you selected the correct project
- Verify you have admin permissions
- Try running in smaller sections if it fails

### "npm run build fails"
- Check for syntax errors in the code
- Try: `rm -rf .next && npm run build`
- Check Node.js version: `node --version` (should be 18+)

### "PM2 won't restart"
- Try: `pm2 delete focus-project`
- Then: `pm2 start npm --name focus-project -- start`
- Check logs: `pm2 logs focus-project`

### "Feature not showing on website"
- **Hard refresh** browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache completely
- Check browser console for errors (F12)
- Verify the file was uploaded correctly
- Make sure build completed successfully

### "Checklist items not saving"
- Check browser console (F12) for errors
- Verify SQL script ran successfully in Supabase
- Check Supabase logs for database errors
- Make sure table `task_checklist_items` exists

---

## 🎯 What This Feature Does

When creating a personal task, users can now:

✅ **Add unlimited checklist items**
- Type item text
- Press Enter or click "Add"
- Items appear in a clean list

✅ **Check off completed items**
- Click checkbox to mark complete
- Completed items show strikethrough
- Visual feedback for progress

✅ **Remove unwanted items**
- Click red "Remove" button
- Item disappears immediately

✅ **Save with task**
- All checklist items save automatically
- Stored in database
- Linked to the task

---

## 📱 After Deployment

Share with your team:
- "You can now add to-do lists when creating tasks!"
- "Break down big tasks into smaller steps"
- "Check off items as you complete them"

Example uses:
- Project planning (list all steps)
- Daily routines (morning/evening checklists)
- Shopping lists
- Meeting agendas
- Travel preparation

---

## 📂 Files Reference

All files in: `/Users/swumpyaesone/Documents/project_management/`

- **SQL to run:** `COPY_SQL_HERE.sql` ← Open in your IDE now
- **File to upload:** `hostinger_deployment_v2/src/app/personal/page.tsx`
- **Compressed package:** `checklist-feature-deployment.tar.gz`
- **This guide:** `DEPLOY_TO_FOCUS_PROJECT_NOW.md`
- **SSH script:** `commands-to-run-when-ssh-works.sh`

---

## ⏱️ Estimated Time

- Step 1 (Database): **2 minutes**
- Step 2 (Frontend): **5 minutes**
- Step 3 (Testing): **3 minutes**
- **Total: ~10 minutes**

---

## 🆘 Need Help?

**Browser Console Errors:**
- Press F12 → Console tab
- Look for red error messages
- Copy error text for troubleshooting

**Server Logs:**
```bash
pm2 logs focus-project --lines 50
```

**Check PM2 Status:**
```bash
pm2 status
pm2 describe focus-project
```

**Supabase Logs:**
- Dashboard → Logs → Select time range

---

**Ready? Start with Step 1 - the SQL file is already open!** 🚀

Copy the SQL → Paste in Supabase → Run → Done! ✅

