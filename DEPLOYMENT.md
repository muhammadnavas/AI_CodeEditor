# 🚀 Deployment Configuration

## Current Deployment URLs

- **Frontend (Vercel)**: https://ai-code-editor-psi-two.vercel.app
- **Backend (Render)**: https://ai-codeeditor.onrender.com

---

## ✅ Deployment Checklist

### Backend (Render) - https://render.com

**Service**: `ai-codeeditor`  
**URL**: https://ai-codeeditor.onrender.com

#### Environment Variables to Set:

```env
OPENAI_API_KEY=sk-proj-your-actual-key-here
NODE_ENV=production
PORT=3001
CORS_ORIGIN=http://localhost:3000,http://localhost:5000,https://ai-code-editor-psi-two.vercel.app
```

#### Settings:
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: Free

#### Steps to Update CORS:
1. Go to https://dashboard.render.com
2. Select your service `ai-codeeditor`
3. Go to **Environment** tab
4. Update `CORS_ORIGIN` to include: `https://ai-code-editor-psi-two.vercel.app`
5. Click **Save Changes**
6. Service will auto-redeploy

---

### Frontend (Vercel) - https://vercel.com

**Project**: `ai-code-editor`  
**URL**: https://ai-code-editor-psi-two.vercel.app

#### Environment Variables to Set:

```env
NEXT_PUBLIC_API_URL=https://ai-codeeditor.onrender.com
```

#### Steps to Update:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add/Update `NEXT_PUBLIC_API_URL` = `https://ai-codeeditor.onrender.com`
5. Select all environments (Production, Preview, Development)
6. Click **Save**
7. Go to **Deployments** tab
8. Click ⋯ on latest deployment → **Redeploy**

---

## 🔧 Current Issue: CORS Error

### Problem
Your frontend is trying to call:
```
https://your-api-domain.com/api/test/start-session
```

This is happening because `NEXT_PUBLIC_API_URL` is not set correctly in Vercel.

### Solution

#### Option 1: Update via Vercel Dashboard (Recommended)
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Set: `NEXT_PUBLIC_API_URL` = `https://ai-codeeditor.onrender.com`
3. Redeploy

#### Option 2: Update via Local File & Push
```bash
# Create/update frontend/.env.production
echo "NEXT_PUBLIC_API_URL=https://ai-codeeditor.onrender.com" > frontend/.env.production

# Commit and push
git add frontend/.env.production
git commit -m "fix: set production API URL for Vercel"
git push origin main
```

---

## 🧪 Testing After Deployment

### 1. Test Backend Health
```bash
curl https://ai-codeeditor.onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "AI Code Editor Backend is running",
  "docker": {...},
  "timestamp": "2025-10-24T..."
}
```

### 2. Test CORS
Open browser console on https://ai-code-editor-psi-two.vercel.app and run:
```javascript
fetch('https://ai-codeeditor.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Should return the health check data without CORS errors.

### 3. Test Code Execution
1. Visit https://ai-code-editor-psi-two.vercel.app
2. Select a language (e.g., Python)
3. Write simple code: `print("Hello World")`
4. Click "Run Code"
5. Should see output in console

---

## 🐛 Troubleshooting

### CORS Error Still Happening?

**Check Backend Logs on Render:**
1. Go to Render Dashboard
2. Click your service
3. Click **Logs** tab
4. Look for CORS-related errors

**Verify Environment Variables:**
```bash
# Backend on Render should have:
CORS_ORIGIN=https://ai-code-editor-psi-two.vercel.app

# Frontend on Vercel should have:
NEXT_PUBLIC_API_URL=https://ai-codeeditor.onrender.com
```

### Backend Not Responding?

**Render Free Tier Sleeps After Inactivity:**
- First request after sleep takes ~30 seconds
- Subsequent requests are fast
- Consider upgrading to paid tier for always-on

**Check if Backend is Running:**
```bash
curl https://ai-codeeditor.onrender.com/health
```

### Frontend Shows Wrong URL?

**Clear Vercel Build Cache:**
1. Go to Vercel Dashboard
2. Settings → General
3. Scroll to "Build & Development Settings"
4. Click "Clear Build Cache"
5. Redeploy

---

## 📝 Quick Reference

| Service | URL | Environment |
|---------|-----|-------------|
| Frontend Dev | http://localhost:5000 | Local |
| Backend Dev | http://localhost:3001 | Local |
| Frontend Prod | https://ai-code-editor-psi-two.vercel.app | Vercel |
| Backend Prod | https://ai-codeeditor.onrender.com | Render |

---

## 🔄 Deployment Workflow

### When You Make Changes:

1. **Test Locally:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Commit & Push:**
   ```bash
   git add .
   git commit -m "feat: your change description"
   git push origin main
   ```

3. **Auto-Deploy:**
   - Vercel auto-deploys frontend on push
   - Render auto-deploys backend on push

---

## 🎯 Next Steps

- [ ] Update `CORS_ORIGIN` in Render backend
- [ ] Update `NEXT_PUBLIC_API_URL` in Vercel frontend
- [ ] Redeploy frontend on Vercel
- [ ] Test the app at https://ai-code-editor-psi-two.vercel.app
- [ ] Monitor logs for any errors

---

**Last Updated**: October 24, 2025
