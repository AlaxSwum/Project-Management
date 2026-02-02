#!/bin/bash

# 🚀 DEPLOY HIERARCHICAL DAILY REPORTS TO HOSTINGER FROM LOCAL TERMINAL
# This script will SSH into your server and run the deployment

echo "🚀 Deploying Hierarchical Daily Reports System to Hostinger Server..."
echo "=================================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Connecting to your Hostinger server and deploying..."

# SSH into server and run deployment commands
ssh -o StrictHostKeyChecking=no root@srv875725.hstgr.cloud << 'ENDSSH'

echo "🔄 Connected to Hostinger server..."
cd /var/www/project_management

echo "📥 Pulling latest code with Hierarchical Daily Reports..."
git pull origin main

echo "⏹️  Stopping services..."
systemctl stop nextjs-pm || echo "Service not running"

echo "🧹 Clearing cache and rebuilding..."
cd frontend
rm -rf .next node_modules/.cache
npm cache clean --force
npm install --no-cache

echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "🔧 Setting permissions..."
cd ..
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

echo "▶️  Starting services..."
systemctl start nextjs-pm

echo "⏱️  Waiting for service to start..."
sleep 5

if systemctl is-active --quiet nextjs-pm; then
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "🌐 Your app is running at: https://srv875725.hstgr.cloud"
else
    echo "❌ Service failed to start"
    journalctl -u nextjs-pm --no-pager -n 20
    exit 1
fi

ENDSSH

if [ $? -eq 0 ]; then
    print_success "🎉 HIERARCHICAL DAILY REPORTS SYSTEM DEPLOYED TO HOSTINGER!"
    echo ""
    print_success "🎯 NEW HIERARCHICAL VIEW FEATURES:"
    echo "✅ Project-based organization"
    echo "✅ Date grouping under each project"
    echo "✅ User reports under each date"
    echo "✅ Expandable/collapsible hierarchy"
    echo "✅ Meeting minutes indicators"
    echo "✅ Clean, organized structure"
    echo ""
    print_warning "📋 FINAL STEP - DEPLOY DATABASE (if not done already):"
    echo "1. Go to: https://supabase.com/dashboard"
    echo "2. Open SQL Editor"
    echo "3. Copy and paste this SQL:"
    echo ""
    echo "CREATE TABLE IF NOT EXISTS daily_reports ("
    echo "    id SERIAL PRIMARY KEY,"
    echo "    employee_id INTEGER NOT NULL,"
    echo "    employee_name TEXT NOT NULL,"
    echo "    employee_email TEXT NOT NULL,"
    echo "    project_id INTEGER REFERENCES projects_project(id) ON DELETE SET NULL,"
    echo "    project_name TEXT,"
    echo "    report_date DATE NOT NULL,"
    echo "    date_display TEXT NOT NULL,"
    echo "    key_activities TEXT NOT NULL,"
    echo "    ongoing_tasks TEXT,"
    echo "    challenges TEXT,"
    echo "    team_performance TEXT,"
    echo "    next_day_priorities TEXT,"
    echo "    meeting_minutes TEXT,"
    echo "    has_meeting_minutes BOOLEAN DEFAULT FALSE,"
    echo "    other_notes TEXT,"
    echo "    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),"
    echo "    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
    echo ");"
    echo ""
    echo "CREATE INDEX IF NOT EXISTS idx_daily_reports_employee ON daily_reports(employee_id);"
    echo "CREATE INDEX IF NOT EXISTS idx_daily_reports_project ON daily_reports(project_id);"
    echo "CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);"
    echo "CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_reports_unique ON daily_reports(employee_id, report_date, project_id);"
    echo "ALTER TABLE daily_reports DISABLE ROW LEVEL SECURITY;"
    echo "GRANT ALL ON daily_reports TO authenticated;"
    echo "GRANT ALL ON daily_reports TO anon;"
    echo "GRANT USAGE, SELECT ON SEQUENCE daily_reports_id_seq TO authenticated;"
    echo "GRANT USAGE, SELECT ON SEQUENCE daily_reports_id_seq TO anon;"
    echo ""
    echo "4. Click 'Run'"
    echo ""
    print_warning "🔄 Clear browser cache: Ctrl+Shift+R"
else
    print_error "❌ Deployment failed!"
fi
