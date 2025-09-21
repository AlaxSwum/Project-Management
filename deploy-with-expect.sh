#!/usr/bin/expect -f

# DEPLOY LATEST CHANGES WITH EXPECT
# This script will handle SSH password automatically

set timeout 60

# Start SSH connection
spawn ssh root@srv875725.hstgr.cloud

# Handle password prompt
expect {
    "password:" {
        puts "Please enter your SSH password when prompted..."
        interact
        expect "root@srv875725"
    }
    "yes/no" {
        send "yes\r"
        expect "password:"
        puts "Please enter your SSH password when prompted..."
        interact
        expect "root@srv875725"
    }
}

# Send deployment commands
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
expect "root@srv875725" timeout 120

send "npm run build\r"
expect "root@srv875725" timeout 180

send "echo 'Setting permissions...'\r"
expect "root@srv875725"

send "cd ..\r"
expect "root@srv875725"

send "chown -R www-data:www-data /var/www/project_management\r"
expect "root@srv875725"

send "systemctl start nextjs-pm\r"
expect "root@srv875725"

send "echo 'Checking service status...'\r"
expect "root@srv875725"

send "systemctl status nextjs-pm\r"
expect "root@srv875725"

send "echo 'DEPLOYMENT COMPLETED SUCCESSFULLY!'\r"
expect "root@srv875725"

send "echo 'Your website is live at: https://srv875725.hstgr.cloud'\r"
expect "root@srv875725"

send "exit\r"
expect eof
