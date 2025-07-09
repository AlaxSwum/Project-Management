#!/bin/bash

echo "🔐 Deploying Password Management System..."
echo "📅 Time: $(date)"

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting Password Management deployment..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend build completed successfully"

# Commit and push changes
echo "📤 Committing and pushing changes..."
cd ..
git add .
git commit -m "Add comprehensive password management system with Bitwarden-like features and security controls"
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Git push failed!"
    exit 1
fi

echo "✅ Changes pushed to GitHub"

# Deploy to Hostinger
echo "🌐 Deploying to Hostinger..."
./deploy-incremental.sh

echo "✅ Password Management System deployment completed!"
echo ""
echo "🔐 PASSWORD MANAGEMENT FEATURES:"
echo "   • Secure password vault with encryption"
echo "   • User access controls (owner, editor, viewer)"
echo "   • Password strength analysis"
echo "   • Organized folders and categories"
echo "   • Two-factor authentication tracking"
echo "   • Audit logging for security"
echo "   • Password sharing with permissions"
echo "   • Favorite passwords"
echo "   • Search and filtering"
echo "   • Password generation"
echo ""
echo "📊 DATABASE TABLES CREATED:"
echo "   • password_vault - Main password storage"
echo "   • password_vault_access - Permission management"
echo "   • password_vault_folders - Organization system"
echo "   • password_audit_log - Security tracking"
echo "   • password_sharing_links - Secure sharing"
echo ""
echo "🎯 NEXT STEPS:"
echo "   1. Run the SQL script: create_password_management_tables.sql"
echo "   2. Access Password Manager from sidebar"
echo "   3. Start adding your passwords securely"
echo ""
echo "🌐 Test your deployment: https://srv875725.hstgr.cloud/password-manager" 