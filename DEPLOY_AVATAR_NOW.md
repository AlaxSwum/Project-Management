# 🚀 Deploy Avatar System - Step by Step

## ✅ Build Status: COMPLETED
Build finished at: Feb 4 23:04
Location: `frontend/.next/`

---

## 📋 STEP 1: Run Database Migration

Go to **Supabase Dashboard** → **SQL Editor** and run this:

```sql
-- Add avatar & profile columns to auth_user table
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS bio TEXT;

-- Grant permissions
GRANT SELECT, UPDATE ON auth_user TO authenticated;
```

✅ Click "Run" button
✅ You should see "Success. No rows returned"

---

## 📋 STEP 2: Deploy to Production Server

### Option A: Deploy via Git (Recommended)

```bash
cd /Users/swumpyaesone/Documents/project_management

# Stage all changes
git add frontend/src/contexts/AuthContext.tsx
git add frontend/src/app/settings/page.tsx
git add frontend/src/components/Sidebar.tsx
git add ADD_AVATAR_SUPPORT.sql
git add DEPLOY_AVATAR_SYSTEM.sh

# Commit
git commit -m "Add avatar upload system with persistence fix

- AuthContext now fetches full profile from database on login/refresh
- Settings page loads avatar_url, location, bio from database
- Sidebar displays user avatar from context
- Added database columns: avatar_url, location, bio
- Fixed avatar disappearing after page refresh"

# Push to repository
git push origin main
```

### Option B: Manual Deployment

If you're deploying to your server at `focus-project.co.uk`:

```bash
# SSH into your server
ssh your-server-user@focus-project.co.uk

# Navigate to project directory
cd /path/to/your/project

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Restart the application
pm2 restart focus-app
# OR
systemctl restart your-app-service
```

---

## 📋 STEP 3: Verify Deployment

1. **Go to your production site**: https://focus-project.co.uk/settings

2. **Upload an avatar**:
   - Click "Upload new image"
   - Select an image (max 5MB)
   - See "Avatar updated successfully!"

3. **Refresh the page** (Cmd+R or F5)

4. **Check avatar appears in**:
   - ✅ Settings page (avatar preview)
   - ✅ Sidebar (bottom left user profile)

5. **Test persistence**:
   - Logout and login again
   - Avatar should still be there
   - Open in incognito/private mode
   - Login and avatar should appear

---

## 🔍 Troubleshooting

### Avatar not showing after refresh?

Check browser console (F12) for these messages:
- `🔍 Profile fetch result:` - Shows database query
- `✅ User data with avatar: HAS AVATAR` - Confirms avatar loaded
- `🎨 Sidebar: User updated` - Sidebar received avatar

### Database error?

Check Supabase logs:
1. Go to Supabase Dashboard
2. Click "Logs" in sidebar
3. Look for errors related to `auth_user` table

### Still not working?

1. **Clear browser cache**: Cmd+Shift+R (hard refresh)
2. **Check database**: Verify `avatar_url` column exists
3. **Check user row**: Verify avatar data is saved
4. **Restart server**: Sometimes needed after deployment

---

## 📊 What Was Fixed

### Before:
- ❌ Avatar uploaded but disappeared on refresh
- ❌ AuthContext only loaded basic metadata from localStorage
- ❌ Settings page hardcoded empty avatar values
- ❌ Database columns missing

### After:
- ✅ Avatar persists after refresh
- ✅ AuthContext fetches full profile from database
- ✅ Settings page queries database for avatar/profile
- ✅ Sidebar displays avatar from user context
- ✅ Database has avatar_url, location, bio columns

---

## 🎯 Files Changed

1. `frontend/src/contexts/AuthContext.tsx` - Load full profile from DB
2. `frontend/src/app/settings/page.tsx` - Load and save profile data
3. `frontend/src/components/Sidebar.tsx` - Display avatar
4. `ADD_AVATAR_SUPPORT.sql` - Database migration

---

## 🔒 Security Notes

- Avatars stored as base64 in database (no file storage needed)
- Max file size: 5MB (enforced client-side)
- Supported formats: JPG, PNG, GIF
- RLS policies: Users can only update their own profile
- No Supabase Storage configuration needed

---

## 🎉 Success Checklist

- [ ] SQL migration run in Supabase
- [ ] Code deployed to production server
- [ ] Server restarted
- [ ] Avatar upload tested
- [ ] Page refresh tested
- [ ] Avatar appears in Settings
- [ ] Avatar appears in Sidebar
- [ ] Logout/login tested
- [ ] Avatar still persists

---

**Need help?** Check the console logs or contact support.
