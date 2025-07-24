#!/bin/bash

# 🚀 Hostinger Company Outreach Feature Deployment
# Run this script on your Hostinger server to deploy the latest updates

set -e  # Exit on any error

echo "🚀 Starting Company Outreach Feature Deployment on Hostinger..."
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

# Variables
PROJECT_DIR="/var/www/project_management"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# STEP 1: Stop existing services
print_step "1/8 - Stopping existing services..."
systemctl stop nextjs-pm || print_warning "Next.js service not running"
systemctl stop nginx || print_warning "Nginx not running"

# STEP 2: Backup and update code
print_step "2/8 - Updating project code..."
cd $PROJECT_DIR

# Create backup
if [ -d "${PROJECT_DIR}_backup" ]; then
    rm -rf "${PROJECT_DIR}_backup"
fi
cp -r $PROJECT_DIR "${PROJECT_DIR}_backup"
print_status "Backup created at ${PROJECT_DIR}_backup"

# Pull latest changes
git fetch origin
git reset --hard origin/main
git pull origin main

print_status "Latest code pulled from GitHub!"

# STEP 3: Set proper permissions
print_step "3/8 - Setting permissions..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
print_status "Permissions set!"

# STEP 4: Update frontend dependencies and build
print_step "4/8 - Building updated frontend..."
cd $FRONTEND_DIR

# Clear cache and rebuild
rm -rf .next
rm -rf node_modules package-lock.json || print_warning "No existing node_modules"

# Install dependencies
npm install

# Create production environment file
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

# Build the application
print_status "Building production version..."
npm run build

print_status "Frontend built successfully with Company Outreach feature!"

# STEP 5: Update Next.js service
print_step "5/8 - Updating Next.js service..."

cat > /etc/systemd/system/nextjs-pm.service << 'EOF'
[Unit]
Description=Project Management Next.js App with Company Outreach
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
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=nextjs-pm

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable nextjs-pm

print_status "Next.js service updated!"

# STEP 6: Update Nginx configuration
print_step "6/8 - Updating Nginx configuration..."

cat > /etc/nginx/sites-available/project-management << 'EOF'
server {
    listen 80;
    server_name 168.231.116.32;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    
    # Increase client body size for file uploads
    client_max_body_size 50M;
    
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
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # Cache static files
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # Handle company-outreach route specifically
    location /company-outreach {
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

# Test nginx configuration
nginx -t
print_status "Nginx configuration updated!"

# STEP 7: Display database setup instructions
print_step "7/8 - Database Setup Instructions..."

echo ""
print_warning "🗄️  IMPORTANT: Database Setup Required!"
echo ""
echo "Run these SQL commands in your Supabase SQL Editor:"
echo ""
echo "1. Fix RLS Policies (copy from fix_company_outreach_rls.sql):"
echo "   Location: $PROJECT_DIR/fix_company_outreach_rls.sql"
echo ""
echo "2. Create Tables (copy from create_company_outreach_tables_safe.sql):"
echo "   Location: $PROJECT_DIR/create_company_outreach_tables_safe.sql"
echo ""
echo "3. Add Admin Access (copy from add_admin_access.sql):"
echo "   Location: $PROJECT_DIR/add_admin_access.sql"
echo ""

# STEP 8: Start services
print_step "8/8 - Starting services..."

# Start Next.js
systemctl start nextjs-pm
sleep 5

# Start Nginx
systemctl start nginx

print_status "Services started!"

# Final status check
print_step "Deployment Status Check..."
echo "🔍 Checking services..."

if systemctl is-active --quiet nextjs-pm; then
    print_status "✅ Next.js service is running"
else
    print_error "❌ Next.js service failed to start"
    print_warning "Checking logs..."
    journalctl -u nextjs-pm --no-pager -n 10
fi

if systemctl is-active --quiet nginx; then
    print_status "✅ Nginx is running"
else
    print_error "❌ Nginx failed to start"
    print_warning "Checking nginx status..."
    nginx -t
fi

# Check if port 3000 is responding
if curl -s http://localhost:3000 > /dev/null; then
    print_status "✅ Application is responding on port 3000"
else
    print_warning "⚠️  Application might still be starting up"
fi

echo ""
echo "🎉 Company Outreach Feature Deployment Complete!"
echo ""
echo "Your application is now running at:"
echo "🌐 http://168.231.116.32:3000 (Direct Next.js)"
echo "🌐 http://168.231.116.32 (Nginx Proxy)"
echo ""
echo "🆕 New Features Available:"
echo "   • Company Outreach management under 'Idea Lounge' section"
echo "   • Field of Specialization management"
echo "   • Contact person, follow-up, and meet-up assignments"
echo "   • Advanced filtering and search capabilities"
echo ""
echo "📋 Next Steps:"
echo "1. Run the SQL scripts in Supabase (see instructions above)"
echo "2. Login to your application"
echo "3. Look for 'Idea Lounge' section in sidebar"
echo "4. Access Company Outreach feature"
echo ""
echo "🔧 Useful Commands:"
echo "- Check Next.js status: systemctl status nextjs-pm"
echo "- View Next.js logs: journalctl -u nextjs-pm -f"
echo "- Restart Next.js: systemctl restart nextjs-pm"
echo "- Check Nginx status: systemctl status nginx"
echo "- View application: curl http://localhost:3000"
echo ""
echo "🆘 If issues occur:"
echo "- Restore backup: mv ${PROJECT_DIR}_backup $PROJECT_DIR"
echo "- Check logs: journalctl -u nextjs-pm -f"
echo "- Verify build: cd $FRONTEND_DIR && npm run build" 