#!/bin/bash

# Deploy Task Visibility Fixes to Hostinger
# This script deploys the personal task management fixes

echo "🚀 Starting deployment of task visibility fixes..."

# Check if we're in the right directory
if [ ! -f "frontend/src/app/personal/page.tsx" ]; then
    echo "❌ Error: Not in the correct project directory"
    exit 1
fi

# Build the frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend build completed"

# Deploy to Hostinger (assuming you have SSH access configured)
echo "🌐 Deploying to Hostinger server..."

# Note: You'll need to update these paths to match your Hostinger setup
# Replace 'your-server' and '/path/to/your/app' with your actual server details

# If you're using FTP/cPanel file manager, you can use this approach:
echo "📁 Files ready for upload to Hostinger"
echo "   Upload the contents of 'frontend/.next' to your web directory"
echo "   Or use your preferred deployment method"

# Alternative: If you have SSH access to Hostinger
# scp -r .next/* your-username@your-server:/path/to/your/app/

# Alternative: If using Git deployment
# ssh your-username@your-server "cd /path/to/your/app && git pull origin main && npm run build"

cd ..

echo "🎉 Deployment preparation complete!"
echo ""
echo "📋 Summary of fixes deployed:"
echo "   ✅ Fixed WeekCalendarView task filtering"
echo "   ✅ Fixed task update state consistency"
echo "   ✅ Fixed task status update state consistency"  
echo "   ✅ Fixed task deletion state consistency"
echo ""
echo "🔍 What this fixes:"
echo "   • Tasks created in week view now appear correctly"
echo "   • Tasks created in month view now appear in week view"
echo "   • Tasks created in day view now appear in week view"
echo "   • Task updates/deletions work consistently across all views"
echo ""
echo "🌐 Next steps:"
echo "   1. Upload the built files to your Hostinger server"
echo "   2. Test the personal task management page"
echo "   3. Verify tasks appear correctly in all views"
