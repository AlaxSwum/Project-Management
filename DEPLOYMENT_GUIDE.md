# 🚀 Production Deployment Guide for Hostinger

This guide will help you deploy your Project Management System to Hostinger hosting.

## 📋 Prerequisites

### 1. Hostinger Account Setup
- **Hosting Plan**: Business or higher (supports Python/Django)
- **Domain**: Configured and pointing to your Hostinger hosting
- **SSL Certificate**: Enabled (free with Hostinger)

### 2. Database Setup
- **PostgreSQL** (recommended) or **MySQL** database
- Database credentials from Hostinger control panel

### 3. Required Services
- **Supabase** account (for authentication)
- **Google Cloud Console** (for Google Drive integration)
- **Email Service** (Gmail SMTP or other)

## 🔧 Step-by-Step Deployment

### Step 1: Prepare Environment Files

1. **Backend Environment Configuration**
   ```bash
   cd backend
   cp env.production.template .env.production
   ```

2. **Edit `.env.production` with your actual values:**
   ```env
   # Replace with your actual values
   SECRET_KEY=your-super-secret-production-key-here
   DEBUG=False
   ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
   
   # Database (from Hostinger control panel)
   DB_NAME=your_database_name
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_HOST=localhost
   DB_PORT=5432
   
   # JWT
   JWT_SECRET_KEY=your-jwt-secret-key
   
   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # CORS (your actual domains)
   CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   
   # Email
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   DEFAULT_FROM_EMAIL=noreply@yourdomain.com
   ```

3. **Frontend Environment Configuration**
   ```bash
   cd frontend
   cp env.production.template .env.production
   ```

4. **Edit frontend `.env.production`:**
   ```env
   NEXT_PUBLIC_API_URL=https://yourdomain.com/api
   NEXT_PUBLIC_AUTH_URL=https://yourdomain.com/api/auth
   NEXT_PUBLIC_FRONTEND_URL=https://yourdomain.com
   ```

### Step 2: Upload Files to Hostinger

1. **Using File Manager or FTP:**
   - Upload entire project to your domain's public_html folder
   - Ensure proper file permissions (644 for files, 755 for directories)

2. **Using Git (if available):**
   ```bash
   git clone https://github.com/AlaxSwum/Project-Management.git
   cd Project-Management
   ```

### Step 3: Set Up Backend

1. **Install Python Dependencies**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements_production.txt
   ```

2. **Configure Django Settings**
   ```bash
   export DJANGO_SETTINGS_MODULE=project_management.settings_production
   ```

3. **Run Database Migrations**
   ```bash
   python manage.py migrate
   ```

4. **Collect Static Files**
   ```bash
   python manage.py collectstatic --noinput
   ```

5. **Create Superuser (Optional)**
   ```bash
   python manage.py createsuperuser
   ```

### Step 4: Set Up Frontend

1. **Install Node.js Dependencies**
   ```bash
   cd frontend
   npm ci --production
   ```

2. **Build the Application**
   ```bash
   npm run build
   ```

### Step 5: Configure Web Server

#### For Apache (Hostinger default):

1. **Create `.htaccess` in public_html:**
   ```apache
   # Django Backend
   RewriteEngine On
   RewriteCond %{REQUEST_URI} ^/api/
   RewriteRule ^api/(.*)$ http://localhost:8000/api/$1 [P,L]
   
   # Static files for Django
   RewriteCond %{REQUEST_URI} ^/static/
   RewriteRule ^static/(.*)$ /backend/staticfiles/$1 [L]
   
   # Media files for Django
   RewriteCond %{REQUEST_URI} ^/media/
   RewriteRule ^media/(.*)$ /backend/media/$1 [L]
   
   # Next.js frontend (everything else)
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /frontend/.next/server/pages/index.html [L]
   
   # Security headers
   Header always set X-Frame-Options DENY
   Header always set X-Content-Type-Options nosniff
   Header always set Referrer-Policy strict-origin-when-cross-origin
   ```

2. **Start Django with Gunicorn:**
   ```bash
   cd backend
   source venv/bin/activate
   gunicorn --config gunicorn_config.py project_management.wsgi:application --daemon
   ```

### Step 6: SSL and Security Setup

1. **Enable SSL in Hostinger Control Panel**
2. **Update settings for HTTPS:**
   ```python
   # In settings_production.py
   SECURE_SSL_REDIRECT = True
   SESSION_COOKIE_SECURE = True
   CSRF_COOKIE_SECURE = True
   ```

3. **Update CORS and ALLOWED_HOSTS with HTTPS URLs**

## 🔧 Using the Deployment Script

For easier deployment, use the provided script:

```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

This script will:
- Check environment configuration
- Install dependencies
- Run migrations
- Collect static files
- Build frontend
- Test configuration

## 📊 Post-Deployment Checklist

### ✅ Immediate Tasks
- [ ] Test login/registration functionality
- [ ] Verify database connectivity
- [ ] Check static files are serving correctly
- [ ] Test API endpoints
- [ ] Verify email functionality
- [ ] Test Google Drive integration (if enabled)

### ✅ Security Tasks
- [ ] Change all default passwords
- [ ] Verify SSL certificate is working
- [ ] Test CORS configuration
- [ ] Review security headers
- [ ] Set up monitoring

### ✅ Performance Tasks
- [ ] Configure caching (Redis if available)
- [ ] Optimize database queries
- [ ] Set up CDN for static files (optional)
- [ ] Configure log rotation

## 🔍 Troubleshooting

### Common Issues

1. **500 Internal Server Error**
   - Check Django logs: `tail -f backend/logs/error.log`
   - Verify environment variables are set
   - Check database connectivity

2. **Static Files Not Loading**
   - Run `python manage.py collectstatic`
   - Check `.htaccess` configuration
   - Verify file permissions

3. **CORS Errors**
   - Update `CORS_ALLOWED_ORIGINS` in settings
   - Check frontend API URLs in `.env.production`

4. **Database Connection Error**
   - Verify database credentials
   - Check database server status
   - Ensure database exists

### Debug Mode (Temporary)
If needed for troubleshooting, temporarily enable debug mode:
```python
# In settings_production.py (ONLY FOR DEBUGGING)
DEBUG = True
ALLOWED_HOSTS = ['*']
```
**⚠️ Remember to disable debug mode after fixing issues!**

## 📈 Monitoring and Maintenance

### Log Files
- Django: `backend/logs/django.log`
- Errors: `backend/logs/error.log`
- Access: Check Hostinger control panel

### Database Backups
Set up regular database backups through Hostinger control panel.

### Updates
To update the application:
1. Pull latest changes from Git
2. Run migrations: `python manage.py migrate`
3. Collect static files: `python manage.py collectstatic`
4. Restart Gunicorn service

## 🆘 Support

### Resources
- **Hostinger Support**: Available 24/7 via live chat
- **Django Documentation**: https://docs.djangoproject.com/
- **Next.js Documentation**: https://nextjs.org/docs

### Project Support
If you encounter issues specific to this project:
1. Check the logs for error details
2. Review this deployment guide
3. Contact your development team

---

**🎉 Congratulations! Your Project Management System is now live in production!**

Access your application at: `https://yourdomain.com`
Admin panel: `https://yourdomain.com/admin` 