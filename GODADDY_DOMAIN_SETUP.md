# 🌐 GoDaddy Domain Setup for Hostinger

## Step 1: Configure DNS Records in GoDaddy

### A. Login to GoDaddy
1. Go to [GoDaddy.com](https://godaddy.com)
2. Sign in to your account
3. Go to **"My Products"** → **"All Products and Services"**
4. Find your domain and click **"DNS"** or **"Manage DNS"**

### B. Add DNS Records
You need to point your domain to your Hostinger server IP: **168.231.116.32**

**Add these DNS records:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 168.231.116.32 | 1 Hour |
| A | www | 168.231.116.32 | 1 Hour |
| CNAME | * | yourdomain.com | 1 Hour |

**Detailed Steps:**
1. **Delete existing A records** (if any point to parking pages)
2. **Add A Record for root domain:**
   - Type: `A`
   - Name: `@` (this represents your root domain)
   - Value: `168.231.116.32`
   - TTL: `1 Hour`

3. **Add A Record for www:**
   - Type: `A` 
   - Name: `www`
   - Value: `168.231.116.32`
   - TTL: `1 Hour`

4. **Add CNAME for subdomains (optional):**
   - Type: `CNAME`
   - Name: `*`
   - Value: `yourdomain.com` (replace with your actual domain)
   - TTL: `1 Hour`

### C. Save Changes
- Click **"Save"** or **"Save Changes"**
- DNS propagation can take 24-48 hours, but usually works within 1-2 hours

## Step 2: Verify DNS Propagation

Use these tools to check if DNS is working:
- [WhatsMyDNS.net](https://whatsmydns.net)
- [DNS Checker](https://dnschecker.org)
- Command line: `nslookup yourdomain.com`

## Step 3: Test Connection

Once DNS propagates, test:
```bash
# Test if domain points to your server
ping yourdomain.com

# Should return: 168.231.116.32
```

## Common Issues

### Issue 1: Domain still shows parking page
**Solution:** Make sure you deleted the old A records that point to GoDaddy's parking servers

### Issue 2: DNS not propagating
**Solution:** 
- Wait longer (up to 48 hours)
- Clear your local DNS cache
- Try from different locations/devices

### Issue 3: Mixed content errors
**Solution:** Make sure all resources use HTTPS after SSL setup

## Next Steps

After DNS is working:
1. ✅ Configure Nginx for your domain
2. ✅ Set up SSL certificate
3. ✅ Update application URLs
4. ✅ Test everything

---

**Need Help?**
- GoDaddy Support: [help.godaddy.com](https://help.godaddy.com)
- DNS Propagation usually takes 1-2 hours
- Contact me if you need help with the server configuration
