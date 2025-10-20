# 🚀 Manual Deployment Guide - Task Checklist Feature

## Current Situation
SSH connection is timing out. Use this manual deployment method instead.

---

## ✅ STEP 1: Deploy Database (5 minutes)

### Go to Supabase:
1. Open: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** → **New Query**
4. Copy the SQL from: `COPY_SQL_HERE.sql` (opened in your IDE)
5. Paste and click **RUN**
6. Wait for success message ✅

---

## ✅ STEP 2: Deploy Frontend via Hostinger Control Panel

### Method A: Via Hostinger File Manager (EASIEST)

1. **Login to Hostinger**
   - Go to: https://hpanel.hostinger.com
   - Login with your credentials

2. **Open File Manager**
   - Click on your website
   - Click "File Manager" 
   - Navigate to: `domains/focus-project.co.uk/public_html/src/app/personal/`

3. **Update page.tsx**
   - **Option 1 - Upload**: 
     - Click "Upload"
     - Select file: `hostinger_deployment_v2/src/app/personal/page.tsx`
     - Overwrite existing file
   
   - **Option 2 - Edit in Browser**:
     - Right-click `page.tsx` → Edit
     - Delete all content
     - Copy entire content from your local: `hostinger_deployment_v2/src/app/personal/page.tsx`
     - Paste and Save

4. **Rebuild Application**
   - In Hostinger, click "Terminal" or "SSH Access"
   - Run these commands:
   ```bash
   cd domains/focus-project.co.uk/public_html
   npm run build
   pm2 restart focus-project
   ```

### Method B: Via FTP/SFTP (FileZilla, Cyberduck, etc.)

1. **Connect via SFTP**
   - Host: `154.56.55.56`
   - Username: `u704561835`
   - Port: `22`
   - Protocol: SFTP

2. **Navigate to**:
   - Remote path: `/domains/focus-project.co.uk/public_html/src/app/personal/`

3. **Upload File**:
   - Local file: `hostinger_deployment_v2/src/app/personal/page.tsx`
   - Drag and drop to replace existing `page.tsx`

4. **Rebuild** (via Hostinger Terminal):
   ```bash
   cd domains/focus-project.co.uk/public_html
   npm run build
   pm2 restart focus-project
   ```

### Method C: Wait for SSH and Use Git

When SSH is working again:

```bash
# From your local machine
cd /Users/swumpyaesone/Documents/project_management

# Commit changes
git add .
git commit -m "Add task checklist feature"
git push origin main

# SSH to server (when working)
ssh u704561835@154.56.55.56

# On server
cd domains/focus-project.co.uk/public_html
git pull origin main
npm install
npm run build
pm2 restart focus-project
pm2 logs focus-project --lines 20
```

---

## ✅ STEP 3: Verify Deployment

1. Visit: **https://focus-project.co.uk/personal**
2. Click **"+ New Task"**
3. Look for **"To-Do List (Optional)"** section
4. Test adding checklist items:
   - Type "Test item 1" → Click Add
   - Type "Test item 2" → Press Enter
   - Check/uncheck boxes
   - Click Remove on an item
5. Create the task
6. Success! ✅

---

## 📦 Files You Need

All files are in: `/Users/swumpyaesone/Documents/project_management/`

- **Database**: `COPY_SQL_HERE.sql` ← Run in Supabase
- **Frontend**: `hostinger_deployment_v2/src/app/personal/page.tsx` ← Upload to server
- **Package**: `checklist-feature-deployment.tar.gz` ← Compressed version

---

## 🔧 Troubleshooting

### "Can't connect to Hostinger"
- Check internet connection
- Try Hostinger control panel instead of SSH
- Contact Hostinger support if server is down

### "SQL errors in Supabase"
- Make sure you're in the correct project
- Check you have admin permissions
- Try running the SQL in smaller chunks

### "Build fails on server"
- Check Node version: `node --version` (should be 18+)
- Clear cache: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`

### "PM2 not restarting"
- Check PM2 status: `pm2 status`
- Try: `pm2 delete focus-project && pm2 start npm --name focus-project -- start`
- Check logs: `pm2 logs focus-project`

### "Feature not showing up"
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check console for errors (F12)
- Verify file was uploaded correctly
- Make sure you ran `npm run build`

---

## 🎯 Quick Checklist

- [ ] Step 1: SQL script run in Supabase ✅
- [ ] Step 2a: File uploaded to Hostinger
- [ ] Step 2b: Built with `npm run build`
- [ ] Step 2c: Restarted with `pm2 restart`
- [ ] Step 3: Tested on website
- [ ] Feature is working! 🎉

---

## 💡 Tips

- **Use Hostinger File Manager** - Easiest method when SSH is down
- **Check PM2 logs** - `pm2 logs focus-project` shows errors
- **Clear .next cache** - If build issues: `rm -rf .next`
- **Browser cache** - Hard refresh after deployment

---

## 🆘 Need Help?

If you get stuck:
1. Check browser console (F12) for frontend errors
2. Check PM2 logs: `pm2 logs focus-project --lines 50`
3. Check Supabase logs in dashboard
4. Try deployment in Hostinger control panel instead of SSH

---

**Created**: October 20, 2025  
**Status**: Ready for Manual Deployment  
**Estimated Time**: 10 minutes

