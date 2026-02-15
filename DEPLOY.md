# Deployment Guide

## What's in this project

- **FocusApp-Swift/** - macOS Focus app (latest version: v2.0.40)
- **hostinger_deployment_v2/** - Website for focus-project.co.uk
- **migrations/** - Database migration SQL files

## How to deploy website to Hostinger

```bash
cd hostinger_deployment_v2
npm run build
```

Then upload the contents to your Hostinger server via FTP or cPanel File Manager:
- Upload `hostinger_deployment_v2/.next/` folder
- Upload `hostinger_deployment_v2/public/` folder  
- Upload `hostinger_deployment_v2/src/` folder
- Make sure environment variables are set on the server

## Latest improvements deployed

1. **No more sidebar refresh** - Projects stay loaded when navigating
2. **Real-time messages** - New messages appear instantly without refresh
3. **Global message notifications** - Message popups appear on any page
4. **10x faster loading** - Lightweight access checks instead of full queries
5. **Delete projects** - Trash icon on each project in sidebar
6. **Persistent sidebar** - One sidebar for all pages, smooth navigation

## Performance

- Projects load once and persist: ~50ms
- Access checks: ~5ms (was ~500ms before)
- Messages: real-time with Supabase subscriptions
- Navigation: instant client-side routing
