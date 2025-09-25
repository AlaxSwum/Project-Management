#!/bin/bash

# 🌐 Setup focus-project.co.uk Domain
# Run this on your Hostinger server after fixing DNS

echo "🌐 Setting up focus-project.co.uk domain"
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

# Check if running on server
if [[ ! -d "/var/www/project_management" ]]; then
    print_error "This script must be run on your Hostinger server!"
    echo ""
    echo "SSH into your server first:"
    echo "ssh root@168.231.116.32"
    exit 1
fi

DOMAIN="focus-project.co.uk"
SERVER_IP="168.231.116.32"

echo "🔍 Configuration:"
echo "   Domain: $DOMAIN"
echo "   Server IP: $SERVER_IP"
echo ""

# Check DNS propagation
print_step "1/7 - Checking DNS propagation..."
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
WWW_IP=$(dig +short www.$DOMAIN | tail -n1)

echo "DNS Status:"
echo "   $DOMAIN → $DOMAIN_IP"
echo "   www.$DOMAIN → $WWW_IP"

if [[ "$DOMAIN_IP" == "$SERVER_IP" ]] && [[ "$WWW_IP" == "$SERVER_IP" ]]; then
    print_success "DNS is properly configured!"
else
    print_warning "DNS might not be fully propagated yet."
    echo ""
    echo "Expected both to resolve to: $SERVER_IP"
    echo "Continue anyway? DNS can take time to propagate. (y/N)"
    read -p "" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please fix DNS in GoDaddy first:"
        echo "1. Delete: A record @ → WebsiteBuilder Site"
        echo "2. Delete: CNAME record www → focus-project.co.uk"
        echo "3. Add: A record www → 168.231.116.32"
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

# Configure Nginx for focus-project.co.uk
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
}
EOF

# Test and start Nginx
if nginx -t; then
    systemctl start nginx
    print_success "Nginx configuration is valid and started"
else
    print_error "Nginx configuration test failed!"
    exit 1
fi

# Get SSL certificate
print_step "5/7 - Obtaining SSL certificate for $DOMAIN..."
EMAIL="admin@$DOMAIN"

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

    APP_URL="https://$DOMAIN"
    print_success "HTTPS enabled: $APP_URL"
else
    print_warning "SSL certificate setup failed. Continuing with HTTP..."
    APP_URL="http://$DOMAIN"
fi

# Update application configuration
print_step "6/7 - Updating application for $DOMAIN..."
cd /var/www/project_management/frontend

# Update environment file
cat > .env.production << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bayyefskgflbyyuwrlgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM

# App Configuration - focus-project.co.uk
NEXT_PUBLIC_APP_URL=$APP_URL
NEXT_PUBLIC_APP_NAME=Focus Project Management

# Production settings
NODE_ENV=production
PORT=3000
EOF

# Rebuild application
print_step "Rebuilding application..."
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
systemctl enable nginx nextjs-pm

# Set up SSL auto-renewal
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -
fi

# Final status check
print_step "Checking final status..."
sleep 5

NEXTJS_STATUS=$(systemctl is-active nextjs-pm)
NGINX_STATUS=$(systemctl is-active nginx)

echo ""
echo "🎉 focus-project.co.uk Setup Complete!"
echo "====================================="
echo ""

if [[ "$NEXTJS_STATUS" == "active" && "$NGINX_STATUS" == "active" ]]; then
    print_success "All services are running!"
    echo ""
    echo "🌐 Your website is now live at:"
    echo "   $APP_URL ✅"
    echo "   ${APP_URL/focus-project/www.focus-project} ✅"
    echo ""
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        echo "🔒 HTTPS Features:"
        echo "   ✅ SSL certificate active"
        echo "   ✅ HTTP redirects to HTTPS"
        echo "   ✅ Auto-renewal configured"
    fi
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Test: $APP_URL"
    echo "   2. Check SSL: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
    
else
    print_error "Some services failed to start!"
    echo "Service Status:"
    echo "   Next.js: $NEXTJS_STATUS"
    echo "   Nginx: $NGINX_STATUS"
fi

echo ""
echo "🆘 Need help? Check:"
echo "   - DNS: dig $DOMAIN"
echo "   - Logs: journalctl -u nextjs-pm -f"
