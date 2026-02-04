# 🔄 Cache Clearing Guide

## Deployment Path (Single Location)
- **Directory:** /var/www/project_management/frontend
- **Service:** nextjs-pm
- **Port:** 3000
- **URL:** https://focus-project.co.uk

## Latest Changes Deployed
- Delete button on Kanban cards ✅
- List view (renamed from Table) ✅
- Current month auto-expanded ✅
- Projects sidebar ✅

## How to See Latest Changes

### Method 1: Incognito Mode (EASIEST)
1. Open Incognito/Private window: **Cmd+Shift+N** (Mac) or **Ctrl+Shift+N** (Windows)
2. Go to https://focus-project.co.uk
3. Login
4. You'll see ALL latest changes immediately

### Method 2: DevTools Hard Reload
1. Open site: https://focus-project.co.uk
2. Press **F12** to open DevTools
3. **Right-click** the reload button (⟳)
4. Select **"Empty Cache and Hard Reload"**

### Method 3: Clear All Site Data
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **"Storage"** in left sidebar
4. Click **"Clear site data"** button
5. Reload page

### Method 4: Nuclear Clear
1. Close ALL tabs of focus-project.co.uk
2. Press **Cmd+Shift+Delete**
3. Select **"All time"**
4. Check ALL boxes
5. Click "Clear data"
6. Reopen site

## Verification

After clearing cache, you should see:
- ✅ "Delete" button (red outline) on Kanban cards
- ✅ "List" tab (not "Table")
- ✅ "PROJECTS" section in sidebar
- ✅ Current month expanded in List view

## Why Cache is Sticky

Next.js aggressively caches:
- JavaScript bundles
- CSS files
- Static assets

Browser needs hard reload to fetch new files.

**Incognito mode is the most reliable way to see changes!**
