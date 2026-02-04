#!/bin/bash

# ========================================
# DEPLOY AVATAR & PROFILE SYSTEM
# ========================================
# This script deploys the avatar upload and profile editing system
# with proper database schema and frontend components

echo "=================================================="
echo "DEPLOYING AVATAR & PROFILE SYSTEM"
echo "=================================================="

# Step 1: Run database migrations
echo ""
echo "Step 1: Running database migrations..."
echo "Go to Supabase Dashboard > SQL Editor"
echo "Run the SQL from: ADD_AVATAR_SUPPORT.sql"
echo ""
read -p "Press Enter after running the SQL migration..."

# Step 2: Deploy frontend changes
echo ""
echo "Step 2: Deploying frontend changes..."

# Copy updated files to deployment directory
echo "Copying AuthContext.tsx..."
cp frontend/src/contexts/AuthContext.tsx hostinger_deployment_v2/src/contexts/AuthContext.tsx 2>/dev/null || echo "Note: hostinger_deployment_v2 folder may not exist"

echo "Copying Sidebar.tsx..."
cp frontend/src/components/Sidebar.tsx hostinger_deployment_v2/src/components/Sidebar.tsx 2>/dev/null || echo "Note: hostinger_deployment_v2 folder may not exist"

echo "Copying Settings page..."
cp frontend/src/app/settings/page.tsx hostinger_deployment_v2/src/app/settings/page.tsx 2>/dev/null || echo "Note: hostinger_deployment_v2 folder may not exist"

# Step 3: Build and deploy
echo ""
echo "Step 3: Building and deploying..."

cd frontend || exit 1

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the project
echo "Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "=================================================="
    echo "DEPLOYMENT SUMMARY"
    echo "=================================================="
    echo "✅ Database: ADD avatar_url, location, bio columns"
    echo "✅ AuthContext: Now fetches full profile on login/refresh"
    echo "✅ Settings Page: Avatar uploads save to database"
    echo "✅ Sidebar: Shows user avatar from database"
    echo ""
    echo "FEATURES:"
    echo "- Upload avatar (base64, no storage needed)"
    echo "- Edit profile (name, location, bio)"
    echo "- Avatar persists after refresh"
    echo "- Avatar shows in sidebar and settings"
    echo ""
    echo "NEXT STEPS:"
    echo "1. Test avatar upload in Settings > Edit Profile"
    echo "2. Refresh page to verify avatar persists"
    echo "3. Check sidebar shows your avatar"
    echo "=================================================="
else
    echo ""
    echo "❌ Build failed! Check errors above."
    exit 1
fi
