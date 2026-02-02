# 🚀 Quick GoDaddy Domain Setup Guide

## What You Need
- ✅ Domain purchased from GoDaddy
- ✅ Hostinger server running at 168.231.116.32
- ✅ SSH access to your server

## Step-by-Step Setup

### 1. Configure DNS in GoDaddy (5 minutes)

1. **Login to GoDaddy:**
   - Go to [godaddy.com](https://godaddy.com)
   - Sign in → "My Products" → Find your domain → "DNS"

2. **Add these DNS records:**
   ```
   Type: A     | Name: @   | Value: 168.231.116.32 | TTL: 1 Hour
   Type: A     | Name: www | Value: 168.231.116.32 | TTL: 1 Hour
   ```

3. **Delete old records** that point to parking pages

4. **Save changes** and wait 1-2 hours for DNS propagation

### 2. Configure Your Server (10 minutes)

**SSH into your server and run:**

```bash
# Connect to your server
ssh root@168.231.116.32

# Navigate to project
cd /var/www/project_management

# Download and run setup script
wget https://raw.githubusercontent.com/AlaxSwum/Project-Management/main/setup-custom-domain.sh
chmod +x setup-custom-domain.sh
sudo ./setup-custom-domain.sh
```

**The script will:**
- ✅ Check DNS propagation
- ✅ Configure Nginx for your domain
- ✅ Set up SSL certificate (HTTPS)
- ✅ Update application URLs
- ✅ Restart all services

### 3. Test Your Website

After setup, your website will be available at:
- `https://yourdomain.com`
- `https://www.yourdomain.com`

## Troubleshooting

### DNS Not Working?
```bash
# Check if domain points to your server
dig yourdomain.com

# Should return: 168.231.116.32
```

**If not working:**
- Wait longer (DNS can take up to 48 hours)
- Double-check GoDaddy DNS settings
- Try from different device/location

### SSL Certificate Issues?
```bash
# Manually get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Service Not Starting?
```bash
# Check service status
sudo systemctl status nextjs-pm nginx

# View logs
sudo journalctl -u nextjs-pm -f
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Domain shows parking page | Delete old A records in GoDaddy |
| SSL certificate failed | Wait for DNS propagation, then retry |
| 502 Bad Gateway | Check if Next.js service is running |
| Mixed content warnings | Update hardcoded HTTP URLs to HTTPS |

## Need Help?

1. **Check DNS propagation:** [whatsmydns.net](https://whatsmydns.net)
2. **Test SSL:** [ssllabs.com/ssltest](https://www.ssllabs.com/ssltest/)
3. **GoDaddy Support:** [help.godaddy.com](https://help.godaddy.com)

---

**Expected Timeline:**
- DNS configuration: 5 minutes
- DNS propagation: 1-2 hours
- Server setup: 10 minutes
- **Total: ~2 hours**
