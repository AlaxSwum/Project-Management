# 🚀 MANUAL DEPLOYMENT GUIDE - Personal Tasks Fix

## Target Website: https://srv875725.hstgr.cloud/personal

## ✅ What's Ready for Deployment:
- **Package**: `hostinger_personal_tasks_fix.tar.gz` (40MB)
- **Fixes**: Time blocks loading, personal tasks errors, removed duration field
- **Database**: Already updated (confirmed by you)

---

## 📋 DEPLOYMENT STEPS:

### **Step 1: Access Hostinger Control Panel**
1. Login to your Hostinger control panel
2. Go to **File Manager**
3. Navigate to your website directory (usually `public_html` or similar)

### **Step 2: Upload the Fix**
1. Upload `hostinger_personal_tasks_fix.tar.gz` to your website root
2. Extract the file (right-click → Extract)
3. This will update all the necessary files

### **Step 3: Restart Application**
1. If you have SSH access, run: `pm2 restart all`
2. Or restart your Node.js application through Hostinger control panel
3. If no restart option, the changes should take effect automatically

### **Step 4: Test the Fix**
1. Visit: https://srv875725.hstgr.cloud/personal
2. Check that personal tasks load without errors
3. Verify time blocks work correctly
4. Test creating a task (no duration field required)

---

## 🔧 ALTERNATIVE: File-by-File Upload

If the tar.gz doesn't work, upload these key files manually:

### **Critical Files to Update:**
```
src/lib/personal-calendar-service.ts
src/app/my-personal/page.tsx
.next/ (entire folder - contains built application)
```

### **File Locations in Package:**
- Source files: `hostinger_deployment/src/`
- Built files: `hostinger_deployment/.next/`
- Static assets: `hostinger_deployment/public/`

---

## 🎯 WHAT THIS FIXES:

✅ **"Failed to load time blocks"** - Fixed table queries
✅ **400/406 HTTP errors** - Corrected database access
✅ **Duration field removed** - Task creation simplified
✅ **Personal tasks system** - Now uses dedicated tables

---

## 📞 If You Need Help:

1. **Check browser console** for any remaining errors
2. **Verify database tables** exist: `personal_tasks`, `personal_events`
3. **Clear browser cache** after deployment
4. **Check server logs** if issues persist

---

## 🌐 Expected Result:

After deployment, https://srv875725.hstgr.cloud/personal should:
- Load personal tasks without errors
- Display time blocks correctly
- Allow task creation without duration field
- Show no 400/406 errors in browser console

**The deployment package is ready to upload!** 🚀
