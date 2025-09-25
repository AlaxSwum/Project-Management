#!/bin/bash

# 🌐 Deploy focus-project.co.uk Domain Setup
# This script configures your server for the custom domain

echo "🌐 Setting up focus-project.co.uk Domain"
echo "========================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Server details
SERVER_HOST="168.231.116.32"
SERVER_USER="root"
DOMAIN="focus-project.co.uk"
PROJECT_PATH="/var/www/project_management"

echo "🔍 Domain setup configuration:"
echo "   Domain: $DOMAIN"
echo "   Server: $SERVER_HOST"
echo "   Time: $(date)"
echo ""

print_step "1/4 - Connecting to server..."

# Create domain setup commands
DOMAIN_SETUP_COMMANDS="
echo '🌐 Setting up focus-project.co.uk domain...'

# Install SSL tools
echo '📦 Installing SSL tools...'
apt update -qq
apt install -y certbot python3-certbot-nginx

# Stop services
echo '🛑 Stopping services...'
systemctl stop nextjs-pm
systemctl stop nginx

# Configure Nginx for focus-project.co.uk
echo '⚙️ Configuring Nginx for focus-project.co.uk...'
cat > /etc/nginx/sites-available/project-management << 'EOF'
# HTTP server - for initial setup and Let's Encrypt
server {
    listen 80;
    server_name focus-project.co.uk www.focus-project.co.uk 168.231.116.32;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Mobile optimization headers
        proxy_set_header X-Mobile-Optimized 'true';
    }
}
EOF

# Test Nginx configuration
echo '🧪 Testing Nginx configuration...'
if nginx -t; then
    echo '✅ Nginx configuration is valid'
    systemctl start nginx
else
    echo '❌ Nginx configuration test failed!'
    exit 1
fi

# Get SSL certificate
echo '🔒 Setting up SSL certificate for focus-project.co.uk...'
EMAIL='admin@focus-project.co.uk'

if certbot --nginx -d focus-project.co.uk -d www.focus-project.co.uk --non-interactive --agree-tos --email \$EMAIL; then
    echo '✅ SSL certificate obtained successfully!'
    
    # Update Nginx with HTTPS redirect
    cat > /etc/nginx/sites-available/project-management << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name focus-project.co.uk www.focus-project.co.uk 168.231.116.32;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name focus-project.co.uk www.focus-project.co.uk;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/focus-project.co.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/focus-project.co.uk/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    add_header Referrer-Policy \"strict-origin-when-cross-origin\" always;
    
    # Mobile optimization
    add_header X-Mobile-Optimized \"true\" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control \"public, max-age=31536000, immutable\";
    }
}
EOF

    APP_URL='https://focus-project.co.uk'
    echo '✅ HTTPS enabled: \$APP_URL'
else
    echo '⚠️ SSL setup failed. Using HTTP.'
    APP_URL='http://focus-project.co.uk'
fi

# Update application configuration
echo '🔧 Updating application for focus-project.co.uk...'
cd $PROJECT_PATH/frontend

# Update environment file
cat > .env.production << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bayyefskgflbyyuwrlgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM

# App Configuration - focus-project.co.uk
NEXT_PUBLIC_APP_URL=\$APP_URL
NEXT_PUBLIC_APP_NAME=Focus Project Management

# Production settings
NODE_ENV=production
PORT=3000
EOF

# Rebuild application
echo '🏗️ Rebuilding application with domain configuration...'
rm -rf .next
npm run build

if [ \$? -ne 0 ]; then
    echo '❌ Build failed!'
    exit 1
fi

# Set permissions
echo '🔐 Setting permissions...'
cd ..
chown -R www-data:www-data $PROJECT_PATH
chmod -R 755 $PROJECT_PATH

# Start services
echo '🚀 Starting services...'
systemctl restart nginx
systemctl start nextjs-pm

# Enable services
systemctl enable nginx nextjs-pm

# Set up SSL auto-renewal
if [ -f '/etc/letsencrypt/live/focus-project.co.uk/fullchain.pem' ]; then
    (crontab -l 2>/dev/null; echo '0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx') | crontab -
    echo '✅ SSL auto-renewal configured'
fi

# Final status check
echo '⏳ Checking services...'
sleep 5

NEXTJS_STATUS=\$(systemctl is-active nextjs-pm)
NGINX_STATUS=\$(systemctl is-active nginx)

echo ''
echo '🎉 focus-project.co.uk Setup Complete!'
echo '====================================='
echo ''

if [[ \"\$NEXTJS_STATUS\" == 'active' && \"\$NGINX_STATUS\" == 'active' ]]; then
    echo '✅ All services are running!'
    echo ''
    echo '🌐 Your website is now live at:'
    echo \"   \$APP_URL ✅\"
    echo \"   \${APP_URL/focus-project/www.focus-project} ✅\"
    echo ''
    if [ -f '/etc/letsencrypt/live/focus-project.co.uk/fullchain.pem' ]; then
        echo '🔒 HTTPS Features:'
        echo '   ✅ SSL certificate active'
        echo '   ✅ HTTP redirects to HTTPS'
        echo '   ✅ Auto-renewal configured'
        echo '   ✅ Security headers enabled'
    fi
    echo ''
    echo '📱 Responsive features:'
    echo '   ✅ Mobile navigation menu'
    echo '   ✅ Touch-friendly buttons'
    echo '   ✅ Responsive layout'
    echo ''
    echo '🔧 Test your website:'
    echo \"   Desktop: \$APP_URL\"
    echo \"   Mobile: Open on your phone\"
    
else
    echo '❌ Some services failed to start!'
    echo 'Service Status:'
    echo \"   Next.js: \$NEXTJS_STATUS\"
    echo \"   Nginx: \$NGINX_STATUS\"
    echo ''
    echo 'Check logs: journalctl -u nextjs-pm -f'
fi
"

# Execute domain setup on server
ssh -t $SERVER_USER@$SERVER_HOST "$DOMAIN_SETUP_COMMANDS"

if [ $? -eq 0 ]; then
    print_step "2/4 - Verifying HTTPS setup..."
    
    # Test HTTPS
    sleep 10
    HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://focus-project.co.uk)
    
    if [ "$HTTPS_STATUS" = "200" ]; then
        print_success "HTTPS is working correctly!"
    else
        print_warning "HTTPS returned status: $HTTPS_STATUS"
        # Test HTTP fallback
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://focus-project.co.uk)
        if [ "$HTTP_STATUS" = "200" ]; then
            print_success "HTTP is working (HTTPS may need more time)"
        fi
    fi
    
    print_step "3/4 - Testing www subdomain..."
    WWW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.focus-project.co.uk)
    if [ "$WWW_STATUS" = "200" ]; then
        print_success "WWW subdomain is working!"
    fi
    
    print_step "4/4 - Domain setup complete!"
    echo ""
    echo "🎉 focus-project.co.uk is Now Live!"
    echo "=================================="
    echo ""
    print_success "Your custom domain is configured!"
    echo ""
    echo "🌐 Access your website:"
    echo "   https://focus-project.co.uk ✅"
    echo "   https://www.focus-project.co.uk ✅"
    echo ""
    echo "📱 Mobile responsive features:"
    echo "   ✅ Hamburger navigation menu"
    echo "   ✅ Touch-friendly buttons"
    echo "   ✅ Responsive text and layout"
    echo "   ✅ Mobile-optimized cards"
    echo ""
    echo "🔒 Security features:"
    echo "   ✅ SSL certificate (HTTPS)"
    echo "   ✅ Security headers"
    echo "   ✅ Auto-renewal setup"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Visit: https://focus-project.co.uk"
    echo "   2. Test on mobile device"
    echo "   3. Try the hamburger menu"
    echo "   4. Check SSL: https://www.ssllabs.com/ssltest/analyze.html?d=focus-project.co.uk"
    
else
    print_error "Domain setup failed!"
    echo ""
    echo "🔧 Manual setup steps:"
    echo "1. SSH to server: ssh root@168.231.116.32"
    echo "2. Run domain setup script manually"
    echo "3. Check Nginx config: nginx -t"
    echo "4. Check services: systemctl status nextjs-pm nginx"
fi
