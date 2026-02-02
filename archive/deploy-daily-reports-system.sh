#!/bin/bash

# Daily Reports System Deployment Script
# This script deploys the complete daily reports system

echo "🚀 Starting Daily Reports System Deployment..."

# Check if we're in the project root
if [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to frontend directory
cd frontend

echo "📦 Installing dependencies..."
npm install

echo "🔧 Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi

echo "🗄️  Database deployment instructions:"
echo "1. Open Supabase SQL Editor"
echo "2. Copy and paste the content from DEPLOY_DAILY_REPORTS_NOW.sql"
echo "3. Run the SQL script"
echo ""
echo "📋 Manual steps required:"
echo "1. Deploy database schema using DEPLOY_DAILY_REPORTS_NOW.sql"
echo "2. Update navigation routing if needed"
echo "3. Test the daily reports functionality"
echo ""
echo "🎯 Features deployed:"
echo "- Daily Report Form in sidebar"
echo "- Daily Reports page with calendar view"
echo "- Meeting minutes tracking"
echo "- Calendar visualization"
echo "- Admin/User role support"

echo ""
echo "✅ Frontend deployment completed successfully!"
echo "📍 Next steps: Deploy the database schema and test the system"
