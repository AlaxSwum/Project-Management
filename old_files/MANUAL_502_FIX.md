# 🚨 Manual Fix for 502 Bad Gateway Error

## Quick Fix Commands

**SSH into your server and run these commands:**

```bash
# SSH into your server
ssh root@srv875725.hstgr.cloud

# 1. Stop the service completely
systemctl stop nextjs-pm

# 2. Navigate to frontend directory
cd /var/www/project_management/frontend

# 3. Clean up old files
rm -rf .next
rm -rf node_modules

# 4. Fresh install and build
npm cache clean --force
npm install
NODE_ENV=production npm run build

# 5. Verify build succeeded
ls -la .next/BUILD_ID

# 6. Start service
systemctl start nextjs-pm

# 7. Check status
systemctl status nextjs-pm
```

## Detailed Step-by-Step Fix

### Step 1: Check Current Status
```bash
systemctl status nextjs-pm
journalctl -u nextjs-pm -n 10
```

### Step 2: Complete Clean Rebuild
```bash
# Stop service
systemctl stop nextjs-pm

# Navigate to project
cd /var/www/project_management/frontend

# Remove build artifacts
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json

# Clean install
npm cache clean --force
npm install

# Production build
NODE_ENV=production npm run build
```

### Step 3: Verify Build
```bash
# Check if BUILD_ID exists
if [ -f ".next/BUILD_ID" ]; then
    echo "✅ Build successful"
    cat .next/BUILD_ID
else
    echo "❌ Build failed"
    exit 1
fi
```

### Step 4: Start Service
```bash
# Start the service
systemctl start nextjs-pm

# Wait and check
sleep 5
systemctl status nextjs-pm

# Check if it's listening on port 3000
netstat -tlnp | grep :3000
```

### Step 5: Test Application
```bash
# Test local connection
curl -I http://localhost:3000

# Check Nginx
systemctl status nginx
nginx -t
```

## Common Issues & Solutions

### Issue: Build Fails
```bash
# Check Node.js version
node --version
npm --version

# If old versions, update Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt-get install -y nodejs
```

### Issue: Permission Problems
```bash
# Fix ownership
chown -R www-data:www-data /var/www/project_management
chmod -R 755 /var/www/project_management
```

### Issue: Service Won't Start
```bash
# Check detailed logs
journalctl -u nextjs-pm -f

# Try manual start to see errors
cd /var/www/project_management/frontend
npm start
```

## Alternative: Quick Restart Method

If you just want to try a quick restart:

```bash
systemctl stop nextjs-pm
cd /var/www/project_management/frontend
npm run build
systemctl start nextjs-pm
systemctl status nextjs-pm
```

## Test URLs After Fix

1. **Direct Next.js:** `http://srv875725.hstgr.cloud:3000`
2. **Via Nginx:** `https://srv875725.hstgr.cloud`
3. **Timetable Page:** `https://srv875725.hstgr.cloud/timetable`

## Service Management Commands

```bash
# Check status
systemctl status nextjs-pm

# View logs
journalctl -u nextjs-pm -f

# Restart
systemctl restart nextjs-pm

# Stop
systemctl stop nextjs-pm

# Start
systemctl start nextjs-pm
```

---

**Expected Result:** Your site should be accessible at `https://srv875725.hstgr.cloud` without 502 errors. 