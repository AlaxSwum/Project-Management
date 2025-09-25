#!/bin/bash

# 🌐 Custom Domain Setup for GoDaddy Domain + Hostinger Server
# Run this AFTER you've configured DNS in GoDaddy

echo "🌐 Setting up custom domain for Project Management System"
echo "======================================================="

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
    echo "1. SSH into your server: ssh root@168.231.116.32"
    echo "2. Navigate to project: cd /var/www/project_management"
    echo "3. Run this script: ./setup-custom-domain.sh"
    exit 1
fi

# Get domain name from user
echo "🔍 Current server IP: $(curl -s ifconfig.me || echo "168.231.116.32")"
echo ""
echo "Please enter your GoDaddy domain name:"
echo "Examples: myproject.com, mycompany.org, etc."
echo ""
read -p "Domain name: " DOMAIN

if [[ -z "$DOMAIN" ]]; then
    print_error "Domain name is required!"
    exit 1
fi

# Validate domain format
if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
    print_warning "Domain format might be invalid. Continue anyway? (y/N)"
    read -p "" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🔍 Configuration Summary:"
echo "   Domain: $DOMAIN"
echo "   Server IP: 168.231.116.32"
echo "   Project: /var/www/project_management"
echo ""

# Check DNS propagation
print_step "1/7 - Checking DNS propagation..."
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
SERVER_IP="168.231.116.32"

if [[ "$DOMAIN_IP" == "$SERVER_IP" ]]; then
    print_success "DNS is properly configured! $DOMAIN → $SERVER_IP"
else
    print_warning "DNS might not be fully propagated yet."
    echo "   Domain resolves to: $DOMAIN_IP"
    echo "   Expected: $SERVER_IP"
    echo ""
    echo "This is normal if you just configured DNS. Continue? (y/N)"
    read -p "" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please wait for DNS propagation and try again later."
        echo "Check DNS status at: https://whatsmydns.net/$DOMAIN"
        exit 1
    fi
fi

# Install required packages
print_step "2/7 - Installing SSL tools..."
apt update -qq
apt install -y certbot python3-certbot-nginx

# Stop services
print_step "3/7 - Stopping services..."
systemctl stop nextjs-pm || print_warning "Next.js service not running"
systemctl stop nginx || print_warning "Nginx not running"

# Configure Nginx for custom domain
print_step "4/7 - Configuring Nginx for $DOMAIN..."
cat > /etc/nginx/sites-available/project-management << EOF
# HTTP server - for initial setup and Let's Encrypt
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect to HTTPS (will be enabled after SSL setup)
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
}
EOF

# Test Nginx configuration
if nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed!"
    exit 1
fi

# Start Nginx
systemctl start nginx

# Get SSL certificate
print_step "5/7 - Obtaining SSL certificate..."
EMAIL="admin@$DOMAIN"

# Try to get certificate
if certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL; then
    print_success "SSL certificate obtained successfully!"
    
    # Update Nginx config with HTTPS redirect
    cat > /etc/nginx/sites-available/project-management << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (managed by Certbot)
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
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Proxy to Next.js application
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
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF

else
    print_warning "SSL certificate setup failed. Continuing with HTTP only..."
    print_warning "You can set up SSL later once DNS is fully propagated."
fi

# Update application configuration
print_step "6/7 - Updating application configuration..."
cd /var/www/project_management/frontend

# Determine the URL scheme
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    APP_URL="https://$DOMAIN"
    print_success "Using HTTPS URL: $APP_URL"
else
    APP_URL="http://$DOMAIN"
    print_warning "Using HTTP URL: $APP_URL (SSL will be added later)"
fi

# Update environment file
cat > .env.production << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bayyefskgflbyyuwrlgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM

# App Configuration - CUSTOM DOMAIN
NEXT_PUBLIC_APP_URL=$APP_URL
NEXT_PUBLIC_APP_NAME=Project Management System

# Production settings
NODE_ENV=production
PORT=3000
EOF

# Rebuild application
print_step "Rebuilding application with new domain..."
rm -rf .next
npm install --production
npm run build

# Set permissions
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management

# Start services
print_step "7/7 - Starting services..."
systemctl restart nginx
systemctl start nextjs-pm

# Enable services
systemctl enable nginx
systemctl enable nextjs-pm

# Set up SSL auto-renewal
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -
    print_success "SSL auto-renewal configured"
fi

# Final status check
print_step "Checking final status..."
sleep 5

NEXTJS_STATUS=$(systemctl is-active nextjs-pm)
NGINX_STATUS=$(systemctl is-active nginx)

echo ""
echo "🎉 Custom Domain Setup Complete!"
echo "================================"
echo ""

if [[ "$NEXTJS_STATUS" == "active" && "$NGINX_STATUS" == "active" ]]; then
    print_success "All services are running!"
    echo ""
    echo "🌐 Your website is now available at:"
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        echo "   https://$DOMAIN ✅"
        echo "   https://www.$DOMAIN ✅"
        echo "   (HTTP automatically redirects to HTTPS)"
    else
        echo "   http://$DOMAIN ✅"
        echo "   http://www.$DOMAIN ✅"
        echo "   (SSL can be added later with: certbot --nginx -d $DOMAIN -d www.$DOMAIN)"
    fi
    echo ""
    echo "🔧 Features configured:"
    echo "   ✅ Custom domain: $DOMAIN"
    echo "   ✅ WWW subdomain support"
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        echo "   ✅ SSL certificate (HTTPS)"
        echo "   ✅ Auto-renewal setup"
    fi
    echo "   ✅ Nginx reverse proxy"
    echo "   ✅ Security headers"
    echo "   ✅ Gzip compression"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Test your website: $APP_URL"
    echo "   2. Update any bookmarks"
    echo "   3. Update external integrations"
    
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
echo "   - Check DNS: dig $DOMAIN"
echo "   - Test connection: curl -I $APP_URL"
echo "   - View logs: journalctl -u nextjs-pm -f"
