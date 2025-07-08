#!/bin/bash

echo "🚀 Adding Personal Calendar to Navigation and Redeploying..."
echo "📅 Time: $(date)"

# Create backup of current sidebar
cp frontend/src/components/Sidebar.tsx frontend/src/components/Sidebar.tsx.bak

# Add Personal Calendar link to sidebar navigation
sed -i '' '/Dashboard/a\
            <Link\
              href="/my-personal"\
              className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive("/my-personal") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}\
            >\
              <CalendarIcon className="h-5 w-5" />\
              <span>Personal Calendar</span>\
            </Link>' frontend/src/components/Sidebar.tsx

# Deploy changes
echo "📦 Deploying changes..."
sh deploy-force-rebuild.sh

echo "✅ Personal Calendar link added and deployed!"
echo "🌐 Visit https://srv875725.hstgr.cloud/my-personal to access your calendar" 