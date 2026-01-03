# Server Deployment Scripts

This directory contains automated deployment scripts for each server environment.

## Available Scripts

### 1. Orient Production (`deploy-orient-production.sh`)
- **Server:** 10.245.2.246
- **User:** node
- **URL:** http://10.245.2.246:4002/portal/
- **Configuration:** orient

### 2. Orient Test (`deploy-orient-test.sh`)
- **Server:** 10.245.3.230
- **User:** uat
- **URL:** http://10.245.3.230:4002/portal/
- **Configuration:** orient

### 3. Wataniya Test (`deploy-wataniya-test.sh`)
- **Server:** 192.168.4.18
- **User:** system_admin
- **URL:** http://192.168.4.18:4200/
- **Configuration:** wataniya

### 4. Test Server (`deploy-test-server.sh`)
- **Server:** 165.227.174.138
- **User:** root
- **URL:** http://165.227.174.138/
- **Configuration:** production

## Usage

### Initial Setup (on each server)

1. **SSH into the server**
2. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url> Insurance-Portal
   cd Insurance-Portal
   ```

3. **Make the deployment script executable**:
   ```bash
   chmod +x deploy-*.sh
   ```

### Running a Deployment

Simply run the appropriate script:

```bash
# On Orient Production
./deploy-orient-production.sh

# On Orient Test
./deploy-orient-test.sh

# On Wataniya Test
./deploy-wataniya-test.sh

# On Test Server
./deploy-test-server.sh
```

The script will automatically:
1. ✅ Pull latest code from Git
2. ✅ Install/update dependencies
3. ✅ Build the project with correct configuration
4. ✅ Deploy to the web server
5. ✅ Set proper permissions
6. ✅ Reload the web server

## Deployment Process

Each script performs these steps:

1. **Git Pull:** Fetches and resets to the latest code from the main branch
2. **Dependencies:** Runs `npm install --legacy-peer-deps`
3. **Build:** Compiles the Angular app with the correct configuration and base-href
4. **Deploy:** Copies built files to the web server directory
5. **Permissions:** Sets appropriate file ownership and permissions
6. **Reload:** Reloads Nginx/Apache to serve the new files

## Troubleshooting

### Permission Errors
If you get permission errors, run with sudo:
```bash
sudo ./deploy-orient-production.sh
```

### Git Conflicts
The script uses `git reset --hard` to force sync with remote. Any local changes will be discarded.

### Custom Paths
If your project directory or web server paths are different, edit the script variables:
- Project directory: Update the `cd` command
- Web server path: Update the deployment `cp` commands
- Web server user: Update the `chown` command

## Build Commands Reference

For manual builds, use these commands:

**Orient Production:**
```bash
ng build --configuration=orient --optimization=false --base-href http://10.245.2.246:4002/portal/
```

**Orient Test:**
```bash
ng build --configuration=orient --optimization=false --base-href http://10.245.3.230:4002/portal/
```

**Wataniya Test:**
```bash
ng build --configuration=wataniya --optimization=false --base-href http://192.168.4.18:4200/
```

**Test Server:**
```bash
ng build --configuration=production --optimization=false --base-href http://165.227.174.138/
```

## Notes

- **Optimization is disabled** (`--optimization=false`) due to HTTPS/firewall restrictions on servers
- This makes initial page load slower but ensures successful builds
- To enable optimization, fix firewall rules to allow HTTPS (port 443) or build locally and upload
