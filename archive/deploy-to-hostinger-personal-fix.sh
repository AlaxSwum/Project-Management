#!/bin/bash

# Deploy Personal Tasks Fix to Hostinger
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

echo "📋 Changes being deployed:"
echo "  ✅ Fixed personal tasks to use personal_tasks table"
echo "  ✅ Removed duration field from task creation"
echo "  ✅ Fixed time blocks loading errors"
echo "  ✅ Updated personal calendar service"
echo ""

# Build the frontend
echo "🔨 Building frontend..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
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

# Create deployment package
echo "📦 Creating deployment package..."
cd ..

# Create a deployment directory
rm -rf deployment_package
mkdir -p deployment_package

# Copy built frontend
cp -r frontend/.next deployment_package/
cp -r frontend/public deployment_package/
cp frontend/package.json deployment_package/
cp frontend/package-lock.json deployment_package/ 2>/dev/null || true
cp -r frontend/src deployment_package/

# Copy any additional files needed
cp -r frontend/node_modules deployment_package/ 2>/dev/null || echo "⚠️  Node modules not copied (will install on server)"

echo "✅ Deployment package created!"
echo ""

echo "🌐 HOSTINGER DEPLOYMENT INSTRUCTIONS:"
echo "======================================"
echo ""
echo "1. Access your Hostinger File Manager or use FTP/SSH"
echo "2. Navigate to your website root directory"
echo "3. Upload the contents of 'deployment_package' folder"
echo "4. Ensure the following files are updated:"
echo "   - src/lib/personal-calendar-service.ts"
echo "   - src/app/my-personal/page.tsx"
echo ""
echo "5. If using SSH, run these commands on your server:"
echo "   cd /path/to/your/website"
echo "   npm install --production"
echo "   npm run build"
echo "   pm2 restart all (if using PM2)"
echo ""

# Show the current git status
echo "📊 Current deployment status:"
git log --oneline -n 3
echo ""

echo "🔗 Test the deployment at:"
echo "   https://srv875725.hstgr.cloud/personal"
echo ""

echo "✅ DEPLOYMENT PACKAGE READY!"
echo "The personal tasks fix should resolve:"
echo "  - 'Failed to load time blocks' errors"
echo "  - 400/406 HTTP errors"
echo "  - Task creation without duration field"
echo ""

# Create a simple upload script
cat > upload_to_hostinger.txt << EOF
HOSTINGER UPLOAD INSTRUCTIONS:
=============================

1. Compress the deployment_package folder:
   zip -r personal_tasks_fix.zip deployment_package/

2. Upload via Hostinger File Manager:
   - Login to your Hostinger control panel
   - Go to File Manager
   - Navigate to your website directory
   - Upload personal_tasks_fix.zip
   - Extract the zip file
   - Replace existing files

3. Alternative - FTP Upload:
   - Use your FTP client
   - Upload contents of deployment_package/
   - Overwrite existing files

4. Test at: https://srv875725.hstgr.cloud/personal

The personal tasks and time blocks should now work correctly!
EOF

echo "📄 Upload instructions saved to: upload_to_hostinger.txt"
