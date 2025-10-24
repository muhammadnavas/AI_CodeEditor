# Complete Deployment Guide: Vercel (Frontend) + Render (Backend)

This guide walks you through deploying your AI Code Editor with **frontend on Vercel** and **backend on Render**.

## Prerequisites

- [x] GitHub account with your code pushed
- [x] Vercel account (sign up at https://vercel.com)
- [x] Render account (sign up at https://render.com)
- [x] OpenAI API key (get from https://platform.openai.com/api-keys)

## Deployment Order

Deploy in this order to avoid configuration issues:

1. **Backend first** (Render) → Get backend URL
2. **Frontend second** (Vercel) → Use backend URL
3. **Update CORS** → Allow frontend to call backend

---

## Step 1: Deploy Backend to Render

### 1.1 Create Web Service

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub and select `muhammadnavas/AI_CodeEditor`
4. Click **"Connect"**

### 1.2 Configure Service

Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | `ai-code-editor-backend` (or your choice) |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free (or Starter $7/mo for Docker support) |

### 1.3 Add Environment Variables

Scroll down to **"Environment Variables"** and add:

```env
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=sk-your-actual-key-here
CORS_ORIGIN=*
```

**Note**: We'll update `CORS_ORIGIN` later with your actual Vercel URL.

### 1.4 Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Once deployed, copy your backend URL from the top of the page
   - Example: `https://ai-code-editor-backend.onrender.com`

### 1.5 Test Backend

Open in browser or use curl:
```bash
curl https://your-backend-url.onrender.com/health
```

Should return:
```json
{
  "status": "OK",
  "message": "AI Code Editor Backend is running",
  ...
}
```

✅ **Backend is live!** Save this URL for the next step.

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Import Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import"** next to `muhammadnavas/AI_CodeEditor`

### 2.2 Configure Project

Vercel auto-detects Next.js. Set these:

| Field | Value |
|-------|-------|
| **Framework Preset** | Next.js ✅ (auto-detected) |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Install Command** | `npm install` |

### 2.3 Add Environment Variable

Before deploying, add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-url.onrender.com` |

**Use the URL from Step 1.4!**

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Once deployed, copy your frontend URL
   - Example: `https://ai-code-editor.vercel.app`

✅ **Frontend is live!**

---

## Step 3: Update CORS Configuration

### 3.1 Update Backend CORS

1. Go back to Render Dashboard
2. Click on your backend service
3. Click **"Environment"** tab
4. Find `CORS_ORIGIN` and click "Edit"
5. Change from `*` to your Vercel URL:
   ```
   https://ai-code-editor.vercel.app
   ```
6. Click **"Save Changes"**
7. Service will automatically redeploy (~2 min)

### 3.2 Test the Connection

1. Open your Vercel URL in a browser
2. Try writing code and clicking "Run Code"
3. Try clicking "Generate Test" to test AI features

**If you see CORS errors**, double-check:
- Backend `CORS_ORIGIN` matches your frontend URL exactly
- No trailing slash in the URL
- HTTPS (not HTTP)

---

## Step 4: Custom Domain (Optional)

### For Frontend (Vercel)

1. Vercel Dashboard → Your Project → **"Settings"** → **"Domains"**
2. Add your domain (e.g., `myapp.com`)
3. Follow DNS setup instructions
4. Add both `myapp.com` and `www.myapp.com`

### For Backend (Render)

1. Render Dashboard → Your Service → **"Settings"** → **"Custom Domain"**
2. Add subdomain (e.g., `api.myapp.com`)
3. Update DNS with CNAME record

### Update Environment Variables

After adding custom domains:

**Backend (`CORS_ORIGIN`):**
```
https://myapp.com,https://www.myapp.com
```

**Frontend (`NEXT_PUBLIC_API_URL`):**
```
https://api.myapp.com
```

---

## Complete Configuration Summary

### Backend Environment Variables (Render)
```env
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=sk-proj-your-actual-key
CORS_ORIGIN=https://your-app.vercel.app
```

### Frontend Environment Variables (Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## Troubleshooting

### Issue: "Code execution failed"

**Cause**: Render Free tier doesn't support Docker socket access.

**Solutions**:
1. Upgrade to Render Starter plan ($7/mo)
2. Deploy backend to a VPS with Docker
3. Accept that code execution won't work on free tier (AI features still work)

### Issue: "CORS error" in browser console

**Cause**: Backend `CORS_ORIGIN` doesn't match frontend URL.

**Fix**:
1. Check exact frontend URL (including HTTPS, no trailing slash)
2. Update backend `CORS_ORIGIN` on Render
3. Wait for auto-redeploy (~2 min)

### Issue: "Request failed" or timeout

**Cause**: Render free tier sleeps after 15 min of inactivity.

**Behavior**: First request takes ~30 seconds (cold start), then fast.

**Fix**: Upgrade to paid plan for always-on service, or accept the delay.

### Issue: Build fails on Vercel

**Common causes**:
- Missing dependencies in `package.json`
- Environment variable not set
- Wrong root directory

**Fix**:
1. Check build logs in Vercel dashboard
2. Verify `frontend/` is set as root directory
3. Ensure `NEXT_PUBLIC_API_URL` is set

### Issue: API key errors

**Fix**:
1. Verify OpenAI API key is valid at https://platform.openai.com/api-keys
2. Check billing is active on OpenAI account
3. Ensure key is set in Render environment variables (not `.env` file)

---

## Monitoring & Logs

### Vercel Logs
1. Dashboard → Your Project → **"Deployments"**
2. Click on a deployment → **"Logs"**
3. View real-time Function logs

### Render Logs
1. Dashboard → Your Service → **"Logs"**
2. Real-time logs appear here
3. Filter by severity (Info, Error, etc.)

---

## Costs

### Vercel
- **Free (Hobby)**: Perfect for this project
  - Unlimited deployments
  - 100GB bandwidth/month
  - HTTPS included

### Render
- **Free**: Works but code execution won't work (no Docker)
  - Sleeps after 15 min inactivity
  - 750 hours/month
  
- **Starter ($7/mo)**: Recommended for full functionality
  - Docker support ✅
  - Always on (no sleep)
  - Faster performance

**Total Cost**: $0-7/month depending on your needs

---

## Automatic Deployments

Both platforms auto-deploy on git push:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

- **Render**: Auto-deploys backend in ~5 min
- **Vercel**: Auto-deploys frontend in ~2 min

Preview deployments:
- **Vercel**: Every PR gets a preview URL automatically
- **Render**: Manual preview deployments available

---

## Success Checklist

- [ ] Backend deployed to Render
- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend deployed to Vercel
- [ ] Frontend loads in browser
- [ ] CORS_ORIGIN updated on backend
- [ ] Can run code (if on paid Render plan)
- [ ] AI test generation works
- [ ] No console errors in browser

---

## Next Steps

1. **Monitor usage**: Check OpenAI API usage at https://platform.openai.com/usage
2. **Add features**: Push to git and watch auto-deployments
3. **Custom domain**: Add your own domain for branding
4. **Analytics**: Enable Vercel Analytics (Pro plan) for visitor tracking
5. **Upgrade**: Consider Render Starter plan for Docker code execution

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**Congratulations! Your AI Code Editor is now live!** 🎉🚀

- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.onrender.com`
