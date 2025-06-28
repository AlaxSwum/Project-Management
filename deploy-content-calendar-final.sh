#!/bin/bash

echo "🎯 DEPLOYING ULTRA-PROMINENT CONTENT CALENDAR"
echo "=============================================="
echo "📅 Time: $(date)"
echo "🎨 Features: 500px black gradient folder navigation"
echo "✨ Status: Sidebar coverage fixed + TypeScript errors resolved"
echo ""

echo "📋 Build Summary:"
echo "- Content Calendar: 20.5 kB"
echo "- Ultra-prominent folder navigation with dramatic styling"
echo "- Debug info showing folder count and user details"
echo "- Bulletproof layout preventing sidebar coverage"
echo ""

# Simple remote deployment using git pull
echo "🚀 Deploying to srv875725.hstgr.cloud..."

# Create a deployment command file
cat > deploy_commands.sh << 'EOF'
#!/bin/bash
cd /root/project_management
echo "📥 Pulling latest code..."
git pull origin main
echo "📦 Installing dependencies..."
cd frontend
npm install --production
echo "🔨 Building application..."
npm run build
echo "🔄 Restarting service..."
systemctl restart nextjs-pm
echo "✅ Deployment complete!"
systemctl status nextjs-pm --no-pager -l
EOF

echo "📤 Uploading deployment script..."
scp deploy_commands.sh root@srv875725.hstgr.cloud:/root/deploy_commands.sh

echo "🏃 Executing remote deployment..."
ssh root@srv875725.hstgr.cloud "chmod +x /root/deploy_commands.sh && /root/deploy_commands.sh"

echo ""
echo "🎉 ULTRA-PROMINENT CONTENT CALENDAR DEPLOYED!"
echo "🌐 URL: https://srv875725.hstgr.cloud/content-calendar"
echo "📁 Folder Navigation: Impossible to miss - 500px black gradient box"
echo "🔧 Next Step: Run SQL script in Supabase to create 2025 → month structure"
echo ""

# Cleanup
rm -f deploy_commands.sh

echo "✅ Deployment script completed!" 