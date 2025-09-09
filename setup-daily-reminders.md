# Daily Task Reminder Setup

This document explains how to set up automated daily task reminders using the notification system.

## Option 1: Using Vercel Cron Jobs (Recommended for Vercel deployments)

1. Create a `vercel.json` file in your project root:

```json
{
  "crons": [
    {
      "path": "/api/send-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This will run the reminder job every day at 9 AM UTC.

## Option 2: Using GitHub Actions (Free option)

1. Create `.github/workflows/daily-reminders.yml`:

```yaml
name: Daily Task Reminders

on:
  schedule:
    - cron: '0 9 * * *' # 9 AM UTC daily
  workflow_dispatch: # Allow manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send Task Reminders
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/send-reminders" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

2. Add these secrets to your GitHub repository:
   - `APP_URL`: Your deployed app URL (e.g., `https://your-app.vercel.app`)
   - `CRON_SECRET`: A secure secret key for authentication

## Option 3: Using External Cron Services

### Using cron-job.org (Free)

1. Sign up at https://cron-job.org
2. Create a new cron job with:
   - URL: `https://your-app.vercel.app/api/send-reminders`
   - Schedule: `0 9 * * *` (daily at 9 AM)
   - HTTP Method: POST
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

### Using EasyCron

1. Sign up at https://www.easycron.com
2. Create a new cron job with similar settings

## Option 4: Server-based Cron (If you have a server)

Add to your server's crontab:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 9 AM)
0 9 * * * curl -X POST "https://your-app.vercel.app/api/send-reminders" -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Environment Variables

Make sure to set these environment variables in your deployment:

```env
# For cron job authentication
CRON_SECRET=your-secure-secret-key-here

# Brevo API key
BREVO_API_KEY=your-brevo-api-key-here

# Your app URL for links in emails
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
```

## Testing the Setup

You can manually trigger the reminder job by calling:

```bash
curl -X POST "https://your-app.vercel.app/api/send-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

Or test the notification system:

```bash
curl -X POST "https://your-app.vercel.app/api/test-notifications" \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "testType": "task-reminder"}'
```

## Monitoring

- Check your deployment logs to see if the cron job is running
- Monitor email delivery through Brevo dashboard
- Check the notifications table in your database

## Customization

You can customize the reminder timing by:

1. Editing the cron schedule (e.g., `0 8 * * *` for 8 AM)
2. Modifying the `sendTaskReminderNotifications()` function to change which tasks get reminders
3. Updating email templates in the Brevo service

## Security Notes

- Keep your `CRON_SECRET` secure and unique
- Use HTTPS for all cron job URLs
- Regularly rotate your secrets
- Monitor for unauthorized access to your cron endpoints
