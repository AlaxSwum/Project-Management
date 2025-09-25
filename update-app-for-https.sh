#!/bin/bash

# 🔄 Update Application URLs for HTTPS
# Run this after SSL is configured

echo "🔄 Updating application configuration for HTTPS..."
echo "================================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

# Check if running on server
if [[ ! -d "/var/www/project_management" ]]; then
    echo -e "${RED}[ERROR]${NC} This script must be run on your Hostinger server!"
    exit 1
fi

print_step "1. Updating environment variables..."
cd /var/www/project_management/frontend

# Update production environment file
cat > .env.production << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bayyefskgflbyyuwrlgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM

# App Configuration - UPDATED FOR HTTPS
NEXT_PUBLIC_APP_URL=https://srv875725.hstgr.cloud
NEXT_PUBLIC_APP_NAME=Project Management System

# Production settings
NODE_ENV=production
PORT=3000
EOF

print_step "2. Stopping services..."
systemctl stop nextjs-pm

print_step "3. Rebuilding application..."
rm -rf .next
npm install
npm run build

print_step "4. Starting services..."
systemctl start nextjs-pm

print_step "5. Checking service status..."
sleep 3

if systemctl is-active --quiet nextjs-pm; then
    echo ""
    echo -e "${GREEN}✅ Application updated for HTTPS successfully!${NC}"
    echo ""
    echo "🌐 Your HTTPS website:"
    echo "   https://srv875725.hstgr.cloud"
    echo ""
    echo "🔧 Changes made:"
    echo "   ✅ Updated NEXT_PUBLIC_APP_URL to HTTPS"
    echo "   ✅ Rebuilt application with new settings"
    echo "   ✅ Service restarted"
    echo ""
else
    echo -e "${RED}❌ Service failed to start!${NC}"
    echo "Check logs: journalctl -u nextjs-pm -f"
fi
