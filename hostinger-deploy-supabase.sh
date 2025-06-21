#!/bin/bash

# 🚀 Hostinger Deployment Script - Supabase Frontend Only
# Run this script on your Hostinger server: 168.231.116.32

set -e  # Exit on any error

echo "🚀 Starting Supabase Frontend Deployment..."
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

# STEP 1: Update System and Install Node.js
print_step "1/6 - Installing Node.js and dependencies..."
apt update
apt install -y curl git

# Install latest Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt-get install -y nodejs

print_status "Software versions:"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"

# STEP 2: Clone/Update Project
print_step "2/6 - Setting up project files..."
cd /var/www

# Remove if exists
if [ -d "project_management" ]; then
    rm -rf project_management
fi

git clone https://github.com/AlaxSwum/Project-Management.git project_management
cd project_management/frontend

# Set permissions
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

print_status "Project files ready!"

# STEP 3: Configure Frontend Environment
print_step "3/6 - Configuring frontend environment..."

cat > .env.production << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bayyefskgflbyyuwrlgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM

# App Configuration  
NEXT_PUBLIC_APP_URL=http://168.231.116.32:3000
NEXT_PUBLIC_APP_NAME=Project Management System

# Production settings
NODE_ENV=production
PORT=3000
EOF

print_status "Environment configured for Supabase!"

# STEP 4: Install Dependencies and Build
print_step "4/6 - Installing dependencies and building..."

npm install

print_status "Building production version..."
npm run build

print_status "Frontend built successfully!"

# STEP 5: Create Next.js Service
print_step "5/6 - Creating Next.js system service..."

cat > /etc/systemd/system/nextjs-pm.service << 'EOF'
[Unit]
Description=Project Management Next.js App with Supabase
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

# Reload systemd and start service
systemctl daemon-reload
systemctl enable nextjs-pm
systemctl start nextjs-pm

print_status "Next.js service created and started!"

# STEP 6: Install and Configure Nginx (Optional - for port 80)
print_step "6/6 - Configuring Nginx proxy (optional)..."

apt install -y nginx

cat > /etc/nginx/sites-available/project-management << 'EOF'
server {
    listen 80;
    server_name 168.231.116.32;
    
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

print_status "Nginx proxy configured!"

# Final status check
print_step "Deployment Status Check..."
echo "🔍 Checking services..."

if systemctl is-active --quiet nextjs-pm; then
    print_status "✅ Next.js service is running"
else
    print_error "❌ Next.js service is not running"
fi

if systemctl is-active --quiet nginx; then
    print_status "✅ Nginx is running"
else
    print_error "❌ Nginx is not running"
fi

# Show service logs
echo ""
print_step "Service Logs (last 10 lines):"
echo "--- Next.js Logs ---"
journalctl -u nextjs-pm --no-pager -n 10

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "Your application is now running at:"
echo "🌐 http://168.231.116.32:3000 (Direct Next.js)"
echo "🌐 http://168.231.116.32 (Nginx Proxy)"
echo ""
echo "Login with: admin@project.com / admin123"
echo ""
echo "📋 Useful Commands:"
echo "- Check Next.js status: systemctl status nextjs-pm"
echo "- View Next.js logs: journalctl -u nextjs-pm -f"
echo "- Restart Next.js: systemctl restart nextjs-pm"
echo "- Check Nginx status: systemctl status nginx"
echo ""
echo "🔧 To make changes:"
echo "1. Update code: cd /var/www/project_management/frontend"
echo "2. Pull changes: git pull"
echo "3. Rebuild: npm run build"
echo "4. Restart: systemctl restart nextjs-pm" 