#!/bin/bash

# 🚀 CLEAN SUPABASE DEPLOYMENT TO HOSTINGER
# This script deploys the direct Supabase version (frontend only)
# Run this on your Hostinger server: srv875725.hstgr.cloud

set -e  # Exit on any error

echo "🚀 Starting Clean Supabase Deployment to Hostinger..."
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

# STEP 1: Clean up any previous installations
print_step "1/7 - Cleaning up previous installations..."

# Stop and disable old services
systemctl stop nextjs-pm gunicorn-pm nginx 2>/dev/null || true
systemctl disable nextjs-pm gunicorn-pm 2>/dev/null || true

# Remove old files
rm -rf /var/www/project_management
rm -f /etc/systemd/system/nextjs-pm.service
rm -f /etc/systemd/system/gunicorn-pm.service
rm -f /etc/nginx/sites-enabled/project-management
rm -f /etc/nginx/sites-available/project-management

systemctl daemon-reload

print_status "Previous installations cleaned up"

# STEP 2: Update system and install dependencies
print_step "2/7 - Installing system dependencies..."

apt update
apt install -y curl git nginx nodejs npm

# Install latest Node.js (18.x LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

print_status "System dependencies installed"
print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# STEP 3: Clone and setup the application
print_step "3/7 - Cloning application..."

cd /var/www
git clone https://github.com/AlaxSwum/Project-Management.git project_management
cd project_management

# Use the clean commit
git reset --hard aca83e0c8f1cd5ff8ec68b8543d6e6b9e9922ae8

print_status "Application cloned and reset to clean version"

# STEP 4: Setup frontend
print_step "4/7 - Setting up frontend..."

cd frontend

# Install dependencies
npm install

# Create production environment file
cat > .env.production << 'EOF'
# Supabase Configuration (Direct Frontend Connection)
NEXT_PUBLIC_SUPABASE_URL=https://bayyefskgflbyyuwrlgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM

# App Configuration
NEXT_PUBLIC_APP_URL=https://srv875725.hstgr.cloud
NEXT_PUBLIC_APP_NAME=Project Management System

# Google Drive OAuth Configuration
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=AIzaSyChzMSr6Bmro1K4FQn6wzjhID_N-D2iBy4
NEXT_PUBLIC_GOOGLE_CLIENT_ID=242050942548-qaiplivs5qa975uvtbelam351pdioa49.apps.googleusercontent.com

# Production Settings
NODE_ENV=production
PORT=3000
EOF

# Build the application
npm run build

print_status "Frontend built successfully"

# STEP 5: Create systemd service for Next.js
print_step "5/7 - Creating Next.js service..."

cat > /etc/systemd/system/nextjs-pm.service << 'EOF'
[Unit]
Description=Project Management Next.js Application
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

# Set permissions
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

systemctl daemon-reload
systemctl enable nextjs-pm
systemctl start nextjs-pm

print_status "Next.js service created and started"

# STEP 6: Configure Nginx
print_step "6/7 - Configuring Nginx..."

cat > /etc/nginx/sites-available/project-management << 'EOF'
server {
    listen 80;
    server_name srv875725.hstgr.cloud localhost;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;

    # Proxy all requests to Next.js
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

    # Handle Next.js static files
    location /_next/static {
        alias /var/www/project_management/frontend/.next/static;
        expires 365d;
        access_log off;
    }

    # Handle public files
    location /public {
        alias /var/www/project_management/frontend/public;
        expires 30d;
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/project-management /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx

print_status "Nginx configured and restarted"

# STEP 7: Final checks
print_step "7/7 - Performing final checks..."

sleep 5

# Check service status
print_status "Service Status:"
systemctl status nextjs-pm --no-pager -l | head -10
systemctl status nginx --no-pager -l | head -5

# Test the application
if curl -f -s http://127.0.0.1:3000/ > /dev/null; then
    print_status "✅ Next.js application is responding"
else
    print_warning "⚠️  Next.js application might not be responding yet"
fi

if curl -f -s http://127.0.0.1/ > /dev/null; then
    print_status "✅ Nginx proxy is working"
else
    print_warning "⚠️  Nginx proxy might not be working yet"
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo "🌐 Your application is now available at:"
echo "   https://srv875725.hstgr.cloud"
echo ""
echo "📊 Application Details:"
echo "   • Frontend: Next.js with direct Supabase connection"
echo "   • Database: Supabase (bayyefskgflbyyuwrlgm.supabase.co)"
echo "   • Google Drive: OAuth integration included"
echo "   • Authentication: Custom using existing database"
echo ""
echo "🔧 Management Commands:"
echo "   • Restart frontend: systemctl restart nextjs-pm"
echo "   • View logs: journalctl -u nextjs-pm -f"
echo "   • Update code: cd /var/www/project_management && git pull && cd frontend && npm run build && systemctl restart nextjs-pm"
echo ""
echo "✅ Deployment successful! Your application is ready to use." 