#!/bin/bash

# 🚀 Deploy Personal Task Management System to Hostinger
# This script deploys both database and frontend changes

set -e

echo "🚀 Deploying Personal Task Management System to Hostinger..."
echo "================================================================"
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
SERVER_HOST="srv875725.hstgr.cloud"
SERVER_IP="168.231.116.32"

# Check if we're running on the server
if [[ $(hostname) == *"hstgr"* ]] || [[ -d "/var/www/project_management" ]]; then
    print_status "✅ Running on Hostinger server - proceeding with deployment..."
    
    # STEP 1: Stop services
    print_step "1/9 - Stopping services..."
    systemctl stop nextjs-pm || print_warning "Next.js service not running"
    
    # STEP 2: Backup and update code
    print_step "2/9 - Updating project code..."
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
    print_step "3/9 - Setting permissions..."
    chown -R www-data:www-data $PROJECT_DIR
    chmod -R 755 $PROJECT_DIR
    print_status "Permissions set!"
    
    # STEP 4: Update frontend dependencies and build
    print_step "4/9 - Building updated frontend..."
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

# Application Configuration
NEXT_PUBLIC_FRONTEND_URL=https://srv875725.hstgr.cloud
NEXT_PUBLIC_API_URL=https://srv875725.hstgr.cloud/api
NEXT_PUBLIC_APP_NAME="Project Management System"
NEXT_PUBLIC_APP_VERSION=2.0.0

# Feature Flags
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_EMAIL_REMINDERS=true
NEXT_PUBLIC_ENABLE_PASSWORD_SHARING=true
NEXT_PUBLIC_ENABLE_CONTENT_CALENDAR_SHARING=true
NEXT_PUBLIC_ENABLE_PERSONAL_TASKS=true

# Build Configuration
NODE_ENV=production
EOF
    
    print_status "Environment file created!"
    
    # Build the application
    npm run build
    print_status "Frontend built successfully!"
    
    # STEP 5: Set final permissions
    print_step "5/9 - Setting final permissions..."
    cd $PROJECT_DIR
    chown -R www-data:www-data $PROJECT_DIR
    chmod -R 755 $PROJECT_DIR
    
    # STEP 6: Start services
    print_step "6/9 - Starting services..."
    systemctl start nextjs-pm
    
    # STEP 7: Check service status
    print_step "7/9 - Checking service status..."
    sleep 5
    
    if systemctl is-active --quiet nextjs-pm; then
        print_status "✅ Next.js service is running!"
    else
        print_error "❌ Next.js service failed to start"
        echo "📋 Service logs:"
        journalctl -u nextjs-pm --no-pager -n 10
        exit 1
    fi
    
    # STEP 8: Deploy Database Schema
    print_step "8/9 - Database deployment instructions..."
    echo ""
    echo "🗄️ IMPORTANT: Deploy Database Schema to Supabase"
    echo "=================================================="
    echo ""
    echo "1. Go to Supabase Dashboard: https://supabase.com/dashboard/projects"
    echo "2. Select project: bayyefskgflbyyuwrlgm"
    echo "3. Click 'SQL Editor' → 'New Query'"
    echo "4. Copy and paste the SQL from: deploy-personal-direct.sql"
    echo "5. Click 'Run' to deploy the personal task management tables"
    echo ""
    echo "Or copy this SQL directly:"
    echo "----------------------------------------"
    cat << 'EOSQL'
-- Personal Task Management Tables
DROP TABLE IF EXISTS personal_time_blocks CASCADE;
DROP TABLE IF EXISTS personal_tasks CASCADE;

CREATE TABLE personal_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(100),
    tags TEXT[],
    due_date TIMESTAMPTZ,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_pattern JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE personal_time_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES personal_tasks(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    block_type VARCHAR(50) DEFAULT 'task',
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX idx_personal_tasks_user_id ON personal_tasks(user_id);
CREATE INDEX idx_personal_time_blocks_user_id ON personal_time_blocks(user_id);

-- RLS
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_time_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks" ON personal_tasks USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own time blocks" ON personal_time_blocks USING (auth.uid() = user_id);

GRANT ALL ON personal_tasks TO authenticated;
GRANT ALL ON personal_time_blocks TO authenticated;

SELECT 'Personal Task Management System deployed successfully!' as message;
EOSQL
    echo "----------------------------------------"
    echo ""
    
    # STEP 9: Final status
    print_step "9/9 - Deployment Summary"
    echo ""
    echo "🎉 FRONTEND DEPLOYMENT COMPLETED!"
    echo "================================="
    echo ""
    echo "✅ Services Status:"
    echo "   - Next.js: $(systemctl is-active nextjs-pm)"
    echo "   - Server IP: $SERVER_IP"
    echo "   - Domain: $SERVER_HOST"
    echo ""
    echo "🌐 Your app is running at:"
    echo "   - https://$SERVER_HOST"
    echo "   - http://$SERVER_IP:3000"
    echo ""
    echo "🆕 New Features Added:"
    echo "   - Personal Task Management System"
    echo "   - Month/Week/Day view tabs"
    echo "   - 15-minute time blocking"
    echo "   - User-specific task privacy"
    echo ""
    echo "⚠️  NEXT STEP: Deploy database schema to Supabase (see instructions above)"
    echo ""

else
    print_error "❌ This script must be run on the Hostinger server!"
    echo ""
    echo "🖥️  To deploy remotely, run these commands:"
    echo "   ssh root@$SERVER_IP"
    echo "   cd /var/www/project_management"
    echo "   git pull origin main"
    echo "   ./deploy-personal-tasks-hostinger.sh"
    echo ""
    echo "Or use the remote deployment:"
    echo "   ./deploy-remote-hostinger.sh"
fi
