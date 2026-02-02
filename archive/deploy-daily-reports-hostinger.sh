#!/bin/bash

# 🚀 DEPLOY DAILY REPORTS SYSTEM TO HOSTINGER SERVER
# Run this script on your Hostinger server to deploy the daily reports system

echo "🚀 Deploying Daily Reports System to Hostinger..."
echo "================================================"

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

# Check if we're in the right directory
if [ ! -d "/var/www/project_management" ]; then
    print_error "❌ Not in Hostinger server or wrong directory"
    echo "Please run this on your Hostinger server:"
    echo "ssh root@srv875725.hstgr.cloud"
    echo "cd /var/www/project_management"
    echo "./deploy-daily-reports-hostinger.sh"
    exit 1
fi

cd /var/www/project_management

print_status "Step 1: Stopping services..."
systemctl stop nextjs-pm || echo "Service not running"

print_status "Step 2: Pulling latest code with Daily Reports..."
git pull origin main

print_status "Step 3: Clearing all cache and rebuilding..."
cd frontend
rm -rf .next node_modules/.cache
npm cache clean --force
npm install --no-cache
npm run build

if [ $? -ne 0 ]; then
    print_error "❌ Build failed! Check the error messages above."
    exit 1
fi

print_status "Step 4: Setting correct permissions..."
cd ..
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

print_status "Step 5: Starting services..."
systemctl start nextjs-pm

# Check status
sleep 5
if systemctl is-active --quiet nextjs-pm; then
    print_success "🎉 DAILY REPORTS SYSTEM DEPLOYED SUCCESSFULLY!"
    echo ""
    print_success "🌐 Your app is running at: https://srv875725.hstgr.cloud"
    echo ""
    print_warning "⚠️  IMPORTANT: You still need to run the SQL script!"
    echo ""
    echo "📋 FINAL STEP - DEPLOY DATABASE:"
    echo "================================"
    echo "1. Go to: https://supabase.com/dashboard"
    echo "2. Open SQL Editor"
    echo "3. Copy the following SQL and paste it:"
    echo ""
    echo "-- DAILY REPORTS DATABASE DEPLOYMENT"
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
    echo ""
    echo "ALTER TABLE daily_reports DISABLE ROW LEVEL SECURITY;"
    echo "GRANT ALL ON daily_reports TO authenticated;"
    echo "GRANT ALL ON daily_reports TO anon;"
    echo ""
    echo "4. Click 'Run' to execute the SQL"
    echo ""
    print_success "🎯 NEW FEATURES AVAILABLE:"
    echo "=========================="
    echo "✅ Daily Report Form (+ button → 'Daily Report Form')"
    echo "✅ Calendar View (/daily-reports page)"
    echo "✅ Meeting Minutes Tracking (green dots on calendar)"
    echo "✅ Tomorrow's Priorities (instead of weekly)"
    echo "✅ Date-specific reporting"
    echo ""
    print_warning "🔄 BROWSER CACHE: Clear your browser cache or use Ctrl+Shift+R"
    echo ""
else
    print_error "❌ Service failed to start"
    echo "Check logs: journalctl -u nextjs-pm -f"
    exit 1
fi
