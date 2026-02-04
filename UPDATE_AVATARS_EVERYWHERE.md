# Avatar System - Update All Components

This document tracks all the places where user avatars need to be displayed.

## ✅ Completed

1. **UserAvatar Component** - Created reusable component
2. **Sidebar** - User profile avatar
3. **Settings Page** - Profile avatar upload
4. **Project Header** - Team members avatars (using AvatarGroup)
5. **Kanban View** - Task assignee avatars

## 🔄 In Progress / To Update

### High Priority (User-Facing)
- [ ] **Timeline View** - Assignee avatars on timeline bars
- [ ] **Gantt Chart** - Team member avatars
- [ ] **Growth Map** - Member avatars with completion %
- [ ] **Project Members Modal** - All member avatars
- [ ] **Task Detail Modal** - Assignee selection with avatars
- [ ] **Comments Section** - Commenter avatars
- [ ] **Table View** - Assignee column avatars

### Medium Priority
- [ ] **Calendar View** - Meeting attendee avatars
- [ ] **My Tasks Page** - Task assignee avatars
- [ ] **Messages Page** - User avatars in chat
- [ ] **Notifications** - User who triggered notification

### Low Priority (Admin/Settings)
- [ ] **Dashboard** - Team member widgets
- [ ] **Reporting** - User assignment charts
- [ ] **Admin Page** - User management

## Component Update Pattern

```tsx
// OLD CODE (manual avatar)
<div style={{ 
  width: '32px', 
  height: '32px', 
  borderRadius: '50%', 
  background: '#8B5CF6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#FFF'
}}>
  {user.name.charAt(0)}
</div>

// NEW CODE (UserAvatar component)
<UserAvatar user={user} size="md" />

// FOR MULTIPLE USERS
<AvatarGroup users={members} max={3} size="sm" />
```

## Database Updates Required

All tables that reference users need to fetch `avatar_url`:

```sql
-- Example query update
SELECT 
  u.id, 
  u.name, 
  u.email, 
  u.role,
  u.avatar_url  -- ✅ ADD THIS
FROM auth_user u;
```

## Files to Update

1. `/app/projects/[id]/page.tsx` - Main project view ✅ Partially done
2. `/app/timeline/page.tsx` - Timeline view
3. `/app/calendar/page.tsx` - Calendar/meetings
4. `/app/my-tasks/page.tsx` - Personal tasks
5. `/app/messages/page.tsx` - Messages
6. `/app/notifications/page.tsx` - Notifications
7. `/components/TaskDetailModal.tsx` - Task details
8. `/components/ProjectMembersModal.tsx` - Team members
9. `/components/TaskInteractionSection.tsx` - Comments/activity

## Testing Checklist

- [ ] Upload avatar in settings
- [ ] Refresh page - avatar persists
- [ ] Avatar shows in sidebar
- [ ] Avatar shows in project header team list
- [ ] Avatar shows on Kanban task cards
- [ ] Avatar shows in timeline view
- [ ] Avatar shows in member modals
- [ ] Avatar shows in comments
- [ ] Avatar shows for all team members
- [ ] Fallback initials work when no avatar

## Next Steps

1. Update database queries to include `avatar_url`
2. Replace manual avatar divs with `<UserAvatar />` 
3. Use `<AvatarGroup />` for multiple users
4. Test across all views
5. Deploy to production
