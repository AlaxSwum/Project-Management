# 🔒 Folder Access Control - Deployment Guide

## Overview
This feature implements **folder-level access control** so users only see folders they have permission to access.

---

## 🎯 What This Does

### Password Vault:
- ✅ Users only see folders where they have at least **one accessible password**
- ✅ Empty folders (no accessible passwords) are **hidden**
- ✅ Folder creators automatically get owner access
- ✅ Can manage folder members and permissions

### Content Calendar:
- ✅ Users only see folders they are **members of** or **created**
- ✅ Folders with no access are **hidden**
- ✅ Folder creators automatically get owner access
- ✅ Can manage folder members via "Manage Members" button

---

## 🚀 Deployment Steps

### Step 1: Run SQL in Supabase (REQUIRED!)

**IMPORTANT:** Use the FIXED version to avoid type errors!

1. **Open Supabase Dashboard:**
   - URL: https://supabase.com/dashboard
   - Select project: `bayyefskgflbyyuwrlgm`

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy & Run:**
   - Open file: `ADD_FOLDER_ACCESS_CONTROL_FIXED.sql`
   - Copy ALL contents
   - Paste into SQL Editor
   - Click "Run"

4. **Verify Success:**
   - You should see: ✅ FOLDER ACCESS CONTROL CONFIGURED!
   - Check the access counts in the summary

---

### Step 2: Deploy Frontend

The code has been updated automatically. Just deploy:

```bash
# From your local machine:
./deploy-from-local.sh

# Or SSH to Hostinger:
ssh root@srv875725.hstgr.cloud
cd /var/www/project_management
git pull origin main
systemctl restart nextjs-pm
```

---

## 📋 How It Works

### Password Vault Logic:

```
User opens Password Vault
    ↓
Fetch all folders
    ↓
For each folder:
  - Count passwords user can access
  - Check folder membership
    ↓
Show only folders where:
  - User created the folder, OR
  - User is a folder member, OR
  - User has at least 1 accessible password
    ↓
Empty folders = HIDDEN ✅
```

### Content Calendar Logic:

```
User opens Content Calendar
    ↓
Fetch all folders
    ↓
For each folder:
  - Check if user created it
  - Check folder memberships
    ↓
Show only folders where:
  - User created the folder, OR
  - User is a folder member
    ↓
No access folders = HIDDEN ✅
```

---

## 🔧 Database Tables Created

### 1. `password_vault_folder_access`
```sql
Columns:
- id (PRIMARY KEY)
- folder_id (INTEGER)
- user_id (INTEGER)
- permission_level ('owner'|'editor'|'viewer')
- can_view (BOOLEAN)
- can_edit (BOOLEAN)
- can_delete (BOOLEAN)
- can_manage_access (BOOLEAN)
- can_create_passwords (BOOLEAN)
```

### 2. `content_calendar_folder_members`
```sql
Columns:
- id (PRIMARY KEY)
- folder_id (INTEGER)
- user_id (INTEGER)
- role ('owner'|'editor'|'viewer')
- can_create (BOOLEAN)
- can_edit (BOOLEAN)
- can_delete (BOOLEAN)
- can_manage_members (BOOLEAN)
```

---

## 💻 Code Changes

### Password Vault (`frontend/src/app/password-vault/page.tsx`)

**Updated `fetchFolders()` function:**
- ✅ Counts accessible passwords per folder
- ✅ Checks folder membership
- ✅ Filters out folders with no access
- ✅ Only shows folders with at least 1 accessible item

### Content Calendar (`frontend/src/app/content-calendar/page.tsx`)

**Existing folder filtering (lines 230-263):**
- ✅ Already implements access control!
- ✅ Admins/Managers see all folders
- ✅ Regular users see only their folders
- ✅ Checks `content_calendar_folder_members` table

---

## 🧪 Testing Checklist

### Password Vault:
- [ ] Log in as User A
- [ ] Create a folder "User A Private"
- [ ] Add passwords to the folder
- [ ] Log in as User B
- [ ] Verify "User A Private" folder is **NOT visible** ✅
- [ ] User A manages folder → adds User B
- [ ] User B refreshes → folder now **visible** ✅

### Content Calendar:
- [ ] Log in as User A
- [ ] Create a folder "Marketing Team"
- [ ] Log in as User B (not a member)
- [ ] Verify "Marketing Team" folder is **NOT visible** ✅
- [ ] User A clicks "Manage Members" on folder
- [ ] User A adds User B as editor
- [ ] User B refreshes → folder now **visible** ✅

---

## 🎨 UI Features

### Password Vault:
- Folder count shows only accessible passwords
- Empty folders automatically hidden
- Can still manage folder members via folder settings

### Content Calendar:
- "Manage Members" button on each folder
- Add/remove folder members
- Set member roles (owner/editor/viewer)
- Permissions cascade to all content in folder

---

## 🔍 Permissions Levels

### Password Vault:
| Level | View | Edit | Delete | Manage Access | Create Passwords |
|-------|------|------|--------|---------------|------------------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ❌ | ❌ | ✅ |
| Viewer | ✅ | ❌ | ❌ | ❌ | ❌ |

### Content Calendar:
| Role | Create | Edit | Delete | Manage Members |
|------|--------|------|--------|----------------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ❌ | ❌ |
| Viewer | ❌ | ❌ | ❌ | ❌ |

---

## 📝 Managing Folder Access

### Password Vault:
1. Click on a folder
2. Click "Manage Folder Members" (if available)
3. Add users by email
4. Set their permission level
5. Save

### Content Calendar:
1. Hover over a folder
2. Click "Manage Members" button (👥 icon)
3. Add users by email
4. Set their role
5. Save

---

## 🐛 Troubleshooting

### Folders still showing for everyone:
- Run the SQL script in Supabase
- Clear browser cache
- Redeploy frontend

### Can't add folder members:
- Check `content_calendar_folder_members` table exists
- Verify RLS is disabled
- Check permissions granted

### Folder count is wrong:
- This is normal - count shows accessible items only
- Different users see different counts

---

## ⚠️ Important Notes

1. **Folder creators** are automatically added as owners
2. **Empty folders** (no accessible items) are hidden in Password Vault
3. **Content Calendar** requires explicit membership (except for admins/managers)
4. **Admins and managers** see all Content Calendar folders
5. **Database tables must exist** before frontend code works

---

## 🎯 User Experience

### Before:
- ❌ All users see all folders
- ❌ Can access folders they shouldn't
- ❌ No privacy control
- ❌ Cluttered folder list

### After:
- ✅ Users see only their folders
- ✅ Cannot access unauthorized folders
- ✅ Privacy protected
- ✅ Clean, personalized folder list
- ✅ Proper access management

---

## 📊 Summary

| Feature | Password Vault | Content Calendar |
|---------|----------------|------------------|
| Access Table | ✅ Created | ✅ Created |
| Folder Filtering | ✅ Implemented | ✅ Already exists |
| Auto-hide Empty | ✅ Yes | N/A |
| Member Management | ✅ UI exists | ✅ UI exists |
| RLS Disabled | ✅ Yes | ✅ Yes |

---

## 🔄 Next Steps

1. **Run SQL script** in Supabase (use FIXED version!)
2. **Deploy frontend** to Hostinger
3. **Test** with multiple users
4. **Manage folder access** as needed

---

Ready to deploy! Use `ADD_FOLDER_ACCESS_CONTROL_FIXED.sql` ✅

