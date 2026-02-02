#!/bin/bash

# 🚀 Complete Deployment: Responsive Fixes + Custom Domain Setup
# This script deploys responsive fixes and sets up your custom domain

echo "🚀 Complete Deployment: Responsive + Domain Setup"
echo "================================================="

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
    echo "To run this complete deployment:"
    echo "1. SSH into your server: ssh root@168.231.116.32"
    echo "2. Navigate to project: cd /var/www/project_management"
    echo "3. Run this script: ./deploy-complete-with-domain.sh"
    exit 1
fi

# Get domain name from user
echo "🌐 Domain Configuration"
echo "======================="
echo ""
echo "Enter your GoDaddy domain name (e.g., focus-project.co.uk):"
read -p "Domain: " DOMAIN

if [[ -z "$DOMAIN" ]]; then
    print_warning "No domain provided. Using IP address only."
    DOMAIN=""
fi

echo ""
echo "🔍 Deployment Configuration:"
echo "   Server: $(hostname)"
echo "   Project: /var/www/project_management"
if [[ -n "$DOMAIN" ]]; then
    echo "   Domain: $DOMAIN"
else
    echo "   Domain: Using IP (168.231.116.32)"
fi
echo "   Time: $(date)"
echo ""

read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# STEP 1: Install required packages
print_step "1/8 - Installing required packages..."
apt update -qq
apt install -y certbot python3-certbot-nginx curl

# STEP 2: Stop services
print_step "2/8 - Stopping services..."
systemctl stop nextjs-pm || print_warning "Next.js service not running"
systemctl stop nginx || print_warning "Nginx not running"

# STEP 3: Pull latest changes with responsive fixes
print_step "3/8 - Pulling latest responsive fixes..."
cd /var/www/project_management
git pull origin main

# STEP 4: Build with responsive improvements
print_step "4/8 - Building with responsive improvements..."
cd frontend
rm -rf .next node_modules/.cache
npm cache clean --force
npm install
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed! Check for errors above."
    exit 1
fi

print_success "Responsive build completed!"

# STEP 5: Configure Nginx
print_step "5/8 - Configuring Nginx..."

if [[ -n "$DOMAIN" ]]; then
    # Configure for custom domain
    cat > /etc/nginx/sites-available/project-management << EOF
# HTTP server - for initial setup and Let's Encrypt
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN 168.231.116.32;
    
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
        proxy_set_header X-Mobile-Optimized "true";
    }
}
EOF
else
    # Configure for IP only
    cat > /etc/nginx/sites-available/project-management << EOF
server {
    listen 80;
    server_name 168.231.116.32;
    
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
        proxy_set_header X-Mobile-Optimized "true";
    }
}
EOF
fi

# Test Nginx configuration
if nginx -t; then
    print_success "Nginx configuration is valid"
    systemctl start nginx
else
    print_error "Nginx configuration test failed!"
    exit 1
fi

# STEP 6: SSL Certificate (if domain provided)
if [[ -n "$DOMAIN" ]]; then
    print_step "6/8 - Setting up SSL certificate for $DOMAIN..."
    
    # Check DNS first
    DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
    if [[ "$DOMAIN_IP" == "168.231.116.32" ]]; then
        print_success "DNS is properly configured!"
        
        # Get SSL certificate
        EMAIL="admin@$DOMAIN"
        if certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL; then
            print_success "SSL certificate obtained!"
            
            # Update Nginx with HTTPS redirect
            cat > /etc/nginx/sites-available/project-management << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN 168.231.116.32;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Mobile optimization
    add_header X-Mobile-Optimized "true" always;
    
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
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF
            APP_URL="https://$DOMAIN"
        else
            print_warning "SSL setup failed. Using HTTP."
            APP_URL="http://$DOMAIN"
        fi
    else
        print_warning "DNS not properly configured yet. Using HTTP."
        print_warning "Domain resolves to: $DOMAIN_IP (expected: 168.231.116.32)"
        APP_URL="http://$DOMAIN"
    fi
else
    print_step "6/8 - Skipping SSL (no domain provided)..."
    APP_URL="http://168.231.116.32"
fi

# STEP 7: Update application configuration
print_step "7/8 - Updating application configuration..."
cd /var/www/project_management/frontend

# Update environment file
cat > .env.production << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bayyefskgflbyyuwrlgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM

# App Configuration
NEXT_PUBLIC_APP_URL=$APP_URL
NEXT_PUBLIC_APP_NAME=Focus Project Management

# Production settings
NODE_ENV=production
PORT=3000
EOF

# Rebuild with new configuration
print_step "Rebuilding with new configuration..."
rm -rf .next
npm run build

# Set permissions
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

# STEP 8: Start services
print_step "8/8 - Starting services..."
systemctl restart nginx
systemctl start nextjs-pm

# Enable services
systemctl enable nginx nextjs-pm

# Set up SSL auto-renewal if SSL is configured
if [[ -n "$DOMAIN" && -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -
fi

# Final status check
print_step "Checking final status..."
sleep 5

NEXTJS_STATUS=$(systemctl is-active nextjs-pm)
NGINX_STATUS=$(systemctl is-active nginx)

echo ""
echo "🎉 Complete Deployment Finished!"
echo "================================"
echo ""

if [[ "$NEXTJS_STATUS" == "active" && "$NGINX_STATUS" == "active" ]]; then
    print_success "All services are running!"
    echo ""
    echo "🌐 Your website is now live at:"
    echo "   $APP_URL ✅"
    if [[ -n "$DOMAIN" ]]; then
        echo "   ${APP_URL/focus-project/www.focus-project} ✅"
    fi
    echo ""
    echo "📱 Responsive features deployed:"
    echo "   ✅ Mobile navigation menu"
    echo "   ✅ Responsive hero section"
    echo "   ✅ Mobile-optimized buttons"
    echo "   ✅ Touch-friendly interactions"
    echo "   ✅ Responsive feature cards"
    echo "   ✅ Mobile-friendly footer"
    echo ""
    if [[ -n "$DOMAIN" && -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
        echo "🔒 Security features:"
        echo "   ✅ SSL certificate active"
        echo "   ✅ HTTPS redirect enabled"
        echo "   ✅ Security headers configured"
        echo "   ✅ Auto-renewal setup"
    fi
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Test on mobile: $APP_URL"
    echo "   2. Try the hamburger menu"
    echo "   3. Test responsive breakpoints"
    echo "   4. Verify touch interactions"
    
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
echo "   - Test mobile: Open $APP_URL on your phone"
echo "   - Check logs: journalctl -u nextjs-pm -f"
echo "   - Restart: systemctl restart nextjs-pm nginx"
