#!/bin/bash

echo "🚀 Deploying authentication fixes to Hostinger..."
echo "📍 Make sure you're running this on your Hostinger server: 168.231.116.32"
echo ""

# Download and run the main deployment script
echo "📥 Downloading deployment script..."
wget -O hostinger-deploy.sh https://raw.githubusercontent.com/AlaxSwum/Project-Management/main/hostinger-deploy.sh

echo "🔧 Making script executable..."
chmod +x hostinger-deploy.sh

echo "🚀 Running deployment..."
./hostinger-deploy.sh

echo "✅ Deployment complete!"
echo ""
echo "Your app should now be running at:"
echo "🌐 http://168.231.116.32:3000 (Frontend)"
echo "🌐 http://168.231.116.32/api (Backend API)"
echo ""
echo "Try logging in with: admin@project.com / admin123" 