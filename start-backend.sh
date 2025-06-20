#!/bin/bash

# Start Django Backend Script
echo "🚀 Starting Django Backend..."

# Navigate to backend directory
cd backend

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Check if .env file exists, if not copy from .env.example
if [ ! -f .env ]; then
    if [ -f config.py ]; then
        echo "⚠️  .env file not found. Please create one based on config.py"
        echo "Example:"
        echo "DB_NAME=your_supabase_db_name"
        echo "DB_USER=your_supabase_username"
        echo "DB_PASSWORD=your_supabase_password"
        echo "DB_HOST=your_supabase_host"
        echo "DB_PORT=5432"
        echo "SECRET_KEY=your-super-secret-key"
        echo "DEBUG=True"
        echo "JWT_SECRET_KEY=your-jwt-secret-key"
        echo ""
        echo "Please create the .env file with your actual values and run this script again."
        exit 1
    fi
fi

# Install dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

# Run migrations
echo "🗄️  Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
echo "👤 You can create a superuser later with: python manage.py createsuperuser"

# Start development server
echo "🌟 Starting Django development server on http://localhost:8000"
python manage.py runserver 