#!/bin/bash

# 🚀 SIMPLE SUPABASE DEPLOYMENT TO HOSTINGER
# This script deploys the direct Supabase version (frontend only)
# Works around Node.js package conflicts

set -e  # Exit on any error

echo "🚀 Starting Simple Supabase Deployment to Hostinger..."
echo "📍 Server: $(hostname -I | awk '{print $1}')"
echo "📅 Time: $(date)"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# STEP 1: Clean up previous installation
print_step "1/5 - Cleaning up previous installation..."

systemctl stop nextjs-pm gunicorn-pm 2>/dev/null || true
systemctl disable nextjs-pm gunicorn-pm 2>/dev/null || true
rm -rf /var/www/project_management
rm -f /etc/systemd/system/nextjs-pm.service
rm -f /etc/systemd/system/gunicorn-pm.service

print_status "Previous installation cleaned up"

# STEP 2: Install npm if needed
print_step "2/5 - Setting up Node.js environment..."

# Check if npm exists
if ! command -v npm &> /dev/null; then
    print_status "Installing npm..."
    # Remove conflicting packages and install npm
    apt remove -y nodejs npm 2>/dev/null || true
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# STEP 3: Clone and setup application
print_step "3/5 - Cloning application..."

cd /var/www
git clone https://github.com/AlaxSwum/Project-Management.git project_management
cd project_management/frontend

print_status "Application cloned"

# STEP 4: Setup frontend
print_step "4/5 - Building frontend..."

# Create production environment file
cat > .env.production << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bayyefskgflbyyuwrlgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM

# App Configuration
NEXT_PUBLIC_APP_URL=https://srv875725.hstgr.cloud
NEXT_PUBLIC_APP_NAME=Project Management System

# Google Drive OAuth
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=AIzaSyChzMSr6Bmro1K4FQn6wzjhID_N-D2iBy4
NEXT_PUBLIC_GOOGLE_CLIENT_ID=242050942548-qaiplivs5qa975uvtbelam351pdioa49.apps.googleusercontent.com

# Production Settings
NODE_ENV=production
PORT=3000
EOF

# Install dependencies and build
npm install
npm run build

print_status "Frontend built successfully"

# STEP 5: Setup service and nginx
print_step "5/5 - Setting up service..."

# Create systemd service
cat > /etc/systemd/system/nextjs-pm.service << 'EOF'
[Unit]
Description=Project Management Next.js Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/project_management/frontend
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Setup Nginx configuration
cat > /etc/nginx/sites-available/project-management << 'EOF'
server {
    listen 80;
    server_name srv875725.hstgr.cloud localhost;

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

# Start services
systemctl daemon-reload
systemctl enable nextjs-pm
systemctl start nextjs-pm
systemctl restart nginx

print_status "Services started"

# Final status check
sleep 3
systemctl status nextjs-pm --no-pager -l | head -5
systemctl status nginx --no-pager -l | head -3

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo "🌐 Your application is available at: https://srv875725.hstgr.cloud"
echo ""
echo "📊 Features:"
echo "   • Direct Supabase connection (no Django backend)"
echo "   • Google Drive OAuth integration"
echo "   • Custom authentication using existing database"
echo ""
echo "🔧 Management:"
echo "   • Restart: systemctl restart nextjs-pm"
echo "   • Logs: journalctl -u nextjs-pm -f"
echo ""
echo "✅ Deployment successful!" 