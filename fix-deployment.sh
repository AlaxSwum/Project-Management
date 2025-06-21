#!/bin/bash

echo "🔧 Fixing PostgreSQL dependencies and completing deployment..."

# Install PostgreSQL development packages
apt install -y postgresql-server-dev-all libpq-dev python3-dev

# Continue with Python backend setup
cd /var/www/Project-Management/backend
source venv/bin/activate

# Install Python dependencies
pip install -r requirements_production.txt

# Set Django settings
export DJANGO_SETTINGS_MODULE=project_management.settings_production

# Test database connection
echo "🔍 Testing database connection..."
python manage.py check

# Run migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Create admin user
echo "👤 Creating admin user..."
cat > ../create_admin.py << 'EOF'
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
    print(f"✅ Admin user created: {email} / {password}")
else:
    print("ℹ️  Admin user already exists")
EOF

python ../create_admin.py

# Frontend setup
echo "🎨 Setting up frontend..."
cd /var/www/Project-Management/frontend

# Install Node.js dependencies
npm install

# Build for production
npm run build

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/project-management << 'EOF'
server {
    listen 80;
    server_name 168.231.116.32;
    
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
    
    # Frontend
    location / {
        root /var/www/Project-Management/frontend/.next/static;
        try_files $uri $uri/ @nextjs;
    }
    
    location @nextjs {
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

# Test and restart Nginx
nginx -t && systemctl restart nginx

# Create services
echo "⚙️ Creating system services..."

# Django service
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

# Next.js service
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
systemctl enable django-pm nextjs-pm nginx
systemctl start django-pm nextjs-pm

echo ""
echo "🎉 Deployment Complete!"
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
echo "🔧 Service status:"
systemctl status django-pm --no-pager -l
systemctl status nextjs-pm --no-pager -l
systemctl status nginx --no-pager -l
echo ""
echo "🎉 Enjoy your Project Management System!"
echo "===============================================" 