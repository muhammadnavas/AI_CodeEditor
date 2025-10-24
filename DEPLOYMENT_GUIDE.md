# Deployment Checklist - Vercel + Render

## Current Issue
❌ Frontend is calling `https://your-api-domain.com` (placeholder URL)
❌ CORS error - backend not allowing Vercel origin

## ✅ Step-by-Step Fix

### 1. Deploy Backend to Render (5 minutes)

1. Go to https://render.com
2. **New +** → **Web Service**
3. Connect GitHub: `muhammadnavas/AI_CodeEditor`
4. Configure:
   ```
   Name: ai-code-editor-backend
   Root Directory: backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

5. **Environment Variables** (click "Add Environment Variable"):
   ```
   OPENAI_API_KEY=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
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://ai-code-editor-psi-two.vercel.app
   ```

6. Click **"Create Web Service"**
7. Wait 3-5 minutes for deployment
8. **Copy the URL** (e.g., `https://ai-code-editor-backend.onrender.com`)

### 2. Update Vercel Frontend (2 minutes)

1. Go to https://vercel.com/dashboard
2. Find project: **ai-code-editor**
3. **Settings** → **Environment Variables**
4. Add new variable:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://ai-code-editor-backend.onrender.com
   ```
   (Use your actual Render URL from step 1)

5. **Deployments** tab
6. Latest deployment → three dots ⋯ → **"Redeploy"**
7. Wait 2-3 minutes

### 3. Test the Connection

1. Open: `https://ai-code-editor-psi-two.vercel.app`
2. Open browser DevTools (F12)
3. Try executing code
4. Check Console - should see successful API calls

### 4. Troubleshooting

**If still getting CORS errors:**

1. Check Render logs:
   - Render dashboard → your service → **Logs**
   - Look for CORS errors

2. Verify environment variables:
   - Render: Check `CORS_ORIGIN` matches your Vercel URL exactly
   - Vercel: Check `NEXT_PUBLIC_API_URL` matches your Render URL exactly

3. Update CORS_ORIGIN on Render if needed:
   ```
   CORS_ORIGIN=https://ai-code-editor-psi-two.vercel.app,https://your-custom-domain.com
   ```

**If backend shows "Docker not available":**
- This is expected on Render's free tier
- Code execution won't work (requires Docker)
- AI features will still work
- Consider Railway or DigitalOcean for Docker support

## 📋 Quick Reference

**Frontend (Vercel):**
- URL: https://ai-code-editor-psi-two.vercel.app
- Env: `NEXT_PUBLIC_API_URL`

**Backend (Render):**
- URL: (you'll get this after deployment)
- Env: `OPENAI_API_KEY`, `NODE_ENV`, `CORS_ORIGIN`

## 🚀 After Deployment

Your `.env` file should look like:
```env
# Backend .env (on Render)
OPENAI_API_KEY=sk-proj-xxx
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://ai-code-editor-psi-two.vercel.app

# Frontend .env (on Vercel)
NEXT_PUBLIC_API_URL=https://ai-code-editor-backend.onrender.com
```

## ⚠️ Important Notes

1. **Render free tier sleeps after inactivity** - first request takes 30-60s
2. **Docker code execution won't work on Render free tier** - upgrade to paid or use Railway
3. **OpenAI API key is exposed in your .env** - consider regenerating it after deployment
4. **Always use HTTPS URLs** in production

## 🎯 Expected Result

✅ Frontend loads without errors
✅ Can type code in editor
✅ AI features work (test generation)
⚠️ Code execution may fail (needs Docker)
✅ CORS errors resolved
