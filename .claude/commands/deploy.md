Deploy the project to Hostinger SSH server (focus-project.co.uk).

## Deployment target
- Host: root@168.231.116.32
- Remote path: /var/www/project_management/hostinger_deployment_v2
- Service: nextjs-pm
- Domain: focus-project.co.uk

## Steps to follow

### 1. Commit and push any local changes
Check if there are uncommitted changes in the source files (ignore .next/, node_modules/):
```bash
git status --short
```

If there are uncommitted source changes (src/, public/, package.json, tsconfig.json, etc.), stage and commit them:
```bash
git add hostinger_deployment_v2/src/ hostinger_deployment_v2/public/ hostinger_deployment_v2/package.json hostinger_deployment_v2/tsconfig.json hostinger_deployment_v2/.gitignore hostinger_deployment_v2/tailwind.config.js hostinger_deployment_v2/postcss.config.js
git add .claude/
git commit -m "Deploy: update source files"
git push origin main
```

If there is nothing to commit, skip to step 2.

### 2. Deploy to Hostinger via SSH

Run this single SSH command to pull, clean, build and restart:

```bash
ssh -o ConnectTimeout=30 root@168.231.116.32 "cd /var/www/project_management && git pull origin main && cd hostinger_deployment_v2 && rm -rf .next && npm run build 2>&1 | tail -10 && systemctl restart nextjs-pm && sleep 3 && systemctl status nextjs-pm --no-pager | head -5"
```

### 3. Verify deployment
After the SSH command completes:
- Check the systemctl status shows `active (running)`
- If the service failed, show the error logs: `ssh root@168.231.116.32 "journalctl -u nextjs-pm -n 30 --no-pager"`

### 4. Report result
Tell the user whether deployment succeeded or failed, and what URL to visit (focus-project.co.uk).

## Notes
- The deployment folder is always `hostinger_deployment_v2` (v2)
- Always clean `.next/` before building (`rm -rf .next`) for a fresh build
- Do NOT run `npm install` unless package.json changed — it's slow on the server
- If build fails, show the last 20 lines of build output for debugging
