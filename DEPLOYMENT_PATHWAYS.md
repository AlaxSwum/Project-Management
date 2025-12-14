# Deployment Pathways Summary

## Total Deployment Scripts: **73**

## Main Deployment Paths:

### 1. **focus-project.co.uk** (Primary Domain)
- **Script**: `deploy-payroll-to-focus-project.sh`
- **Path**: `/var/www/html/frontend`
- **PM2 Process**: `frontend`
- **URL**: https://focus-project.co.uk

### 2. **Hostinger Server** (srv875725.hstgr.cloud)
- **Scripts**: 
  - `deploy-hostinger-now.sh`
  - `deploy-remote-hostinger.sh`
  - `deploy-hostinger-direct.sh`
- **Path**: `/var/www/project_management/frontend`
- **Service**: `systemctl nextjs-pm`
- **URL**: https://srv875725.hstgr.cloud

### 3. **Direct SSH Deployment**
- **Scripts**:
  - `deploy-ssh-direct.sh`
  - `deploy-via-ssh.sh`
  - `deploy-from-local.sh`

### 4. **Feature-Specific Deployments**
- `deploy-payroll-styles.sh` - Payroll styling fixes
- `deploy-payroll-system.sh` - Payroll system deployment
- `deploy-company-outreach.sh` - Company outreach feature
- `deploy-personal-tasks-hostinger.sh` - Personal tasks
- And 60+ more specialized scripts

## Recent Payroll Deployments:

1. ✅ **c376012** - Fix payroll page UI - reduce element sizes, improve spacing and styling
2. ✅ **bc057e6** - Fix missing closing div tag in payroll page
3. ✅ **1f084ef** - Add CSS style tag with !important to fix payroll page styling issues

## Current Status:

- **Last Deployment**: Just completed
- **Build Status**: ✅ Successful
- **PM2 Status**: ✅ Running
- **CSS Loading**: ✅ Confirmed (network requests show CSS loading)

## Notes:

- Most deployments use Git pull + npm build + PM2 restart pattern
- focus-project.co.uk uses PM2 process name `frontend`
- Some scripts target different server paths
- Always check PM2 status after deployment: `pm2 list`

