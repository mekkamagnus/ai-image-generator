# Complete Deployment Guide

## Current Status
✅ Tasks 1-3 Complete (Build, nginx, API Proxy)
⏳ Tasks 4-5 Pending (DNS configuration, SSL)

---

## Quick Actions to Complete Deployment

### Step 1: Configure DNS (Do This Now!)

**Access your DNS provider** (where mekaelturner.com is registered) and add:

**A Record:**
- **Name/Host:** `image-generator`
- **Type:** `A`
- **Value/Target:** `137.184.143.235`
- **TTL:** `3600` (or default)

**Save the DNS record.**

---

### Step 2: Wait for DNS Propagation (5-30 minutes)

**Test if DNS is working:**
```bash
# From your local machine (Raspberry Pi)
curl -I http://image-generator.mekaelturner.com

# Should return:
# HTTP/1.1 200 OK
# Server: nginx
```

**If you get "Could not resolve host", DNS hasn't propagated yet. Wait a few more minutes.**

---

### Step 3: Obtain SSL Certificate (After DNS Works)

**Once DNS is working, run:**
```bash
ssh mekaelturner "certbot --nginx -d image-generator.mekaelturner.com --non-interactive --agree-tos --email mekaelturner@gmail.com --redirect"
```

**Expected output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/image-generator.mekaelturner.com/fullchain.pem
Deploying certificate
Enhancing nginx configuration
Redirecting vhost in /etc/nginx/sites-enabled/image-generator to ssl vhost
```

---

### Step 4: Verify Deployment

**Visit:** https://image-generator.mekaelturner.com

**Test the application:**
1. ✅ Page loads (no security warnings)
2. ✅ HTTPS works (padlock icon in browser)
3. ✅ Enter prompt: "a beautiful sunset over mountains"
4. ✅ Click "Generate Image"
5. ✅ Wait 1-2 minutes for image generation
6. ✅ Image displays successfully
7. ✅ Download button works
8. ✅ Start over button works

**Check browser console:**
- No CORS errors
- No API errors
- All assets load correctly

**Check Network tab:**
- /api/qwen/ requests return 200 OK
- Authorization header is present

---

## Troubleshooting

### DNS Not Propagating

**Check from different places:**
```bash
# Check from local machine
curl -I http://image-generator.mekaelturner.com

# Check from server
ssh mekaelturner "curl -I http://image-generator.mekaelturner.com"

# Check from online tool
# Visit: https://www.whatsmydns.net/A/image-generator.mekaelturner.com
```

### SSL Certificate Fails

**Common errors and fixes:**

**Error:** "DNS problem: NXDOMAIN"
- **Fix:** DNS not propagated yet. Wait longer and try again.

**Error:** "Failed to connect to ... for authorization"
- **Fix:** Firewall blocking port 80. Run:
  ```bash
  ssh mekaelturner "ufw allow 80/tcp && ufw allow 443/tcp"
  ```

### Image Generation Not Working

**Check nginx config:**
```bash
ssh mekaelturner "cat /etc/nginx/sites-available/image-generator | grep -A 15 'location /api/qwen'"
```

**Should show:**
- proxy_pass to https://dashscope.aliyuncs.com/api/v1/
- Authorization header with API key

**Check nginx logs:**
```bash
ssh mekaelturner "tail -f /var/log/nginx/error.log"
```

**Test API proxy directly:**
```bash
curl -X POST https://image-generator.mekaelturner.com/api/qwen/services/aigc/text2image/generation \
  -H "Content-Type: application/json" \
  -d '{"model":"flux-schnell","input":{"prompt":"test image"}}'
```

---

## Server Details

**SSH Access:**
```bash
ssh mekaelturner
```

**Web Root:**
```bash
/var/www/image-generator
```

**Nginx Config:**
```bash
/etc/nginx/sites-available/image-generator
```

**Reload nginx:**
```bash
ssh mekaelturner "nginx -t && systemctl reload nginx"
```

**Check nginx status:**
```bash
ssh mekaelturner "systemctl status nginx"
```

**View nginx logs:**
```bash
ssh mekaelturner "tail -f /var/log/nginx/access.log"
ssh mekaelturner "tail -f /var/log/nginx/error.log"
```

---

## Deployment URL

**Production:** https://image-generator.mekaelturner.com
**Server IP:** 137.184.143.235
**Server:** mekaelturner.com (DigitalOcean Ubuntu 24.04)

---

## What's Already Done ✅

1. ✅ Production build created locally (dist/)
2. ✅ nginx installed on server (1.24.0)
3. ✅ Static files uploaded to /var/www/image-generator/
4. ✅ nginx configured for React Router (try_files)
5. ✅ nginx configured for API proxy to DashScope
6. ✅ DashScope API key configured in nginx
7. ✅ CORS headers configured
8. ✅ Security headers configured
9. ✅ Asset caching configured (1 year)
10. ✅ certbot installed (ready for SSL)

## What's Left ⏳

1. ⏳ Configure DNS A record (image-generator → 137.184.143.235)
2. ⏳ Wait for DNS propagation (5-30 minutes)
3. ⏳ Obtain SSL certificate with certbot
4. ⏳ Verify HTTPS works
5. ⏳ Test image generation end-to-end
6. ⏳ Test all features (generate, download, start over)
7. ⏳ Test mobile responsive design

---

## Estimated Time to Complete

- DNS configuration: **2 minutes**
- DNS propagation: **5-30 minutes**
- SSL certificate: **2 minutes**
- Verification testing: **5 minutes**

**Total: ~15-40 minutes** (mostly waiting for DNS propagation)

---

**After completing these steps, proceed to Task 6 (Checkpoint) in the deployment plan.**
