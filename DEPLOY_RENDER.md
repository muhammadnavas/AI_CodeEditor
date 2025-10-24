# Deploy Backend to Render

## Quick Deploy

1. **Push your code to GitHub** (if not already done):
   ```bash
   git push origin main
   ```

2. **Go to [Render Dashboard](https://dashboard.render.com/)**

3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `muhammadnavas/AI_CodeEditor`
   - Configure the service:

## Service Configuration

| Setting | Value |
|---------|-------|
| **Name** | `ai-code-editor-backend` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or Starter for better performance) |

## Environment Variables

Click "Advanced" → "Add Environment Variable" and add these:

```env
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
CORS_ORIGIN=https://your-frontend-app.vercel.app
```

**Important**: 
- Replace `OPENAI_API_KEY` with your real API key from https://platform.openai.com/api-keys
- After deploying frontend to Vercel, come back and update `CORS_ORIGIN` with your actual Vercel URL

## Docker Socket for Code Execution

⚠️ **Important Limitation**: Render's free tier doesn't allow Docker socket access (`/var/run/docker.sock`), which is needed for executing user code in Docker containers.

**Options:**
1. **Use Render Paid Plan** ($7/month) - Has Docker support
2. **Deploy Backend to a VPS** (DigitalOcean, AWS, etc.) with Docker
3. **Modify code execution** to use a different sandboxing approach (not recommended for production)

For now, the backend will deploy and work for AI features, but code execution will fail unless you're on a paid Render plan or VPS.

## Deploy

1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Copy your backend URL: `https://ai-code-editor-backend.onrender.com`
4. Use this URL when deploying frontend to Vercel

## After Deployment

Test the backend:
```bash
curl https://your-backend-url.onrender.com/health
```

You should see:
```json
{
  "status": "OK",
  "message": "AI Code Editor Backend is running",
  "docker": {
    "available": false,
    "message": "Docker not available on this platform"
  },
  "timestamp": "2025-10-24T..."
}
```

## Update Frontend CORS

After deploying frontend to Vercel:
1. Go back to Render dashboard
2. Click on your service → "Environment"
3. Update `CORS_ORIGIN` to your Vercel URL: `https://your-app.vercel.app`
4. Service will auto-redeploy

## Troubleshooting

**Build fails:**
- Check "Logs" tab for errors
- Ensure `package.json` is in `backend/` directory
- Verify Node version compatibility (uses latest by default)

**API errors:**
- Verify `OPENAI_API_KEY` is set correctly
- Check CORS_ORIGIN matches your frontend URL
- Review application logs

**Code execution doesn't work:**
- This is expected on free tier (no Docker access)
- Upgrade to paid plan or use VPS deployment

## Cost

- **Free Tier**: $0/month (service sleeps after 15 min inactivity, cold starts ~30s)
- **Starter Plan**: $7/month (always on, faster, Docker support)

## Auto-Deploy

Render automatically redeploys when you push to `main` branch! 🎉
