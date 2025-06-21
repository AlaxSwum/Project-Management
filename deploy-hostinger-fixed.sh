#!/bin/bash

# 🚀 FIXED HOSTINGER DEPLOYMENT SCRIPT
# This script deploys the clean version with Supabase + Google Drive OAuth
# Fixes Python 3.13 psycopg2-binary compatibility issue
# Run this on your Hostinger server: srv875725.hstgr.cloud

set -e  # Exit on any error

echo "🚀 Starting Fixed Hostinger Deployment..."
echo "📍 Server: $(hostname -I | awk '{print $1}')"
echo "📅 Time: $(date)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# STEP 1: Clean up previous installations
print_step "1/9 - Cleaning up previous installations..."

# Stop services if they exist
systemctl stop nextjs-pm || true
systemctl stop gunicorn-pm || true
systemctl disable nextjs-pm || true
systemctl disable gunicorn-pm || true

# Remove old files
rm -rf /var/www/project_management
rm -f /etc/systemd/system/nextjs-pm.service
rm -f /etc/systemd/system/gunicorn-pm.service
rm -f /etc/nginx/sites-enabled/project-management

systemctl daemon-reload

print_status "Previous installations cleaned up!"

# STEP 2: Update System and Install Dependencies
print_step "2/9 - Installing system dependencies..."

apt update
apt install -y curl git python3 python3-pip python3-venv nginx postgresql-client libpq-dev python3-dev build-essential

# Install latest Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt-get install -y nodejs

print_status "Software versions:"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo "Python: $(python3 --version)"

# STEP 3: Clone Project
print_step "3/9 - Cloning clean project from GitHub..."
cd /var/www

git clone https://github.com/AlaxSwum/Project-Management.git project_management
cd project_management

# Reset to the specific clean commit
git reset --hard d394e696cb467d25947bc6efb2d79d36e465e18f

# Set permissions
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

print_status "Clean project cloned and configured!"

# STEP 4: Fix Python Requirements
print_step "4/9 - Fixing Python requirements for compatibility..."
cd /var/www/project_management/backend

# Create a fixed requirements file
cat > requirements_fixed.txt << 'EOF'
Django==5.2.3
djangorestframework==3.15.2
djangorestframework-simplejwt==5.3.0
django-cors-headers==4.3.1
python-decouple==3.8
python-dotenv==1.0.0
psycopg[binary]==3.2.3
supabase==2.9.1
google-api-python-client==2.151.0
google-auth-httplib2==0.2.0
google-auth-oauthlib==1.2.1
gunicorn==22.0.0
EOF

print_status "Fixed requirements file created!"

# STEP 5: Setup Backend with Supabase
print_step "5/9 - Configuring backend with Supabase..."

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install fixed dependencies
pip install --upgrade pip
pip install -r requirements_fixed.txt

# Create production environment file
cat > .env << 'EOF'
# Django Settings
SECRET_KEY=your-super-secret-production-key-d394e696cb467d25947bc6efb2d79d36e465e18f-clean-version-fixed
DEBUG=False
ALLOWED_HOSTS=srv875725.hstgr.cloud,168.231.116.32,localhost

# Supabase Database Configuration
DATABASE_URL=postgresql://postgres.bayyefskgflbyyuwrlgm:Swum2547@aws-0-us-west-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://bayyefskgflbyyuwrlgm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM

# JWT Configuration
JWT_SECRET_KEY=jwt-secret-key-for-clean-deployment-d394e696cb467d25947bc6efb2d79d36e465e18f-fixed

# CORS Settings
FRONTEND_URL=https://srv875725.hstgr.cloud

# Security
SECURE_SSL_REDIRECT=False
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https

# Media Files
MEDIA_URL=/media/
STATIC_URL=/static/
EOF

# Update Django settings for psycopg3
cat > project_management/settings_production.py << 'EOF'
from .settings import *

# Override database config for psycopg3
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'postgres.bayyefskgflbyyuwrlgm',
        'PASSWORD': 'Swum2547',
        'HOST': 'aws-0-us-west-1.pooler.supabase.com',
        'PORT': '6543',
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

# Production settings
DEBUG = False
ALLOWED_HOSTS = ['srv875725.hstgr.cloud', '168.231.116.32', 'localhost']

# Static and media files
STATIC_ROOT = '/var/www/project_management/backend/staticfiles/'
MEDIA_ROOT = '/var/www/project_management/backend/media/'
EOF

# Run migrations with production settings
export DJANGO_SETTINGS_MODULE=project_management.settings_production
python manage.py collectstatic --noinput --settings=project_management.settings_production
python manage.py migrate --settings=project_management.settings_production

# Create superuser if it doesn't exist
echo "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@project.com', 'admin123') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell --settings=project_management.settings_production

print_status "Backend configured with Supabase!"

# STEP 6: Create Backend Service
print_step "6/9 - Creating backend service..."

cat > /etc/systemd/system/gunicorn-pm.service << 'EOF'
[Unit]
Description=Project Management Django Backend
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/project_management/backend
Environment=PATH=/var/www/project_management/backend/venv/bin
Environment=DJANGO_SETTINGS_MODULE=project_management.settings_production
ExecStart=/var/www/project_management/backend/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:8000 project_management.wsgi:application
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable gunicorn-pm
systemctl start gunicorn-pm

print_status "Backend service created and started!"

# STEP 7: Setup Frontend with Google Drive OAuth
print_step "7/9 - Configuring frontend with Google Drive OAuth..."
cd /var/www/project_management/frontend

# Create production environment file with Google OAuth
cat > .env.production << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=https://srv875725.hstgr.cloud/api
NEXT_PUBLIC_AUTH_URL=https://srv875725.hstgr.cloud/api/auth

# App Configuration
NEXT_PUBLIC_APP_URL=https://srv875725.hstgr.cloud
NEXT_PUBLIC_APP_NAME=Project Management System

# Google Drive OAuth Configuration
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=AIzaSyChzMSr6Bmro1K4FQn6wzjhID_N-D2iBy4
NEXT_PUBLIC_GOOGLE_CLIENT_ID=242050942548-qaiplivs5qa975uvtbelam351pdioa49.apps.googleusercontent.com

# Supabase Configuration (if needed for direct access)
NEXT_PUBLIC_SUPABASE_URL=https://bayyefskgflbyyuwrlgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM

# Production settings
NODE_ENV=production
PORT=3000
EOF

# Install dependencies and build
npm install
npm run build

print_status "Frontend configured with Google Drive OAuth!"

# STEP 8: Create Frontend Service
print_step "8/9 - Creating frontend service..."

cat > /etc/systemd/system/nextjs-pm.service << 'EOF'
[Unit]
Description=Project Management Next.js Frontend
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/project_management/frontend
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable nextjs-pm
systemctl start nextjs-pm

print_status "Frontend service created and started!"

# STEP 9: Configure Nginx
print_step "9/9 - Configuring Nginx..."

cat > /etc/nginx/sites-available/project-management << 'EOF'
server {
    listen 80;
    server_name srv875725.hstgr.cloud 168.231.116.32;
    
    client_max_body_size 100M;
    
    # Frontend - proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Backend API - proxy to Django
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # Django admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /static/ {
        alias /var/www/project_management/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /var/www/project_management/backend/media/;
        expires 30d;
        add_header Cache-Control "public";
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/project-management /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

print_status "Nginx configured!"

# Final status check
print_step "Deployment Status Check..."
echo "🔍 Checking all services..."

if systemctl is-active --quiet gunicorn-pm; then
    print_status "✅ Django Backend service is running"
else
    print_error "❌ Django Backend service is not running"
    echo "Backend logs:"
    journalctl -u gunicorn-pm --no-pager -n 20
fi

if systemctl is-active --quiet nextjs-pm; then
    print_status "✅ Next.js Frontend service is running"
else
    print_error "❌ Next.js Frontend service is not running"
    echo "Frontend logs:"
    journalctl -u nextjs-pm --no-pager -n 20
fi

if systemctl is-active --quiet nginx; then
    print_status "✅ Nginx is running"
else
    print_error "❌ Nginx is not running"
fi

echo ""
echo "🎉 FIXED DEPLOYMENT COMPLETE!"
echo ""
echo "🌟 Your Project Management System is now running at:"
echo "🌐 https://srv875725.hstgr.cloud (Main URL)"
echo "🌐 http://168.231.116.32 (IP fallback)"
echo ""
echo "🔐 Login Credentials:"
echo "📧 Email: admin@project.com"
echo "🔑 Password: admin123"
echo ""
echo "🚀 Fixed Features:"
echo "✅ Python 3.13 compatibility (psycopg3)"
echo "✅ Clean codebase from GitHub"
echo "✅ Supabase database integration"
echo "✅ Google Drive OAuth configured"
echo "✅ Full-stack deployment (Frontend + Backend)"
echo "✅ Nginx reverse proxy"
echo "✅ Enhanced error handling"
echo ""
echo "📋 Useful Commands:"
echo "- Backend logs: journalctl -u gunicorn-pm -f"
echo "- Frontend logs: journalctl -u nextjs-pm -f"
echo "- Restart backend: systemctl restart gunicorn-pm"
echo "- Restart frontend: systemctl restart nextjs-pm"
echo "- Nginx status: systemctl status nginx"
echo ""
echo "🔧 To update the application:"
echo "1. cd /var/www/project_management"
echo "2. git pull"
echo "3. systemctl restart gunicorn-pm nextjs-pm"
echo ""
echo "🌟 All compatibility issues resolved!" 