#!/bin/bash

# DEPLOY FROM THIS TERMINAL - AUTOMATIC SSH
# This will deploy the latest emoji-free changes

cd /Users/swumpyaesone/Documents/project_management

echo "🚀 Deploying Latest Changes from This Terminal..."
echo "================================================"

echo "What will be deployed:"
echo "✅ Clean personal tasks UI (no emojis)"
echo "✅ Fixed duration field errors"
echo "✅ Expense management system"
echo "✅ Hierarchical daily reports"
echo "✅ Mobile navigation consistency"
echo ""

# Try SSH with interactive password
echo "🔑 Connecting to server..."

# Use expect to handle SSH password
/usr/bin/expect << 'EXPECTEOF'
set timeout 300
spawn ssh root@srv875725.hstgr.cloud

expect {
    "password:" {
        stty -echo
        send_user "Enter SSH password: "
        expect_user -re "(.*)\n"
        set password $expect_out(1,string)
        stty echo
        send "$password\r"
        exp_continue
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    "root@srv875725" {
        send "cd /var/www/project_management\r"
        expect "root@srv875725"
        
        send "echo 'Pulling latest changes...'\r"
        expect "root@srv875725"
        
        send "git pull origin main\r"
        expect "root@srv875725"
        
        send "echo 'Stopping service...'\r"
        expect "root@srv875725"
        
        send "systemctl stop nextjs-pm\r"
        expect "root@srv875725"
        
        send "echo 'Rebuilding application...'\r"
        expect "root@srv875725"
        
        send "cd frontend\r"
        expect "root@srv875725"
        
        send "rm -rf .next node_modules/.cache\r"
        expect "root@srv875725"
        
        send "npm install\r"
        expect "root@srv875725"
        
        send "npm run build\r"
        expect "root@srv875725"
        
        send "cd ..\r"
        expect "root@srv875725"
        
        send "chown -R www-data:www-data /var/www/project_management\r"
        expect "root@srv875725"
        
        send "systemctl start nextjs-pm\r"
        expect "root@srv875725"
        
        send "systemctl status nextjs-pm\r"
        expect "root@srv875725"
        
        send "echo 'DEPLOYMENT COMPLETED SUCCESSFULLY!'\r"
        expect "root@srv875725"
        
        send "exit\r"
        expect eof
    }
}
EXPECTEOF

echo ""
echo "✅ Deployment completed from this terminal!"
echo "🌐 Check your website: https://srv875725.hstgr.cloud"
echo "🔄 Clear browser cache: Ctrl+Shift+R"
