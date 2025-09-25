#!/bin/bash

# 🚀 Complete HTTPS Setup for Hostinger
# This script will set up SSL and configure your app for HTTPS

echo "🚀 Complete HTTPS Setup for Project Management System"
echo "====================================================="

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

# Check if running on server
if [[ ! -d "/var/www/project_management" ]]; then
    print_error "This script must be run on your Hostinger server!"
    echo ""
    echo "To run this script:"
    echo "1. SSH into your server: ssh root@srv875725.hstgr.cloud"
    echo "2. Navigate to project: cd /var/www/project_management"
    echo "3. Run this script: ./deploy-https-complete.sh"
    exit 1
fi

echo "🔍 Current setup detected:"
echo "   Server: $(hostname)"
echo "   Domain: srv875725.hstgr.cloud"
echo "   Project: /var/www/project_management"
echo ""

read -p "Continue with HTTPS setup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

# STEP 1: Install Certbot
print_step "1/6 - Installing SSL tools..."
apt update -qq
apt install -y certbot python3-certbot-nginx

# STEP 2: Stop services
print_step "2/6 - Stopping services..."
systemctl stop nextjs-pm || print_warning "Next.js service not running"
systemctl stop nginx || print_warning "Nginx not running"

# STEP 3: Get SSL certificate
print_step "3/6 - Obtaining SSL certificate..."
DOMAIN="srv875725.hstgr.cloud"
EMAIL="admin@srv875725.hstgr.cloud"  # Change this to your email

# Check if certificate already exists
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    print_warning "SSL certificate already exists. Renewing..."
    certbot renew --nginx --quiet
else
    print_step "Getting new SSL certificate..."
    certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email $EMAIL
fi

# STEP 4: Configure Nginx for HTTPS
print_step "4/6 - Configuring Nginx for HTTPS..."
cat > /etc/nginx/sites-available/project-management << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name srv875725.hstgr.cloud;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name srv875725.hstgr.cloud;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/srv875725.hstgr.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/srv875725.hstgr.cloud/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Proxy to Next.js application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Static files caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Favicon and robots
    location = /favicon.ico {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=86400";
    }
    
    location = /robots.txt {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
EOF

# Test Nginx configuration
print_step "Testing Nginx configuration..."
if nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed!"
    exit 1
fi

# STEP 5: Update application for HTTPS
print_step "5/6 - Updating application for HTTPS..."
cd /var/www/project_management/frontend

# Update environment file
cat > .env.production << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bayyefskgflbyyuwrlgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM

# App Configuration - HTTPS ENABLED
NEXT_PUBLIC_APP_URL=https://srv875725.hstgr.cloud
NEXT_PUBLIC_APP_NAME=Project Management System

# Production settings
NODE_ENV=production
PORT=3000
EOF

# Rebuild application
print_step "Rebuilding application with HTTPS settings..."
rm -rf .next
npm install --production
npm run build

# Set permissions
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

# STEP 6: Start services
print_step "6/6 - Starting services..."
systemctl start nextjs-pm
systemctl start nginx

# Enable services to start on boot
systemctl enable nextjs-pm
systemctl enable nginx

# Set up SSL auto-renewal
print_step "Setting up SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -

# Final status check
print_step "Checking final status..."
sleep 5

NEXTJS_STATUS=$(systemctl is-active nextjs-pm)
NGINX_STATUS=$(systemctl is-active nginx)

echo ""
echo "🎉 HTTPS Setup Complete!"
echo "========================"
echo ""

if [[ "$NEXTJS_STATUS" == "active" && "$NGINX_STATUS" == "active" ]]; then
    print_success "All services are running!"
    echo ""
    echo "🌐 Your HTTPS website is now live:"
    echo "   https://srv875725.hstgr.cloud"
    echo ""
    echo "🔒 SSL Features enabled:"
    echo "   ✅ Let's Encrypt SSL certificate"
    echo "   ✅ HTTP to HTTPS redirect"
    echo "   ✅ Modern security headers"
    echo "   ✅ Gzip compression"
    echo "   ✅ Auto-renewal setup"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Test your website: https://srv875725.hstgr.cloud"
    echo "   2. Update any bookmarks to use HTTPS"
    echo "   3. Update external integrations with new HTTPS URL"
    echo ""
    echo "📊 SSL Grade: Check at https://www.ssllabs.com/ssltest/"
    
else
    print_error "Some services failed to start!"
    echo ""
    echo "Service Status:"
    echo "   Next.js: $NEXTJS_STATUS"
    echo "   Nginx: $NGINX_STATUS"
    echo ""
    echo "Check logs:"
    echo "   journalctl -u nextjs-pm -f"
    echo "   journalctl -u nginx -f"
fi

echo ""
echo "🆘 Troubleshooting:"
echo "   - Check logs: journalctl -u nextjs-pm -f"
echo "   - Test SSL: curl -I https://srv875725.hstgr.cloud"
echo "   - Restart services: systemctl restart nextjs-pm nginx"
