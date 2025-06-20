#!/bin/bash

echo "🚀 Project Management App - Environment Setup"
echo "============================================="
echo ""

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    echo -n "$prompt [$default]: "
    read input
    if [ -z "$input" ]; then
        input="$default"
    fi
    eval "$var_name='$input'"
}

# Backend Environment Setup
echo "📦 Setting up Backend Environment (.env)"
echo "-----------------------------------------"

# Check if backend/.env already exists
if [ -f "backend/.env" ]; then
    echo "⚠️  backend/.env already exists. Do you want to overwrite it? (y/N)"
    read overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "Skipping backend environment setup..."
    else
        setup_backend=true
    fi
else
    setup_backend=true
fi

if [ "$setup_backend" = true ]; then
    echo ""
    echo "🗄️  Supabase Database Configuration"
    echo "   Please get these values from your Supabase project dashboard:"
    echo "   Go to Settings > Database in your Supabase project"
    echo ""
    
    prompt_with_default "Database Name" "postgres" "DB_NAME"
    prompt_with_default "Database User" "postgres" "DB_USER"
    prompt_with_default "Database Password" "" "DB_PASSWORD"
    prompt_with_default "Database Host (e.g., db.xxx.supabase.co)" "" "DB_HOST"
    prompt_with_default "Database Port" "5432" "DB_PORT"
    
    echo ""
    echo "🔐 Security Configuration"
    prompt_with_default "Django Secret Key" "django-insecure-$(openssl rand -base64 32)" "SECRET_KEY"
    prompt_with_default "JWT Secret Key" "jwt-secret-$(openssl rand -base64 32)" "JWT_SECRET_KEY"
    prompt_with_default "Debug Mode" "True" "DEBUG"
    
    # Create backend/.env file
    cat > backend/.env << EOF
# Supabase Database Configuration
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT

# Django Security
SECRET_KEY=$SECRET_KEY
DEBUG=$DEBUG
JWT_SECRET_KEY=$JWT_SECRET_KEY

# CORS Origins
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
EOF
    
    echo "✅ Backend environment file created at backend/.env"
fi

echo ""
echo "🎨 Setting up Frontend Environment (.env.local)"
echo "-----------------------------------------------"

# Check if frontend/.env.local already exists
if [ -f "frontend/.env.local" ]; then
    echo "⚠️  frontend/.env.local already exists. Do you want to overwrite it? (y/N)"
    read overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "Skipping frontend environment setup..."
    else
        setup_frontend=true
    fi
else
    setup_frontend=true
fi

if [ "$setup_frontend" = true ]; then
    prompt_with_default "API URL" "http://localhost:8000/api" "API_URL"
    prompt_with_default "Auth URL" "http://localhost:8000/api/auth" "AUTH_URL"
    
    # Create frontend/.env.local file
    cat > frontend/.env.local << EOF
# API Configuration
NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_AUTH_URL=$AUTH_URL

# Google Drive API (for future file uploads)
# NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=your_google_drive_api_key
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EOF
    
    echo "✅ Frontend environment file created at frontend/.env.local"
fi

echo ""
echo "🎉 Environment Setup Complete!"
echo "=============================="
echo ""
echo "📋 Next Steps:"
echo "1. Make sure you have created a Supabase project and database"
echo "2. Update the database credentials in backend/.env if needed"
echo "3. Run the backend: ./start-backend.sh"
echo "4. Run the frontend: ./start-frontend.sh"
echo ""
echo "🔗 Useful Links:"
echo "- Supabase Dashboard: https://app.supabase.com/"
echo "- Project Documentation: README.md"
echo ""
echo "Happy coding! 🚀" 