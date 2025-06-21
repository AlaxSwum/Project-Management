#!/bin/bash

# 🚀 Hostinger Deployment Helper Script
# This script guides you through deploying the project creation fix

echo "🚀 Project Creation Fix - Deployment Helper"
echo "==========================================="
echo ""
echo "📍 Your Hostinger Server: 168.231.116.32"
echo "🔧 Fix Status: Ready to Deploy"
echo ""

echo "🔴 IMPORTANT: This script runs on your LOCAL machine"
echo "    The actual deployment happens on your HOSTINGER server"
echo ""

echo "📋 Step-by-Step Instructions:"
echo ""

echo "1️⃣  CONNECT TO YOUR HOSTINGER SERVER:"
echo "   Copy and paste this command in a new terminal:"
echo ""
echo "   ssh root@168.231.116.32"
echo ""
echo "   (Enter your server password when prompted)"
echo ""

echo "2️⃣  DEPLOY THE FIX (Run on Hostinger server after SSH):"
echo "   Copy and paste this ENTIRE command:"
echo ""
echo "   cd /var/www/project_management && git pull origin main && cd frontend && npm run build && systemctl restart nextjs-pm"
echo ""

echo "3️⃣  VERIFY DEPLOYMENT (Run on Hostinger server):"
echo "   systemctl status nextjs-pm"
echo ""

echo "4️⃣  TEST THE FIX:"
echo "   Go to: http://168.231.116.32:3000"
echo "   Login and try creating a project"
echo ""

echo "🆘 IF YOU NEED HELP:"
echo "   - Make sure you're connected to the server via SSH"
echo "   - Commands must run ON THE SERVER, not locally"
echo "   - Check service status: systemctl status nextjs-pm"
echo "   - View logs: journalctl -u nextjs-pm -f"
echo ""

echo "✅ Expected Result:"
echo "   - No more 400 Bad Request errors"
echo "   - Project creation works successfully"
echo "   - Projects appear in your list immediately"
echo ""

read -p "Press Enter to continue with deployment instructions..."

echo ""
echo "🚀 READY TO DEPLOY!"
echo ""
echo "Next steps:"
echo "1. Open a new terminal window"
echo "2. Run: ssh root@168.231.116.32"
echo "3. Copy the deployment command from above"
echo "4. Test project creation"
echo ""
echo "💡 Tip: Keep this window open for reference!" 