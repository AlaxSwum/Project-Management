#!/bin/bash

# Start Next.js Frontend Script
echo "🚀 Starting Next.js Frontend..."

# Navigate to frontend directory
cd frontend

# Check if .env.local file exists
if [ ! -f .env.local ]; then
    if [ -f env.example ]; then
        echo "⚠️  .env.local file not found. Creating from env.example..."
        cp env.example .env.local
        echo "✅ Created .env.local from env.example"
        echo "📝 Please update .env.local with your actual values"
    else
        echo "⚠️  .env.local file not found. Please create one with:"
        echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api"
        echo "NEXT_PUBLIC_AUTH_URL=http://localhost:8000/api/auth"
        echo ""
    fi
fi

# Install dependencies
echo "📚 Installing Node.js dependencies..."
npm install

# Start development server
echo "🌟 Starting Next.js development server on http://localhost:3000"
npm run dev 