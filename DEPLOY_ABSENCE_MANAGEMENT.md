# Absence Management System - Deployment Guide

## Overview

A complete employee leave/absence management system has been added to the Admin Dashboard with the following features:

### Leave Types & Limits

1. **Annual Leave**
   - Default: 10 days total per year
   - Maximum: 3 days per request
   - Customizable per employee

2. **Sick Leave**
   - Default: 24 days total per year
   - Maximum: 7 days per month
   - Customizable per employee

3. **Casual Leave**
   - Default: 6 days total per year
   - Maximum: 2 days per month
   - Customizable per employee

### Key Features

- ✅ Set custom leave allocations for each employee
- ✅ Track leave balances in real-time
- ✅ Define important dates where leave is not allowed
- ✅ Automatic validation of leave requests
- ✅ Beautiful, responsive UI matching your theme
- ✅ Color-coded leave types (Green for Annual, Blue for Sick, Orange for Casual)

## Deployment Steps

### Step 1: Deploy Database Tables

Run the following SQL script in your Supabase SQL Editor:

```bash
cat create_employee_leave_management.sql
```

**File:** `create_employee_leave_management.sql`

This creates:
- `employee_leave_allocations` - Stores leave allocation rules for each employee
- `leave_requests` - Stores leave requests (for future implementation)
- `important_dates` - Stores dates when leave is not allowed

### Step 2: Verify Database Tables

After running the SQL, verify tables were created:

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('employee_leave_allocations', 'leave_requests', 'important_dates');
```

You should see all three tables listed.

### Step 3: Deploy Frontend

The frontend code has been updated in both:
- `frontend/src/app/admin/page.tsx`
- `hostinger_deployment_v2/src/app/admin/page.tsx`

Deploy using your standard deployment process:

```bash
# If deploying to development
cd frontend
npm run build
npm run dev

# If deploying to production (Hostinger)
cd hostinger_deployment_v2
npm run build
# Then deploy dist folder to Hostinger
```

### Step 4: Test the System

1. **Login as Admin**
   - Navigate to Admin Dashboard
   - Click on "Absence Management" tab

2. **Set Employee Leave Allocation**
   - Click "+ Set Employee Leave Allocation"
   - Select an employee
   - Customize leave allocations
   - Save

3. **Add Important Dates**
   - Click "+ Add Important Date"
   - Add company holidays or important events
   - Save

4. **Verify Display**
   - Check that employee leave balances are displayed correctly
   - Verify important dates are showing properly

## UI Features

### Leave Allocations Table

Displays for each employee:
- Employee name and email
- Annual Leave: Remaining/Total (Max per request)
- Sick Leave: Remaining/Total (Max per month)
- Casual Leave: Remaining/Total (Max per month)

### Important Dates Cards

- Date formatted as "Weekday, Month Day, Year"
- Title and description
- Type badge (Holiday, Company Event, Meeting, Deadline)
- Delete button for management

### Modals

1. **Set Leave Allocation Modal**
   - Employee dropdown
   - Three sections for each leave type
   - Color-coded headers (Green, Blue, Orange)
   - Input validation

2. **Add Important Date Modal**
   - Date picker
   - Title and description fields
   - Type selector
   - Input validation

## Color Scheme (Matching Your Theme)

- **Primary (Orange/Gold)**: `#FFB333` - Used for main action buttons
- **Blue**: `#5884FD` - Used for secondary actions and Sick Leave
- **Green**: `#10B981` - Used for Annual Leave
- **Orange**: `#F59E0B` - Used for Casual Leave
- **Red**: `#EF4444` - Used for delete actions
- **Background**: `#F5F5ED` - Matches your global theme

## Database Schema Details

### employee_leave_allocations

```sql
- id (Primary Key)
- employee_id (Integer, unique per year)
- employee_name (Text)
- employee_email (Text)
- annual_leave_total (Default: 10)
- annual_leave_used (Default: 0)
- annual_leave_remaining (Computed)
- annual_leave_max_per_request (Default: 3)
- sick_leave_total (Default: 24)
- sick_leave_used (Default: 0)
- sick_leave_remaining (Computed)
- sick_leave_max_per_month (Default: 7)
- casual_leave_total (Default: 6)
- casual_leave_used (Default: 0)
- casual_leave_remaining (Computed)
- casual_leave_max_per_month (Default: 2)
- year (Current year)
- created_at, updated_at, created_by
```

### important_dates

```sql
- id (Primary Key)
- date (Date, Unique)
- title (Text)
- description (Text)
- type (company_event, holiday, meeting, deadline)
- created_at, created_by
```

### leave_requests

```sql
- id (Primary Key)
- employee_id, employee_name, employee_email
- leave_type (annual, sick, casual)
- start_date, end_date, days_requested
- reason, notes
- status (pending, approved, rejected)
- approved_by, approved_at, rejection_reason
- created_at, updated_at
```

## Validation Function

A PostgreSQL function `validate_leave_request()` has been created to:
- Check if dates fall on important dates
- Validate leave balance
- Enforce maximum days per request/month
- Return validation status with error messages

## Future Enhancements (Optional)

The system is designed to support:
- Employee self-service leave requests
- Approval workflow
- Leave calendar view
- Email notifications
- Leave history and reports
- Holiday calendar integration

## Troubleshooting

### Tables not created
```sql
-- Check if tables exist
\dt employee_leave_allocations
\dt leave_requests
\dt important_dates
```

### Permission issues
```sql
-- Grant permissions
GRANT ALL ON employee_leave_allocations TO authenticated;
GRANT ALL ON leave_requests TO authenticated;
GRANT ALL ON important_dates TO authenticated;
```

### Data not loading
- Check Supabase connection in browser console
- Verify auth_user table has employees
- Check that year matches current year

## Support

If you encounter any issues:
1. Check browser console for errors
2. Verify database connection
3. Ensure RLS is disabled on tables
4. Check that employee data exists in auth_user table

---

**System Created:** October 17, 2025  
**Version:** 1.0  
**Status:** ✅ Ready for Deployment



