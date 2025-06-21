#!/bin/bash

# 🚀 Complete Hostinger VPS Deployment Script
# Run this script on your Hostinger server: 168.231.116.32

set -e  # Exit on any error

echo "🚀 Starting Project Management System Deployment..."
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

# STEP 1: Update System
print_step "1/10 - Updating system packages..."
apt update && apt upgrade -y

# STEP 2: Install Required Software
print_step "2/10 - Installing required software..."
apt install -y python3 python3-pip python3-venv nodejs npm nginx git curl

# Install latest Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt-get install -y nodejs

print_status "Software versions:"
echo "Python: $(python3 --version)"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"

# STEP 3: Clone Project
print_step "3/10 - Cloning project from GitHub..."
cd /var/www

# Remove if exists
if [ -d "Project-Management" ]; then
    rm -rf Project-Management
fi

git clone https://github.com/AlaxSwum/Project-Management.git
cd Project-Management

# Set permissions
chown -R www-data:www-data /var/www/Project-Management
chmod -R 755 /var/www/Project-Management

print_status "Project cloned successfully!"

# STEP 4: Configure Backend Environment
print_step "4/10 - Configuring backend environment..."
cd /var/www/Project-Management/backend

# Create backend environment file with actual credentials
cat > .env.production << 'EOF'
# Django Configuration
SECRET_KEY=django-insecure-super-secret-production-key-SpsSps2003@A123-random-key-2024
DEBUG=False
ALLOWED_HOSTS=168.231.116.32

# Supabase Database
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=SpsSps2003@A123
SUPABASE_DB_HOST=db.bayyefskgflbyyuwrlgm.supabase.co
SUPABASE_DB_PORT=5432

# JWT Configuration
JWT_SECRET_KEY=jwt-super-secret-key-SpsSps2003@A123-production-2024

# Supabase Auth
SUPABASE_URL=https://bayyefskgflbyyuwrlgm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://168.231.116.32

# Email Configuration (optional)
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=noreply@168.231.116.32

# SSL Configuration
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
EOF

print_status "Backend environment configured!"

# STEP 5: Update Django Settings for Supabase
print_step "5/10 - Updating Django production settings..."

# Backup original settings
cp project_management/settings_production.py project_management/settings_production.py.backup

# Create new production settings
cat > project_management/settings_production.py << 'EOF'
"""
Production settings for project_management project.
Optimized for Hostinger VPS with Supabase database.
"""

import os
from pathlib import Path
from decouple import config
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

# Production allowed hosts
ALLOWED_HOSTS = ['168.231.116.32', 'localhost', '127.0.0.1']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # Local apps
    'projects',
    'authentication',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'project_management.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'project_management.wsgi.application'

# Database - Supabase PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('SUPABASE_DB_NAME', default='postgres'),
        'USER': config('SUPABASE_DB_USER'),
        'PASSWORD': config('SUPABASE_DB_PASSWORD'),
        'HOST': config('SUPABASE_DB_HOST'),
        'PORT': config('SUPABASE_DB_PORT', default='5432'),
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'authentication.User'

# Custom Authentication Backend
AUTHENTICATION_BACKENDS = [
    'authentication.backends.SupabaseAuthBackend',
]

# Django REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'authentication.jwt_auth.SupabaseJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': False,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': config('JWT_SECRET_KEY'),
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',

    'JTI_CLAIM': 'jti',

    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://168.231.116.32",
]

CORS_ALLOW_CREDENTIALS = True

# Supabase Configuration
SUPABASE_URL = config('SUPABASE_URL')
SUPABASE_ANON_KEY = config('SUPABASE_ANON_KEY')

# Security Settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Session Configuration
SESSION_COOKIE_AGE = 86400
SESSION_COOKIE_HTTPONLY = True

# File Upload Settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880
EOF

print_status "Django settings updated for Supabase!"

# STEP 6: Set Up Python Backend
print_step "6/10 - Setting up Python backend..."

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements_production.txt

# Set Django settings
export DJANGO_SETTINGS_MODULE=project_management.settings_production

# Test database connection
print_status "Testing database connection..."
python manage.py check

# Run migrations
print_status "Running database migrations..."
python manage.py migrate

# Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput

print_status "Backend setup complete!"

# STEP 7: Configure Frontend
print_step "7/10 - Setting up frontend..."
cd /var/www/Project-Management/frontend

# Create frontend environment
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=http://168.231.116.32/api
NEXT_PUBLIC_AUTH_URL=http://168.231.116.32/api/auth
NEXT_PUBLIC_FRONTEND_URL=http://168.231.116.32
NODE_ENV=production
EOF

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install

# Build for production
print_status "Building frontend for production..."
npm run build

# Create output for static serving
if [ ! -d "out" ]; then
    mkdir -p out
    cp -r .next/static out/ 2>/dev/null || true
    cp -r public/* out/ 2>/dev/null || true
fi

print_status "Frontend setup complete!"

# STEP 8: Configure Nginx
print_step "8/10 - Configuring Nginx web server..."

cat > /etc/nginx/sites-available/project-management << 'EOF'
server {
    listen 80;
    server_name 168.231.116.32;
    
    # Frontend root
    root /var/www/Project-Management/frontend/.next;
    
    # Frontend static files
    location /_next/static/ {
        alias /var/www/Project-Management/frontend/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Django static files
    location /static/ {
        alias /var/www/Project-Management/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Django media files
    location /media/ {
        alias /var/www/Project-Management/backend/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Frontend pages
    location / {
        try_files $uri $uri.html @frontend;
    }
    
    location @frontend {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/project-management /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

print_status "Nginx configured and started!"

# STEP 9: Create Django Service
print_step "9/10 - Creating Django service..."

cat > /etc/systemd/system/django-pm.service << 'EOF'
[Unit]
Description=Project Management Django App
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/Project-Management/backend
Environment=DJANGO_SETTINGS_MODULE=project_management.settings_production
ExecStart=/var/www/Project-Management/backend/venv/bin/gunicorn --bind 127.0.0.1:8000 --workers 3 project_management.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Create Frontend Service
cat > /etc/systemd/system/nextjs-pm.service << 'EOF'
[Unit]
Description=Project Management Next.js App
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/Project-Management/frontend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
systemctl daemon-reload
systemctl enable django-pm
systemctl enable nextjs-pm
systemctl start django-pm
systemctl start nextjs-pm

print_status "Services created and started!"

# STEP 10: Final Setup
print_step "10/10 - Final setup and verification..."

# Create admin user script
cat > /var/www/Project-Management/create_admin.py << 'EOF'
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings_production')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

email = 'admin@project.com'
name = 'Admin User'
password = 'admin123'

if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(email, name, password)
    print(f"Admin user created: {email} / {password}")
else:
    print("Admin user already exists")
EOF

cd /var/www/Project-Management/backend
source venv/bin/activate
python ../create_admin.py

# Check services status
echo ""
print_status "🔍 Service Status Check:"
systemctl status django-pm --no-pager -l
systemctl status nextjs-pm --no-pager -l
systemctl status nginx --no-pager -l

# Check if ports are listening
echo ""
print_status "🔍 Port Status Check:"
netstat -tlnp | grep :8000 || echo "Port 8000 not listening"
netstat -tlnp | grep :3000 || echo "Port 3000 not listening"
netstat -tlnp | grep :80 || echo "Port 80 not listening"

# Test API endpoint
echo ""
print_status "🔍 API Test:"
curl -s http://localhost/api/ || echo "API not responding"

echo ""
print_status "🎉 Deployment Complete!"
echo ""
echo "==============================================="
echo "🌐 Your Project Management System is ready!"
echo "==============================================="
echo ""
echo "📍 Website: http://168.231.116.32"
echo "🔧 Admin Panel: http://168.231.116.32/admin"
echo "📊 API: http://168.231.116.32/api"
echo ""
echo "👤 Admin Login:"
echo "   Email: admin@project.com"
echo "   Password: admin123"
echo ""
echo "🔧 Services:"
echo "   Django: systemctl status django-pm"
echo "   Next.js: systemctl status nextjs-pm"
echo "   Nginx: systemctl status nginx"
echo ""
echo "📋 To restart services:"
echo "   systemctl restart django-pm"
echo "   systemctl restart nextjs-pm"
echo "   systemctl restart nginx"
echo ""
echo "==============================================="
echo "🎉 Enjoy your new Project Management System!"
echo "===============================================" 