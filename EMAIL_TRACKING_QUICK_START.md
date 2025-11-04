# Email Tracking System - Quick Start Guide
## Rother Care Pharmacy

A clean, professional email and project tracking system without emojis.

---

## Quick Start (5 Minutes)

### Step 1: Deploy Database (2 minutes)

1. Open Supabase SQL Editor
2. Copy all content from `create_email_tracking_system.sql`
3. Paste and click "Run"
4. Wait for "Success" message

### Step 2: Access the System (1 minute)

1. Navigate to `/email-tracking` in your application
2. You should see the Email Tracking System interface

### Step 3: Create Your First Folder (1 minute)

1. Click "New Year Folder" button
2. Enter `2025`
3. Click OK
4. Select the 2025 folder from the dropdown

### Step 4: Add Your First Entry (1 minute)

1. With 2025 folder selected, click "Add New Entry"
2. Fill in:
   - From: sender name or email
   - Subject: brief description
   - Email Account: select from dropdown
3. Click "Add Entry"

Done! You're now tracking emails.

---

## Key Features at a Glance

### Folder Organization
```
2025 (Year)
  ├── January 2025 (Month)
  │   ├── Week 1 - Jan 2025
  │   └── Week 2 - Jan 2025
  └── February 2025 (Month)
      └── Week 1 - Feb 2025
```

### Entry Columns
| Column | Purpose | Type |
|--------|---------|------|
| Date | Entry date | Date picker |
| From | Sender name/email | Text |
| Subject | Email subject | Text |
| Remark | Internal note | Text |
| To Do | Action needed | Text |
| Final Remark | Outcome | Text |
| Folder Placed | File location | Text |
| Response | Reply text | Text |
| Email Account | Account used | Dropdown |
| Confirmed | Task completed | Checkbox |

### Quick Actions

**Add Entry**: Click "Add New Entry" button

**Filter Data**: Use filter boxes at top of each column

**Edit Entry**: Click "Edit" on any row, make changes, click "Save"

**Mark Complete**: Click checkbox in "Confirmed" column

**Delete Entry**: Click "Delete" button, confirm

**Clear Filters**: Click "Clear Filters" button

---

## Common Workflows

### Daily Email Review Workflow

1. Select today's folder (or current week)
2. Click "Add New Entry" for each email
3. Fill in From, Subject, To Do
4. Select Email Account
5. Leave Confirmed unchecked for pending items

### End of Day Workflow

1. Review all entries with Confirmed = unchecked
2. Add Final Remark for completed items
3. Check Confirmed box
4. Leave unfinished items unchecked for tomorrow

### Weekly Review Workflow

1. Select the week folder
2. Filter by Confirmed = "Pending"
3. Review outstanding items
4. Update or close as needed

### Monthly Archive Workflow

1. Click "Archive Data" button
2. Select date from last month
3. Confirm archive
4. Old confirmed entries are moved to archive

---

## Filter Examples

### Show only finance emails
- Email Account filter: Select "accounts@"

### Show pending items
- Confirmed filter: Select "Pending"

### Show this week's entries
- From Date: 2025-01-01
- To Date: 2025-01-07

### Find specific sender
- From filter: Type sender name
- Results update automatically

### Combine filters
- Date: Select specific date
- Email Account: Select account
- Confirmed: Select status
- All filters work together

---

## Access Control Quick Reference

### Grant Access to Team Member

1. Select folder
2. Click "Manage Access"
3. Enter user ID
4. Select level:
   - VIEWER: Read only
   - EDITOR: Can edit
   - ADMIN: Full control
5. Click "Grant"

### Revoke Access

1. Click "Manage Access"
2. Find user in list
3. Click "Revoke"
4. Confirm

---

## Email Account Management

### Add New Email Account

1. Click "Add Email Account"
2. Fill in:
   - Account Name: e.g., "billing@"
   - Full Email: e.g., "billing@rothercare.com"
   - Description: Optional note
3. Click "Add Account"

Account immediately appears in all dropdowns.

---

## Tips and Best Practices

### Organization
- Create month folders at the start of each month
- Use week folders for high-volume periods
- Keep folder structure simple and consistent

### Data Entry
- Fill in From and Subject at minimum
- Use To Do for actionable items
- Use Remark for context/notes
- Use Final Remark for outcomes
- Check Confirmed when fully resolved

### Filtering
- Use date range for weekly/monthly reviews
- Combine filters to narrow results
- Clear filters to see all entries
- Save common filter combinations mentally

### Access Control
- Grant minimum necessary access
- Use VIEWER for read-only stakeholders
- Use EDITOR for day-to-day users
- Reserve ADMIN for supervisors
- Review access quarterly

### Archiving
- Archive confirmed entries monthly
- Keep archive cutoff at 90 days
- Archived data remains queryable via SQL
- Never delete, always archive

---

## Troubleshooting

### Can't see folders
- Verify you created a year folder
- Check you have access permissions
- Contact admin if needed

### Can't add entries
- Verify folder is selected
- Check you have EDITOR access
- Verify From and Subject are filled

### Filters not working
- Click "Clear Filters" first
- Ensure data exists in selected folder
- Try refreshing browser

### Email account dropdown empty
- Add email accounts using "Add Email Account"
- Check accounts exist in database
- Refresh page

---

## Default Email Accounts

The system comes with these pre-configured accounts:

- accounts@rothercare.com (Accounts and Finance)
- support@rothercare.com (Customer Support)
- marketing@rothercare.com (Marketing)
- admin@rothercare.com (Administration)
- info@rothercare.com (General Inquiries)

Add more as needed using "Add Email Account" button.

---

## Keyboard Shortcuts

### Navigation
- Tab: Move between fields
- Enter: Submit forms (in modals)
- Esc: Close modals (standard browser behavior)

### Editing
- Click field: Start editing (when in edit mode)
- Tab: Next field
- Shift+Tab: Previous field

---

## Mobile Usage

The system is fully responsive and works on mobile devices:

- Touch to select folders
- Swipe to scroll table horizontally
- Tap to edit entries
- Pinch to zoom (if needed)

---

## Data Export

To export data, use Supabase SQL Editor:

```sql
SELECT * FROM email_tracking_entries
WHERE folder_id = 'your-folder-id'
ORDER BY entry_date DESC;
```

Or create a custom report:

```sql
SELECT 
  entry_date as "Date",
  from_sender as "From",
  subject as "Subject",
  to_do as "To Do",
  confirmed as "Status"
FROM email_tracking_entries
WHERE entry_date >= '2025-01-01'
ORDER BY entry_date DESC;
```

---

## Support

For detailed information, see:
- Full deployment guide: `DEPLOY_EMAIL_TRACKING_SYSTEM.md`
- Database schema: `create_email_tracking_system.sql`
- Source code: `frontend/src/app/email-tracking/page.tsx`

For technical support, contact your system administrator.

---

## System Summary

**Purpose**: Track and manage incoming emails and communications

**Key Benefit**: Organized, searchable, accessible communication history

**Best For**: Finance teams, customer support, admin teams

**Time to Setup**: 5 minutes

**Time to Learn**: 10 minutes

**Maintenance**: Minimal (monthly archiving recommended)

---

**Get Started Now**: Create your first year folder and add an entry!

