---
phase: 07-deployment
plan: 02
subsystem: deployment
tags: nginx, ssl, dns, digitalocean, certbot, deployment

# Dependency graph
requires:
  - phase: 06-polish
    provides: polished UI with responsive design and accessibility features
  - phase: 07-deployment (07-01)
    provides: production build configuration with manual chunking
provides:
  - Deployed application at https://image-generator.mekaelturner.com
  - nginx web server configuration with API reverse proxy
  - SSL certificate with Let's Encrypt and auto-renewal
  - DNS configuration via DigitalOcean
  - Production API proxy handling DashScope authentication server-side
affects: deployment, infrastructure

# Tech tracking
tech-stack:
  added: nginx 1.24.0, certbot 2.9.0, doctl 1.108.0, Let's Encrypt SSL
  patterns:
    - nginx-only deployment (30-50MB RAM vs Node.js 200-300MB)
    - Server-to-server API proxy (no CORS issues)
    - Build locally, deploy static files via rsync
    - DNS management via DigitalOcean CLI

key-files:
  created: dist/ (production build), /etc/nginx/sites-available/image-generator (server)
  modified: src/lib/qwen-api.ts (use nginx proxy in production), /var/www/image-generator/ (server static files)

key-decisions:
  - "nginx-only deployment for RAM efficiency"
  - "Server-side API proxy to handle DashScope authentication"
  - "DigitalOcean DNS for domain management"
  - "Let's Encrypt with certbot for free SSL"
  - "Build locally on Raspberry Pi, upload static files"

patterns-established:
  - "nginx reverse proxy pattern for API authentication"
  - "SSL certificate automation with certbot"
  - "DNS as code via DigitalOcean CLI"

issues-created: []

# Metrics
duration: 47min
completed: 2026-01-09
---

# Phase 7 Plan 2: Deploy to nginx Server Summary

**Application deployed to https://image-generator.mekaelturner.com with nginx serving static files and proxying API calls to DashScope**

## Performance

- **Duration:** 47 min
- **Started:** 2026-01-09T03:22:00Z
- **Completed:** 2026-01-09T04:09:00Z
- **Tasks:** 5/5 (100%)
- **Files modified:** 1

## Accomplishments

- Built production bundle locally (dist/ with optimized chunks)
- Installed nginx 1.24.0 on mekaelturner server (2.3M RAM usage)
- Configured nginx to serve static React files with React Router support
- Set up nginx reverse proxy for DashScope API with server-side authentication
- Configured DNS A record via DigitalOcean (image-generator → 137.184.143.235)
- Obtained SSL certificate from Let's Encrypt with certbot
- Enabled HTTPS with HTTP-to-HTTPS redirect
- Configured SSL auto-renewal via systemd timer
- Fixed production API calls to use nginx proxy instead of direct DashScope API
- Verified end-to-end image generation functionality

## Task Commits

Each task was committed atomically:

1. **Task 1: Build production bundle locally** - No commit (dist/ in .gitignore)
2. **Task 2: Install nginx on server** - No commit (server configuration, not in repo)
3. **Task 3: Configure nginx API proxy** - No commit (server configuration, not in repo)
4. **Task 4: Configure DNS** - No commit (DigitalOcean DNS, not in repo)
5. **Task 5: Set up SSL certificate** - No commit (certbot-managed, not in repo)

**Fix applied during deployment:**
- **fix(07-02): use nginx proxy for production API calls** - `88dceda` (fix)

**Plan metadata:** (pending - will commit after this summary)

## Files Created/Modified

**Local Machine:**
- `dist/` - Production build output (not in git)
  - index.html, vite.svg
  - assets/index-CfQq6iUJ.js (17.65 kB)
  - assets/index-i8q7EFE5.css (21.39 kB)
  - assets/react-vendor-OskAq2oX.js (141.63 kB)
  - assets/pocketbase-l0sNRNKZ.js (0 bytes - empty chunk)

**Server (mekaelturner - 137.184.143.235):**
- `/var/www/image-generator/` - Web root with static files
- `/etc/nginx/sites-available/image-generator` - nginx configuration with API proxy
- `/etc/nginx/sites-enabled/image-generator` - Symlink to sites-available
- `/etc/letsencrypt/live/image-generator.mekaelturner.com/` - SSL certificates (fullchain.pem, privkey.pem)
- DigitalOcean DNS: A record for image-generator → 137.184.143.235 (ID: 1803582813)

**Code Changes:**
- `src/lib/qwen-api.ts` - Updated to use `/api/qwen` in both dev and production (nginx proxy handles DashScope API calls)

## Deployment URL

- **Production:** https://image-generator.mekaelturner.com
- **Server IP:** 137.184.143.235
- **SSL Certificate:** Valid until 2026-04-09 (auto-renewal enabled)

## Server Configuration

- **OS:** Ubuntu 24.04 LTS
- **Web Server:** nginx 1.24.0-2ubuntu7.5
- **SSL:** Let's Encrypt (certbot 2.9.0 with auto-renewal)
- **RAM Usage:** 2.3M baseline (well within 961MB limit)
- **Disk Usage:** ~196K for static files
- **DNS Provider:** DigitalOcean (ns1.digitalocean.com, ns2.digitalocean.com, ns3.digitalocean.com)

## nginx Configuration Highlights

```nginx
location /api/qwen/ {
    # Proxy to DashScope API
    proxy_pass https://dashscope.aliyuncs.com/api/v1/;

    # Add authentication header (API key stored server-side)
    proxy_set_header Authorization "Bearer sk-e91eaad373da4c27bdb56208c1c61fe8";
    proxy_set_header Host dashscope.aliyuncs.com;

    # SSL proxy settings
    proxy_ssl_server_name on;
    proxy_ssl_protocols TLSv1.2 TLSv1.3;

    # CORS headers
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

    # Handle OPTIONS preflight
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

## Decisions Made

**nginx-only deployment for RAM efficiency**
- Chose nginx (~30MB RAM) over Node.js backend (~200-300MB)
- Essential for 961MB RAM constraint on mekaelturner server
- Static file serving is highly efficient with nginx

**Server-side API proxy to handle DashScope authentication**
- nginx proxies `/api/qwen/` to DashScope API server-to-server
- Adds `Authorization: Bearer <API_KEY>` header automatically
- Eliminates CORS issues (server-to-server, no browser restrictions)
- API key stored securely on server (not exposed to client)

**Build locally, deploy static files**
- Build on Raspberry Pi (local development machine)
- Upload dist/ to server via rsync
- Faster than building on server with limited RAM

**DigitalOcean DNS for domain management**
- Used doctl CLI to configure DNS A record
- Instant propagation (no manual console access needed)
- API-driven, can be automated in future

**Let's Encrypt with certbot for free SSL**
- Automatic nginx configuration
- HTTP-to-HTTPS redirect
- Auto-renewal via systemd timer
- Zero-cost SSL certificates

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed production API calls using nginx proxy instead of direct DashScope API**

- **Found during:** Task 6 (Verification checkpoint - user reported "Request failed (0)")
- **Issue:** Production code was calling DashScope API directly (`https://dashscope.aliyuncs.com/api/v1`) instead of using nginx proxy (`/api/qwen`)
- **Root cause:** `getApiBaseUrl()` function returned direct API URL in production, causing:
  - Browser CORS errors (cross-origin requests to DashScope)
  - Network connectivity failures (peer closed connection during SSL handshake)
- **Fix:** Updated `src/lib/qwen-api.ts`:
  - Changed `getApiBaseUrl()` to always return `/api/qwen` (both dev and production)
  - Removed client-side `Authorization` header logic (nginx handles this server-side)
  - Removed unused `API_KEY` variable
- **Files modified:** `src/lib/qwen-api.ts`
- **Verification:**
  - Rebuilt production bundle
  - Redeployed to server
  - Tested API endpoint via curl: ✅ Successful image generation
  - User verified: ✅ "it's working"
- **Committed in:** `88dceda` (fix(07-02): use nginx proxy for production API calls)

### Authentication Gates

**1. DigitalOcean API Token**

- **Gate encountered:** Task 4 (DNS configuration)
- **Required action:** Provide DigitalOcean API token for doctl authentication
- **Resolution:** User provided DigitalOcean API token (removed for security)
- **Result:** Successfully created DNS A record via doctl CLI

### Expected Deviations

**DNS Configuration (Task 4)** - Expected authentication gate
- Plan anticipated manual DNS configuration
- Used DigitalOcean CLI (doctl) for automation instead
- User provided API token, automated DNS record creation

**SSL Certificate (Task 5)** - Expected dependency on Task 4
- Plan documented that SSL requires DNS propagation
- Waited for DNS to propagate (almost instant)
- Successfully obtained SSL certificate with certbot

---

**Total deviations:** 1 auto-fixed (bug - production API calls), 1 authentication gate (DigitalOcean token)
**Impact on plan:** Bug fix was critical for deployment success. Authentication gate resolved quickly with user collaboration.

## Issues Encountered

**1. Production API calls failing with "Request failed (0)"**

- **Problem:** Browser fetch requests to DashScope API failed
- **Root cause:** Code was calling API directly instead of using nginx proxy
- **Symptoms:**
  - Browser error: "Request failed (0)"
  - nginx logs: "peer closed connection in SSL handshake"
  - Multiple IP addresses attempted (IPv6 fallback failed)
- **Investigation:**
  - Tested nginx proxy via curl: ✅ Working
  - Identified `getApiBaseUrl()` returning wrong URL in production
  - Found direct API calls in production code
- **Solution:** Updated code to use nginx proxy, rebuilt, redeployed
- **Result:** User confirmed "it's working"

**2. DNS Propagation Delay**

- **Problem:** Local machine couldn't resolve image-generator.mekaelturner.com initially
- **Root cause:** DNS propagation takes 5-30 minutes globally
- **Workaround:** Server could resolve immediately (uses DigitalOcean DNS directly)
- **Solution:** Waited for propagation, tested from server side
- **Result:** DNS propagated quickly (~2 minutes), user could access site

**3. Initial nginx configuration missing SSL proxy settings**

- **Problem:** "peer closed connection in SSL handshake" errors
- **Root cause:** nginx SSL proxy configuration incomplete
- **Solution:** Added `proxy_ssl_server_name on`, `proxy_ssl_protocols TLSv1.2 TLSv1.3`
- **Result:** SSL handshake succeeded, API proxy working

## Next Phase Readiness

Ready for Phase 7 Plan 3: China Access Verification

**What's ready:**
- ✅ Application deployed at https://image-generator.mekaelturner.com
- ✅ HTTPS enabled with valid SSL certificate
- ✅ Image generation working end-to-end
- ✅ nginx proxy handling DashScope API calls
- ✅ All features functional (generate, display, download, start over)
- ✅ Mobile responsive design intact

**What Plan 07-03 will address:**
- Verify application is accessible from China network
- Test image generation performance from China
- Document any regional issues or optimizations needed
- Confirm DashScope API connectivity from China region

**Deployment verified:**
- Image generation works: ✅ User confirmed "it's working"
- API proxy functional: ✅ Test requests successful
- SSL certificate valid: ✅ Let's Encrypt active
- nginx serving static files: ✅ Application loads
- Mobile responsive: ✅ Design intact

**No blockers or concerns** - Deployment successful, ready for China access verification.

---
*Phase: 07-deployment*
*Completed: 2026-01-09*
