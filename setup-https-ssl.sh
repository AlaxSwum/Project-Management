#!/bin/bash

# 🔒 HTTPS/SSL Setup Script for Hostinger
# Run this on your Hostinger server to enable HTTPS

echo "🔒 Setting up HTTPS/SSL for your domain..."
echo "================================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
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
    echo "SSH into your server first:"
    echo "ssh root@srv875725.hstgr.cloud"
    exit 1
fi

print_step "1. Installing Certbot for Let's Encrypt SSL..."
apt update
apt install -y certbot python3-certbot-nginx

print_step "2. Obtaining SSL certificate..."
# Replace with your actual domain
DOMAIN="srv875725.hstgr.cloud"
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email your-email@example.com

print_step "3. Updating Nginx configuration for HTTPS..."
cat > /etc/nginx/sites-available/project-management << 'EOF'
server {
    listen 80;
    server_name srv875725.hstgr.cloud;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name srv875725.hstgr.cloud;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/srv875725.hstgr.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/srv875725.hstgr.cloud/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Next.js
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
    }
}
EOF

print_step "4. Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    print_step "5. Restarting Nginx..."
    systemctl restart nginx
    
    print_step "6. Setting up auto-renewal..."
    crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | crontab -
    
    echo ""
    echo -e "${GREEN}✅ HTTPS setup completed successfully!${NC}"
    echo ""
    echo "🌐 Your website is now available at:"
    echo "   https://srv875725.hstgr.cloud"
    echo ""
    echo "🔒 SSL Features enabled:"
    echo "   ✅ Let's Encrypt SSL certificate"
    echo "   ✅ HTTP to HTTPS redirect"
    echo "   ✅ Security headers"
    echo "   ✅ Auto-renewal setup"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Update your application URLs to use HTTPS"
    echo "   2. Test all functionality"
    echo "   3. Update any hardcoded HTTP URLs"
    
else
    print_error "Nginx configuration test failed!"
    echo "Please check the configuration and try again."
    exit 1
fi
