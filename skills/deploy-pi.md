# Deploy to Pi

Deploy the current Joshua codebase from Mac to Raspberry Pi.

**IMPORTANT:** This skill is Joshua-project specific. Only run when working directory is `/Users/royfrenkiel/Documents/repos/Joshua`.

## Validation

Before executing, verify:
```bash
pwd
# Must be: /Users/royfrenkiel/Documents/repos/Joshua
```

If not in Joshua project → EXIT with message: "This command is only available in the Joshua project"

## What This Does

Automates the deployment workflow:
1. Run tests locally on Mac
2. Build the project
3. Commit changes to git (if requested)
4. Push to remote (main branch)
5. SSH to Pi and pull changes
6. Install dependencies (if package.json changed)
7. Build on Pi
8. Restart joshua systemd service
9. Verify service is running

## Prerequisites

- Mac repo: `/Users/royfrenkiel/Documents/repos/Joshua`
- Pi repo: `/home/royfrenk/Repos/Joshua`
- Pi hostname: `raspberrypi.local` or `pibot.local`
- SSH user: `royfrenk`
- Git remote configured (origin)

## Workflow

### Phase 1: Pre-deployment Checks (Mac)

1. **Check working directory:**
   ```bash
   git status
   ```
   - If uncommitted changes exist → Ask user if they want to commit first
   - If no changes → Proceed to tests

2. **Run tests:**
   ```bash
   npm test
   ```
   - If tests fail → Report errors and EXIT
   - If tests pass → Proceed

3. **Build project:**
   ```bash
   npm run build
   ```
   - If build fails → Report errors and EXIT
   - If build succeeds → Proceed

### Phase 2: Git Operations (Mac)

4. **Commit changes (if any):**
   - If user requested commit in Phase 1
   - Or if there are new untracked files from roadmap sync
   - Use standard git commit workflow (see ~/.claude/rules/coding-style.md)

5. **Push to remote:**
   ```bash
   git push origin main
   ```
   - If push fails → Report error and EXIT
   - If push succeeds → Proceed to Pi deployment

### Phase 3: Pi Deployment

6. **SSH to Pi and deploy:**

   First try `raspberrypi.local`, fallback to `pibot.local`:

   ```bash
   # Function to try deployment
   PI_HOST="raspberrypi.local"
   ssh -o ConnectTimeout=5 royfrenk@raspberrypi.local true 2>/dev/null || PI_HOST="pibot.local"

   ssh royfrenk@$PI_HOST << 'EOF'
   cd /home/royfrenk/Repos/Joshua
   git pull origin main

   # Check if package.json changed
   if git diff HEAD@{1} --name-only | grep -q package.json; then
     echo "📦 package.json changed, running npm install..."
     npm install
   fi

   npm run build
   sudo systemctl restart joshua
   sleep 2
   sudo systemctl status joshua --no-pager -l
   EOF
   ```

7. **Parse deployment result:**
   - Check for "Active: active (running)" in systemd status
   - If service failed to start → Report error and show logs
   - If service running → Report success

### Phase 4: Verification

8. **Check service logs:**
   ```bash
   ssh royfrenk@$PI_HOST "sudo journalctl -u joshua -n 30 --no-pager"
   ```
   - Look for startup messages (Telegram connected, integrations loaded, etc.)
   - If errors detected → Report to user
   - If clean startup → Confirm deployment successful

## Output Format

```
## Deploying to Pi

### Phase 1: Local Checks
✅ Tests passed (198/211 - 12 pre-existing phone test failures)
✅ Build succeeded

### Phase 2: Git Operations
✅ Committed roadmap sync changes (3 files)
✅ Pushed to main (commit: 88c911d)

### Phase 3: Pi Deployment
✅ Connected to Pi (pibot.local)
✅ Pulled latest changes
✅ Built successfully on Pi
✅ Joshua service restarted

### Phase 4: Verification
✅ Service status: active (running)
✅ Startup logs look clean

---

**Deployment complete!** Joshua is now running the latest code on Pi.

Test via Telegram to verify functionality.
```

## Error Handling

**If SSH fails:**
```
⚠️ Cannot reach Pi via SSH

Tried hostnames:
- raspberrypi.local ❌
- pibot.local ❌

Troubleshooting:
1. Is Pi powered on and connected to network?
2. Check SSH key: ssh royfrenk@raspberrypi.local
3. Verify Pi is on same network as Mac

Manual deployment:
1. SSH to Pi directly
2. cd /home/royfrenk/Repos/Joshua
3. git pull origin main
4. npm run build
5. sudo systemctl restart joshua
```

**If tests fail locally:**
```
❌ Tests failed - cannot deploy

Fix failing tests before deploying. Run:
npm test

Or skip tests with: /deploy-pi --skip-tests (not recommended)
```

**If service fails to start:**
```
❌ Joshua service failed to start on Pi

Last 30 log lines:
[Show journalctl output]

Common issues:
1. Missing .env credentials
2. Port already in use (kill old process)
3. Syntax errors in built code
4. Missing dependencies

Debug on Pi:
ssh royfrenk@pibot.local
sudo journalctl -u joshua -f
```

## Options

- `--skip-tests`: Skip local test run (not recommended)
- `--skip-build`: Skip local build (use if build is slow)
- `--no-commit`: Don't commit changes, just deploy existing HEAD

## Notes

- This command DOES NOT require Linear integration
- Always runs tests before deploying (safety check) unless --skip-tests
- Automatically handles npm install if package.json changed
- Service restart is automatic via systemd
- Safe to run multiple times (idempotent)
- Uses whichever Pi hostname responds first (raspberrypi.local or pibot.local)
