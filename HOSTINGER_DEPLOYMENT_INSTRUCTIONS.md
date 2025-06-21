# 🚀 Hostinger Deployment Instructions

## Overview
This guide will deploy the **clean version** of your Project Management System to Hostinger with:
- ✅ Clean codebase from GitHub (commit: d394e696cb467d25947bc6efb2d79d36e465e18f)
- ✅ Supabase database integration
- ✅ Google Drive OAuth configured
- ✅ Full-stack deployment (Next.js + Django)
- ✅ Nginx reverse proxy

## Prerequisites

1. **Hostinger VPS Access**: SSH access to `srv875725.hstgr.cloud`
2. **Supabase Database**: Already configured with your credentials
3. **Google Drive OAuth**: Already configured with your API keys

## 🎯 One-Command Deployment

### Step 1: Upload Deployment Script
First, copy the deployment script to your Hostinger server:

```bash
# SSH into your Hostinger server
ssh root@srv875725.hstgr.cloud

# Download the deployment script directly from your local machine
# OR upload the deploy-hostinger-complete.sh file to your server
```

### Step 2: Run the Deployment

```bash
# Make the script executable and run it
chmod +x deploy-hostinger-complete.sh && ./deploy-hostinger-complete.sh
```

## 🔧 Alternative: Direct Download Method

If you prefer to download the script directly on the server:

```bash
# SSH into your Hostinger server
ssh root@srv875725.hstgr.cloud

# Download the clean repository
cd /tmp
git clone https://github.com/AlaxSwum/Project-Management.git temp_deploy
cd temp_deploy
git reset --hard d394e696cb467d25947bc6efb2d79d36e465e18f

# Copy and run the deployment script
cp deploy-hostinger-complete.sh /root/
chmod +x /root/deploy-hostinger-complete.sh
cd /root
./deploy-hostinger-complete.sh

# Clean up
rm -rf /tmp/temp_deploy
```

## 📋 What the Script Does

### 1. **System Setup** (Steps 1-2)
- Cleans up any previous installations
- Updates system packages
- Installs Node.js, Python, Git, Nginx

### 2. **Project Deployment** (Step 3)
- Clones the clean version from GitHub
- Resets to the specific commit: `d394e696cb467d25947bc6efb2d79d36e465e18f`
- Sets proper permissions

### 3. **Backend Configuration** (Steps 4-5)
- Sets up Python virtual environment
- Configures Supabase database connection
- Creates Django production settings
- Runs database migrations
- Creates admin user (admin@project.com / admin123)
- Sets up Gunicorn service

### 4. **Frontend Configuration** (Steps 6-7)
- Configures Google Drive OAuth
- Sets up production environment variables
- Builds the Next.js application
- Creates Next.js service

### 5. **Nginx Configuration** (Step 8)
- Sets up reverse proxy for both frontend and backend
- Configures SSL-ready setup
- Enables automatic service startup

## 🌐 Access Your Application

After deployment, your application will be available at:

- **Primary URL**: https://srv875725.hstgr.cloud
- **IP Fallback**: http://168.231.116.32

### Login Credentials
- **Email**: admin@project.com
- **Password**: admin123

## 🔑 Configuration Details

### Supabase Database
```env
DATABASE_URL=postgresql://postgres.bayyefskgflbyyuwrlgm:Swum2547@aws-0-us-west-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://bayyefskgflbyyuwrlgm.supabase.co
```

### Google Drive OAuth
```env
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=AIzaSyChzMSr6Bmro1K4FQn6wzjhID_N-D2iBy4
NEXT_PUBLIC_GOOGLE_CLIENT_ID=242050942548-qaiplivs5qa975uvtbelam351pdioa49.apps.googleusercontent.com
```

## 📊 Service Management

### Check Service Status
```bash
# Backend status
systemctl status gunicorn-pm

# Frontend status  
systemctl status nextjs-pm

# Nginx status
systemctl status nginx
```

### View Logs
```bash
# Backend logs
journalctl -u gunicorn-pm -f

# Frontend logs
journalctl -u nextjs-pm -f

# Nginx logs
tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
# Restart backend
systemctl restart gunicorn-pm

# Restart frontend
systemctl restart nextjs-pm

# Restart nginx
systemctl restart nginx

# Restart all
systemctl restart gunicorn-pm nextjs-pm nginx
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check Supabase credentials in `/var/www/project_management/backend/.env`
   - Verify network connectivity to Supabase

2. **Frontend Build Error**
   - Check Node.js version: `node --version` (should be 18+)
   - Rebuild: `cd /var/www/project_management/frontend && npm run build`

3. **Google OAuth Not Working**
   - Verify Google Cloud Console settings
   - Add https://srv875725.hstgr.cloud to authorized origins

4. **Service Not Starting**
   - Check logs: `journalctl -u [service-name] -f`
   - Verify file permissions: `chown -R www-data:www-data /var/www/project_management`

### File Locations
- **Backend**: `/var/www/project_management/backend/`
- **Frontend**: `/var/www/project_management/frontend/`
- **Nginx Config**: `/etc/nginx/sites-available/project-management`
- **Services**: `/etc/systemd/system/gunicorn-pm.service`, `/etc/systemd/system/nextjs-pm.service`

## 🚀 Next Steps

1. **SSL Certificate**: Set up Let's Encrypt for HTTPS
2. **Domain**: Configure your custom domain
3. **Monitoring**: Set up application monitoring
4. **Backups**: Configure automated backups

## 📞 Support

If you encounter any issues:
1. Check the service logs
2. Verify all environment variables
3. Ensure all services are running
4. Check Nginx configuration

## 🎉 Success!

Your clean Project Management System is now deployed with:
- ✅ Supabase database
- ✅ Google Drive OAuth
- ✅ Production-ready configuration
- ✅ Automatic service management
- ✅ Nginx reverse proxy

Access your application at: **https://srv875725.hstgr.cloud** 