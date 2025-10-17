# 🚀 Absence Management - Quick Start Guide

## 3 Simple Steps to Get Started

### Step 1: Setup Database (2 minutes)

1. Open your **Supabase SQL Editor**
2. Copy the contents of `create_employee_leave_management.sql`
3. Paste and **Run** the SQL
4. ✅ You should see: "Employee Leave Management System created successfully!"

### Step 2: Deploy Frontend (Optional - if rebuilding)

```bash
# For development
cd frontend
npm run dev

# For production
cd hostinger_deployment_v2
npm run build
```

*Skip this if you're already running the app*

### Step 3: Use the System (1 minute)

1. **Login** to your admin account
2. Go to **Admin Dashboard**
3. Click **"Absence Management"** tab
4. Click **"+ Set Employee Leave Allocation"**
5. Select an employee and save!

---

## 🎯 Quick Demo

### Set Your First Leave Allocation

1. Click `+ Set Employee Leave Allocation`
2. Select employee from dropdown
3. Use defaults or customize:
   - Annual: 10 days (max 3/request)
   - Sick: 24 days (max 7/month)
   - Casual: 6 days (max 2/month)
4. Click `Save Allocation`
5. ✅ See employee in the table!

### Add Your First Important Date

1. Click `+ Add Important Date`
2. Enter date (e.g., 2025-12-25)
3. Title: "Christmas"
4. Type: "Holiday"
5. Click `Add Date`
6. ✅ See the date card appear!

---

## 📋 Default Settings

| Leave Type | Days | Max Limit |
|------------|------|-----------|
| Annual | 10 | 3 days/request |
| Sick | 24 | 7 days/month |
| Casual | 6 | 2 days/month |

*You can change these for any employee!*

---

## 🎨 What You'll See

### Main View
```
┌─────────────────────────────────────────────┐
│  Employee Leave Management                  │
├─────────────────────────────────────────────┤
│  [+ Set Employee Leave]  [+ Add Date]       │
├─────────────────────────────────────────────┤
│  Employee Leave Balances (2025)             │
│  ┌────────────────────────────────────────┐ │
│  │ John Doe    10/10 📗  24/24 📘  6/6 📙 │ │
│  │ jane@...    Annual    Sick     Casual  │ │
│  └────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  Important Dates (No Leave Allowed)         │
│  ┌──────────────────┐ ┌──────────────────┐ │
│  │ Christmas        │ │ New Year         │ │
│  │ Dec 25, 2025     │ │ Jan 1, 2026      │ │
│  │ [HOLIDAY]        │ │ [HOLIDAY]        │ │
│  └──────────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## ✅ Checklist

- [ ] Database script run successfully
- [ ] Can see "Absence Management" tab
- [ ] Can open "Set Leave Allocation" modal
- [ ] Can select employees from dropdown
- [ ] Can save leave allocation
- [ ] Can see employee in the table
- [ ] Can add important dates
- [ ] Can delete important dates

---

## 🆘 Troubleshooting

**Can't see the tab?**
- Make sure you're logged in as admin
- Clear browser cache
- Check browser console for errors

**No employees in dropdown?**
- Run: `SELECT * FROM auth_user;` in Supabase
- Make sure users exist

**Can't save allocation?**
- Check Supabase connection
- Verify tables were created
- Check browser console

---

## 📚 More Info

- **Full Guide:** `DEPLOY_ABSENCE_MANAGEMENT.md`
- **Summary:** `ABSENCE_SYSTEM_SUMMARY.md`
- **Auto Deploy:** `./deploy-absence-system.sh`

---

**Ready?** Start with Step 1! 🎉

