# Project Management System - Troubleshooting Guide

## Current Issue: All Functions Not Working

The user reported that all functions (create, update, delete, calendar, timetable) are not working. This guide will help identify and fix the root cause.

## Step 1: Proper Startup

### Frontend Development Server
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

The server should start on `http://localhost:3000` or `http://localhost:3001` if port 3000 is in use.

## Step 2: Debug Functions

### Open Debug Page
1. Open your browser to: `http://localhost:3001/debug-functions.html`
2. Follow the test sequence:
   - Test Supabase Connection
   - Test Login (admin@project.com)
   - Test Get Projects
   - Test Get Tasks

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for JavaScript errors
4. Look for failed network requests in Network tab

## Step 3: Common Issues & Fixes

### Issue 1: Environment Variables Missing
**Symptoms:** Supabase connection fails
**Fix:** Create `.env.local` file in frontend directory:
```
NEXT_PUBLIC_SUPABASE_URL=https://bayyefskgflbyyuwrlgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bTdgLqxQOmrWxdmE48ZZFfDkQ7vLdEYIHxMRU0w
NODE_ENV=development
```

### Issue 2: User Not Authenticated
**Symptoms:** Functions return empty arrays, access denied errors
**Fix:** 
1. Login at: `http://localhost:3001/login`
2. Use credentials: `admin@project.com` / `admin123`
3. Check if user data is stored in localStorage

### Issue 3: Database Relationship Errors
**Symptoms:** "Could not find relationship" errors
**Fix:** Already implemented in latest code updates
- Added error handling for member queries
- Added fallback for undefined data
- Transformed member data to expected format

### Issue 4: JavaScript Errors in Components
**Symptoms:** TypeError: Cannot read properties of undefined
**Fix:** Already implemented safety checks for:
- `project.members?.slice(0, 5)` 
- `task.tags_list?.slice(0, 3)`
- `dayTasks?.slice(0, 3)`

### Issue 5: Port Conflicts
**Symptoms:** Server won't start or can't connect
**Fix:** 
```bash
# Kill processes on port 3000/3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Restart development server
cd frontend && npm run dev
```

## Step 4: Component-Specific Debugging

### Project Detail Page
**Test:** Click on a project from dashboard
**Expected:** Should show project details, tasks, members
**Debug:** Check console for errors, verify project membership

### Task Creation
**Test:** Click "Add Task" button
**Expected:** Modal should open, form should submit
**Debug:** Check if `createTask` function is being called

### Calendar Page
**Test:** Navigate to calendar
**Expected:** Should show tasks by date
**Debug:** Check if `getUserTasks` is returning data

### My Tasks Page
**Test:** Navigate to my tasks
**Expected:** Should show user's assigned tasks
**Debug:** Check if user has tasks assigned

## Step 5: Database Verification

### Check User Membership
```sql
-- Run in Supabase SQL editor
SELECT 
  u.id, u.name, u.email,
  pm.project_id,
  p.name as project_name
FROM auth_user u
LEFT JOIN projects_project_members pm ON u.id = pm.user_id
LEFT JOIN projects_project p ON pm.project_id = p.id
WHERE u.email = 'your-email@example.com';
```

### Check Tasks Assignment
```sql
-- Run in Supabase SQL editor
SELECT 
  t.id, t.name, t.status,
  t.assignee_id,
  u.name as assignee_name,
  p.name as project_name
FROM projects_task t
LEFT JOIN auth_user u ON t.assignee_id = u.id
LEFT JOIN projects_project p ON t.project_id = p.id
WHERE t.assignee_id = YOUR_USER_ID;
```

## Step 6: Fixed Issues in Latest Update

✅ **Project Members Loading:** Added error handling and data transformation
✅ **Undefined Array Errors:** Added null/undefined checks with `?.slice()`
✅ **Database Relationship Queries:** Improved error handling and fallbacks
✅ **Member Data Format:** Standardized to use both `members` and `project_members`

## Step 7: Testing Checklist

- [ ] Development server starts without errors
- [ ] Can login successfully
- [ ] Dashboard shows projects (filtered by membership)
- [ ] Can click on projects to view details
- [ ] Can create new tasks
- [ ] Can update task status (drag & drop)
- [ ] Can delete tasks
- [ ] Calendar shows tasks by date
- [ ] My Tasks shows assigned tasks
- [ ] No JavaScript errors in console

## Step 8: If Issues Persist

1. **Clear Browser Cache:** Hard refresh (Ctrl+Shift+R)
2. **Clear localStorage:** 
   ```javascript
   localStorage.clear()
   ```
3. **Restart Development Server:**
   ```bash
   cd frontend
   npm run dev
   ```
4. **Check Network Tab:** Look for failed API calls
5. **Check Supabase Logs:** Go to Supabase dashboard > Logs

## Expected User Flow

1. **Login** → Stores user in localStorage
2. **Dashboard** → Fetches projects where user is a member
3. **Project Detail** → Fetches project + tasks + members for specific project
4. **Task Operations** → Create/Update/Delete tasks with proper access control
5. **Calendar** → Shows tasks from accessible projects by date
6. **My Tasks** → Shows all tasks assigned to the user

## Contact Points for Further Debug

- **Authentication:** Check `supabaseAuth.getUser()` response
- **Data Access:** Check `getCurrentUserId()` returns valid ID
- **Project Access:** Check user exists in `projects_project_members` table
- **Task Creation:** Check if project ID is passed correctly
- **Component Errors:** Check if all required props are passed to components 