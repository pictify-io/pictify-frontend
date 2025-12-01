# Background Remover Troubleshooting Guide

## ✅ Current Status

**Server**: Running on http://localhost:3000 ✅  
**Health Check**: Working ✅  
**Route**: `/background-removal` ✅  
**Authentication**: Cookie-based (session) ✅

---

## 🔍 Debugging Steps

### Step 1: Check Server is Running

```bash
curl http://localhost:3000/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-21T20:02:33.659Z",
  "uptime": 68.805577291
}
```

✅ **Confirmed**: Server is running!

### Step 2: Check Background Removal Route

```bash
curl http://localhost:3000/background-removal/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "service": "background-removal",
  "models": ["small", "medium", "large"],
  "defaultModel": "large",
  "timestamp": "2025-11-21T..."
}
```

### Step 3: Check Browser Console

1. Open your editor in browser
2. Open DevTools (F12)
3. Go to **Console** tab
4. Select an image
5. Click "Remove Background"
6. Look for these logs:

```
[Background Removal] Starting... { imageUrl: "...", model: "large", optimize: true }
[Background Removal] Success! { url: "...", ... }
[Background Removal] Complete!
```

**If you see errors**, check:
- What's the error message?
- What's the status code?
- Is there a CORS error?

---

## 🐛 Common Issues & Fixes

### Issue 1: "Please log in to use this feature"

**Cause**: Frontend can't find auth token

**Fix**: We're now using cookie-based auth via `backend.post()` which handles this automatically.

**Verify**:
1. Check you're logged in
2. Open DevTools → Application → Cookies
3. Look for `auth-token` cookie
4. Should have a value (UUID)

### Issue 2: 401 Unauthorized

**Possible Causes**:
1. Not logged in
2. Session expired
3. Cookie not being sent

**Debug**:
```javascript
// In browser console, check cookies
document.cookie
// Should see: "auth-token=..."
```

**Fix**:
1. Log out and log back in
2. Clear browser cache and cookies
3. Try in incognito mode (to rule out cached state)

### Issue 3: CORS Error

**Symptom**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause**: Frontend and backend on different domains without CORS setup

**Check**: Are both on localhost?
- Frontend: Usually http://localhost:5173 (Vite default)
- Backend: http://localhost:3000

**Fix**: Make sure CORS is configured in backend (should already be)

### Issue 4: Network Error / Cannot reach server

**Symptom**: "Failed to fetch" or "Network error"

**Causes**:
1. Backend server not running
2. Wrong port
3. Firewall blocking

**Debug**:
```bash
# Check server is running
curl http://localhost:3000/health

# Check specific endpoint
curl http://localhost:3000/background-removal/health
```

### Issue 5: "Background removal failed" / 500 Error

**Cause**: Server-side processing error

**Check Backend Logs**:
```bash
# If running in terminal, check output
# Look for error messages with "background_removal_error"
```

**Common Server Errors**:
- Out of memory (model too large for server)
- Image URL unreachable
- Invalid image format
- S3 upload failed

---

## 🔧 Verification Checklist

Run through this checklist:

### Frontend
- [ ] Logged in to your account
- [ ] Can see email in user menu/profile
- [ ] DevTools shows `auth-token` cookie
- [ ] Image is selected on canvas
- [ ] "Remove Background" button is visible
- [ ] Button is not grayed out

### Backend
- [ ] Server running (`curl http://localhost:3000/health`)
- [ ] Route loaded (`curl http://localhost:3000/background-removal/health`)
- [ ] Dependencies installed (`@imgly/background-removal`, `sharp`)
- [ ] AWS S3 configured (for upload)
- [ ] No errors in server logs

### Network
- [ ] Frontend can reach backend
- [ ] CORS configured correctly
- [ ] Cookies being sent (`credentials: 'include'`)
- [ ] No firewall blocking

---

## 🧪 Manual Test

### Test with curl (Authenticated Request)

**First**, get your session cookie:
1. Log in to your app in browser
2. Open DevTools → Application → Cookies
3. Copy the `auth-token` value

**Then**, test the API:

```bash
curl -X POST http://localhost:3000/background-removal \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_COOKIE_VALUE_HERE" \
  -d '{
    "imageUrl": "https://picsum.photos/500",
    "model": "large",
    "optimize": true
  }'
```

**Expected**: Should return URL with processed image

**If 401**: Cookie is invalid or expired - log in again

---

## 📊 What to Look For in Console

### Successful Request:

```
[Background Removal] Starting... 
  { imageUrl: "https://...", model: "large", optimize: true }

[Background Removal] Success! 
  { url: "https://bucket.s3.amazonaws.com/...", size: 123456, ... }

[Background Removal] Complete!
```

### Failed Request:

```
[Background Removal] Error: <error object>

[Background Removal] Error details: 
  { status: 401, message: "Unauthorized", stack: "..." }
```

**Look at**:
- `status`: HTTP status code (401, 429, 500, etc.)
- `message`: Error description
- Check if it's network, auth, or server error

---

## 🔍 Advanced Debugging

### Check Network Request in DevTools

1. Open DevTools → **Network** tab
2. Click "Remove Background" button
3. Look for request to `/background-removal`
4. Click on the request
5. Check:
   - **Headers** tab: Are cookies being sent?
   - **Response** tab: What's the error response?
   - **Status**: What's the HTTP status code?

### Check Cookies

```javascript
// In browser console
document.cookie
// Should show: "auth-token=<uuid>"
```

### Test Backend Service Directly

```javascript
// In browser console
import backend from '/src/service/backend.js';

backend.post('/background-removal', {
  imageUrl: 'https://picsum.photos/500',
  model: 'large',
  optimize: true
}).then(result => {
  console.log('Success:', result);
}).catch(error => {
  console.error('Error:', error);
});
```

---

## 🛠️ Quick Fixes

### Fix 1: Refresh Auth Session

```javascript
// Log out and back in
1. Click logout
2. Click login
3. Enter credentials
4. Try background removal again
```

### Fix 2: Clear Cache

```javascript
// Hard refresh
1. Cmd/Ctrl + Shift + R
2. Or clear browser cache completely
3. Log in again
4. Try feature
```

### Fix 3: Check Environment Variable

The backend URL should be correctly set:

```bash
# In .env.local
PUBLIC_BACKEND_URL=http://localhost:3000
```

**Restart frontend** if you change this!

---

## 📝 What We Fixed

### Previous Issues
1. ✅ Using wrong auth method (Bearer token instead of cookies)
2. ✅ Trying to get `authToken` from user store (doesn't exist)
3. ✅ Manual fetch instead of using `backend` service
4. ✅ Duplicate plugin registration causing server errors

### Current Implementation
1. ✅ Uses `backend.post()` service (handles cookies automatically)
2. ✅ Proper route structure with `decorateUser`
3. ✅ Health check endpoint working
4. ✅ Comprehensive error logging
5. ✅ Clear error messages for users

---

## 🎯 Next Steps to Debug

**If still getting error**, please:

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Click "Remove Background"** button
4. **Copy the error messages** from console
5. **Check Network tab** for the failed request
6. **Share the exact error** for further debugging

The console logs will show:
- Exact error message
- HTTP status code
- Whether request even reached the server
- Cookie/auth information

This will help identify the exact issue! 🔍

---

## ✅ Expected Working Flow

When everything works correctly:

1. User logs in → `auth-token` cookie set
2. User selects image → Properties panel shows button
3. User clicks "Remove Background" → Frontend calls `backend.post()`
4. Backend service includes cookie in request
5. Server validates cookie via `decorateUser`
6. Server processes image
7. Server uploads to S3
8. Server returns URL
9. Frontend loads new image
10. Canvas updates
11. Done! ✅

---

**Please try now and let me know what you see in the browser console!** 🔍


