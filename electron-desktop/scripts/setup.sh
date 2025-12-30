#!/bin/bash

# Project Management Desktop App - Setup Script
# This script sets up the Electron desktop application

set -e

echo "🖥️  Project Management Desktop App Setup"
echo "========================================"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null || echo "not installed")
echo "📦 Node.js version: $NODE_VERSION"

if [[ "$NODE_VERSION" == "not installed" ]]; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Navigate to electron-desktop directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo ""
echo "📁 Working directory: $(pwd)"
echo ""

# Install dependencies
echo "📥 Installing Electron dependencies..."
npm install

# Generate placeholder icons
echo ""
echo "🎨 Generating placeholder icons..."
node scripts/generate-icons.js

# Check if frontend dependencies are installed
if [ ! -d "../frontend/node_modules" ]; then
    echo ""
    echo "📥 Installing frontend dependencies..."
    cd ../frontend
    npm install
    cd ../electron-desktop
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "========================================"
echo "🚀 Quick Start Commands:"
echo ""
echo "  Development mode:"
echo "    cd electron-desktop"
echo "    npm run dev"
echo ""
echo "  Build for production:"
echo "    npm run build:mac    # macOS"
echo "    npm run build:win    # Windows"
echo "    npm run build:linux  # Linux"
echo ""
echo "========================================"
echo ""
echo "⚠️  Before building for production:"
echo "  1. Replace placeholder icons in resources/"
echo "  2. Update package.json with your app details"
echo "  3. Configure code signing for distribution"
echo ""

