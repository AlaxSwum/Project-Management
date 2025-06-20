#!/bin/bash

# Production Deployment Script for Hostinger
# Run this script to deploy your Project Management System

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment files exist
print_status "Checking environment configuration..."

if [ ! -f "backend/.env.production" ]; then
    print_error "Backend production environment file not found!"
    print_warning "Please copy backend/env.production.template to backend/.env.production and configure it"
    exit 1
fi

if [ ! -f "frontend/.env.production" ]; then
    print_error "Frontend production environment file not found!"
    print_warning "Please copy frontend/env.production.template to frontend/.env.production and configure it"
    exit 1
fi

print_status "Environment files found ✓"

# Backend Deployment
print_status "Deploying Django Backend..."

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/upgrade pip
print_status "Installing dependencies..."
pip install --upgrade pip

# Install production requirements
pip install -r requirements_production.txt

# Set Django settings for production
export DJANGO_SETTINGS_MODULE=project_management.settings_production

# Load environment variables
set -a
source .env.production
set +a

# Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput --clear

# Run database migrations
print_status "Running database migrations..."
python manage.py migrate

# Create superuser if it doesn't exist (optional)
# print_status "Creating superuser..."
# python manage.py shell -c "
# from django.contrib.auth import get_user_model
# User = get_user_model()
# if not User.objects.filter(email='admin@yourdomain.com').exists():
#     User.objects.create_superuser('admin@yourdomain.com', 'Admin User', 'your-secure-password')
#     print('Superuser created')
# else:
#     print('Superuser already exists')
# "

# Test if Django can start
print_status "Testing Django configuration..."
python manage.py check --deploy

print_status "Backend deployment completed ✓"

cd ..

# Frontend Deployment
print_status "Deploying Next.js Frontend..."

cd frontend

# Install dependencies
print_status "Installing Node.js dependencies..."
npm ci --production

# Build the application
print_status "Building Next.js application..."
npm run build

print_status "Frontend deployment completed ✓"

cd ..

print_status "🎉 Production deployment completed successfully!"
print_warning "Don't forget to:"
print_warning "1. Configure your web server (Apache/Nginx) to serve the application"
print_warning "2. Set up SSL certificate for HTTPS"
print_warning "3. Configure your domain DNS settings"
print_warning "4. Update ALLOWED_HOSTS and CORS_ALLOWED_ORIGINS with your actual domains"
print_warning "5. Set up monitoring and backup systems"

echo ""
print_status "Backend is ready to run with:"
print_status "cd backend && source venv/bin/activate && gunicorn --config gunicorn_config.py project_management.wsgi:application"

print_status "Frontend build is located in:"
print_status "frontend/.next (for server-side rendering) or frontend/out (for static export)"

echo ""
print_status "Deployment completed at: $(date)" 