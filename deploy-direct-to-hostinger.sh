#!/bin/bash

# Direct Deployment Script to Hostinger
# Target: https://srv875725.hstgr.cloud/personal

echo "🚀 DEPLOYING PERSONAL TASKS FIX TO HOSTINGER"
echo "============================================="
echo "Target: https://srv875725.hstgr.cloud/personal"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

echo "📋 Deployment includes:"
echo "  ✅ Fixed personal tasks to use personal_tasks table"
echo "  ✅ Removed duration field from task creation"
echo "  ✅ Fixed time blocks loading errors"
echo "  ✅ Updated personal calendar service"
echo ""

# Build the frontend
echo "🔨 Building frontend for production..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ npm install failed!"
        exit 1
    fi
fi

# Build the project
echo "🏗️  Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Go back to root
cd ..

# Create deployment package (smaller, without node_modules)
echo "📦 Creating optimized deployment package..."
rm -rf hostinger_deployment
mkdir -p hostinger_deployment

# Copy only essential built files
echo "📁 Copying built application..."
cp -r frontend/.next hostinger_deployment/
cp -r frontend/src hostinger_deployment/
cp -r frontend/public hostinger_deployment/
cp frontend/package.json hostinger_deployment/
cp frontend/package-lock.json hostinger_deployment/ 2>/dev/null || true

# Copy deployment configs if they exist
cp frontend/next.config.js hostinger_deployment/ 2>/dev/null || true
cp frontend/.env* hostinger_deployment/ 2>/dev/null || true

echo "✅ Deployment package created!"
echo ""

# Create a tarball for easy upload
echo "📦 Creating compressed deployment package..."
cd hostinger_deployment
tar -czf ../hostinger_personal_tasks_fix.tar.gz .
cd ..

echo "✅ Compressed package created: hostinger_personal_tasks_fix.tar.gz"
echo ""

# Create deployment instructions
cat > HOSTINGER_DEPLOY_INSTRUCTIONS.txt << 'EOF'
HOSTINGER DEPLOYMENT INSTRUCTIONS
=================================

1. UPLOAD THE PACKAGE:
   - Upload hostinger_personal_tasks_fix.tar.gz to your Hostinger server
   - Or use the hostinger_deployment/ folder contents

2. EXTRACT ON SERVER:
   ssh into your server and run:
   tar -xzf hostinger_personal_tasks_fix.tar.gz

3. INSTALL DEPENDENCIES (if needed):
   npm install --production

4. RESTART APPLICATION:
   - If using PM2: pm2 restart all
   - If using other process manager, restart accordingly
   - Or restart your Node.js application

5. TEST:
   Visit: https://srv875725.hstgr.cloud/personal
   
   The following should now work:
   ✅ Personal tasks loading without errors
   ✅ Time blocks loading correctly  
   ✅ Task creation without duration field
   ✅ No more 400/406 HTTP errors

DEPLOYMENT CONTENTS:
==================
- .next/           (Built Next.js application)
- src/             (Updated source code)
- public/          (Static assets)
- package.json     (Dependencies)

KEY FILES UPDATED:
==================
- src/lib/personal-calendar-service.ts (Fixed to use personal_tasks table)
- src/app/my-personal/page.tsx (Updated personal calendar page)

TROUBLESHOOTING:
===============
If you still see errors:
1. Clear browser cache
2. Check server logs for any startup errors
3. Verify database tables exist (personal_tasks, personal_events)
4. Ensure environment variables are set correctly

The deployment is ready! 🚀
EOF

echo "📄 Deployment instructions created: HOSTINGER_DEPLOY_INSTRUCTIONS.txt"
echo ""

# Show deployment summary
echo "🎯 DEPLOYMENT SUMMARY"
echo "===================="
echo "✅ Frontend built successfully"
echo "✅ Deployment package created: hostinger_deployment/"
echo "✅ Compressed package: hostinger_personal_tasks_fix.tar.gz"
echo "✅ Instructions file: HOSTINGER_DEPLOY_INSTRUCTIONS.txt"
echo ""

# Show file sizes
echo "📊 Package sizes:"
if [ -f "hostinger_personal_tasks_fix.tar.gz" ]; then
    ls -lh hostinger_personal_tasks_fix.tar.gz | awk '{print "   Compressed: " $5}'
fi
if [ -d "hostinger_deployment" ]; then
    du -sh hostinger_deployment | awk '{print "   Uncompressed: " $1}'
fi

echo ""
echo "🌐 READY FOR DEPLOYMENT TO:"
echo "   https://srv875725.hstgr.cloud/personal"
echo ""
echo "📋 NEXT STEPS:"
echo "   1. Upload hostinger_personal_tasks_fix.tar.gz to your server"
echo "   2. Extract and install on your Hostinger server"
echo "   3. Restart your application"
echo "   4. Test the personal tasks functionality"
echo ""
echo "🎉 Personal tasks fix is ready for deployment!"
