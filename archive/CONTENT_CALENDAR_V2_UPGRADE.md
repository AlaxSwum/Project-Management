# Content Calendar V2 - Multi-Business Workspace Upgrade

## Overview

This upgrade transforms the existing Content Calendar into a full-featured multi-business content management system with:

1. **Multi-Business Workspaces** - Separate calendars, members, and reports per business
2. **Non-Duplicated Cross-Platform Posts** - Single post → multiple platform targets
3. **Persistent Calendar UI** - Split layout with calendar always visible
4. **Weekly/Monthly KPI Reporting** - Per-platform metrics and top performing posts
5. **Campaigns & Templates** - Organize content into campaigns
6. **Workflow & Approvals** - Status workflow from idea to published

---

## File Structure

```
/migrations/
├── 001_content_calendar_v2_schema.sql     # New database schema
└── 002_migrate_existing_content_calendar_data.sql  # Data migration

/frontend/src/
├── types/
│   └── content-calendar.ts                # TypeScript type definitions
├── hooks/
│   └── useContentCalendar.ts              # React hooks for data fetching
├── lib/
│   └── content-calendar-api.ts            # Supabase API functions
├── components/content-calendar/
│   ├── index.ts                           # Component exports
│   ├── Calendar.tsx                       # Calendar component
│   ├── PostDrawer.tsx                     # Post details drawer
│   ├── KPIDashboard.tsx                   # KPI reporting dashboard
│   └── BusinessSelector.tsx               # Business workspace selector
└── app/content-calendar-v2/
    └── page.tsx                           # Main refactored page
```

---

## Installation Steps

### Step 1: Run Database Migration

Execute in Supabase SQL Editor:

```sql
-- First, run the schema migration
\i migrations/001_content_calendar_v2_schema.sql

-- Then, migrate existing data
\i migrations/002_migrate_existing_content_calendar_data.sql
```

### Step 2: Update Sidebar Navigation

Add to `Sidebar.tsx`:

```tsx
{ name: 'Content Calendar V2', href: '/content-calendar-v2', icon: CalendarIcon }
```

### Step 3: Test the New System

1. Navigate to `/content-calendar-v2`
2. Create or select a business
3. Create a new post with multiple platforms
4. Verify the post appears on the calendar
5. Test the KPI dashboard

---

## Key Features Explained

### 1. Multi-Business Workspaces

Each business has:
- Its own content calendar
- Separate team members with roles (owner, manager, editor, viewer)
- Independent campaigns and reports

### 2. Single Post → Multiple Targets

**Before (Old System):**
```
content_calendar:
- Row 1: "Product Launch" → Facebook
- Row 2: "Product Launch" → Instagram  (DUPLICATE!)
- Row 3: "Product Launch" → Twitter    (DUPLICATE!)
```

**After (New System):**
```
content_posts:
- Row 1: "Product Launch" (single source of truth)

content_post_targets:
- Row 1: post_id=1, platform=facebook
- Row 2: post_id=1, platform=instagram
- Row 3: post_id=1, platform=twitter
```

### 3. Persistent Calendar UI

The calendar is always visible on the left side. When you click a post:
- A drawer slides in from the right
- You can view, edit, or change status
- The calendar stays mounted (no disappearing)
- On mobile: drawer is full-screen overlay

### 4. KPI Reporting

Weekly and Monthly summaries include:
- Total posts, reach, impressions
- Engagement breakdown (reactions, comments, shares, saves)
- Net follower growth
- Average engagement rate and CTR
- Top performing posts ranked by engagement

### 5. Workflow States

Posts progress through these states:
```
idea → draft → design → review → approved → scheduled → published → reported
```

---

## API Usage Examples

### Create a Post

```typescript
import { postApi } from '@/lib/content-calendar-api';

const post = await postApi.createPost({
  business_id: 1,
  title: "New Product Launch",
  caption: "Excited to announce...",
  content_type: "image",
  planned_publish_at: "2025-01-15T10:00:00Z",
  platforms: ["facebook", "instagram", "twitter"],
  owner_id: 1,
  checklist_items: [
    "Write caption",
    "Create visual",
    "Get approval"
  ]
});
```

### Update Post Status

```typescript
await postApi.updateStatus(postId, 'approved');
```

### Get KPIs

```typescript
import { metricsApi } from '@/lib/content-calendar-api';

const weeklyKPIs = await metricsApi.getWeeklyKPIs(businessId, {
  platform: 'instagram',
  date_from: '2025-01-01'
});
```

---

## Data Migration Notes

The migration script:
1. Creates a "Default Business" for existing content
2. Migrates all `content_calendar_members` to `business_members`
3. Creates a "Migrated Content" campaign
4. Converts each `content_calendar` item to a `content_post` with target
5. Maps old statuses to new workflow states

**Status Mapping:**
- `planning` → `idea`
- `in_progress` → `draft`
- `review` → `review`
- `completed` → `published`

**Content Type Mapping:**
- `Video Content`, `Video` → `video`
- `Graphic`, `Image`, `Post`, `Content` → `image`
- `Article` → `article`
- `Story` → `story`
- `Reel` → `reel`

---

## Rollback Plan

If you need to revert:

1. The old `content_calendar` tables are NOT deleted
2. Simply update `Sidebar.tsx` to use the old `/content-calendar` route
3. Drop new tables if needed:

```sql
DROP TABLE IF EXISTS content_activity_log CASCADE;
DROP TABLE IF EXISTS monthly_plan_templates CASCADE;
DROP TABLE IF EXISTS content_templates CASCADE;
DROP TABLE IF EXISTS content_post_approvals CASCADE;
DROP TABLE IF EXISTS content_post_checklist CASCADE;
DROP TABLE IF EXISTS content_post_metrics CASCADE;
DROP TABLE IF EXISTS content_post_targets CASCADE;
DROP TABLE IF EXISTS content_posts CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS business_members CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
```

---

## Future Enhancements

1. **Social Media API Integration** - Auto-publish to platforms
2. **AI Caption Generation** - Generate captions with AI
3. **Bulk Scheduling** - Schedule multiple posts at once
4. **Advanced Analytics** - More detailed reporting
5. **Content Library** - Reusable media assets
6. **Team Notifications** - Email/push notifications for approvals

---

## Support

For issues or questions, check:
- Console errors in browser DevTools
- Supabase logs for database errors
- Network tab for API failures
