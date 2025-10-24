# Deploy Frontend to Vercel

## Quick Deploy (Recommended)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git push origin main
   ```

2. **Go to [Vercel Dashboard](https://vercel.com/)**

3. **Import Project**:
   - Click "Add New..." → "Project"
   - Import from GitHub: `muhammadnavas/AI_CodeEditor`
   - Vercel will auto-detect Next.js

## Project Configuration

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `.next` (auto-detected) |
| **Install Command** | `npm install` (auto-detected) |

## Environment Variables

Before deploying, add this environment variable:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-url.onrender.com` |

**Note**: You'll get the backend URL after deploying to Render. You can:
1. Deploy frontend first with a placeholder URL
2. Deploy backend to Render and get the URL
3. Update `NEXT_PUBLIC_API_URL` in Vercel settings
4. Redeploy frontend (Vercel has a "Redeploy" button)

## Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build & deployment
3. Copy your frontend URL: `https://your-app.vercel.app`
4. Go back to Render and update `CORS_ORIGIN` to this URL

## After First Deployment

### Update Backend URL

1. Go to Vercel Dashboard → Your Project
2. Click "Settings" → "Environment Variables"
3. Edit `NEXT_PUBLIC_API_URL` to your actual Render backend URL
4. Click "Save"
5. Go to "Deployments" tab → Click "..." → "Redeploy"

### Update CORS on Backend

1. Go to Render Dashboard → Your backend service
2. Click "Environment" tab
3. Update `CORS_ORIGIN` to your Vercel URL: `https://your-app.vercel.app`
4. Service will auto-redeploy

## Custom Domain (Optional)

1. Go to Vercel Project Settings → "Domains"
2. Add your custom domain (e.g., `myapp.com`)
3. Update DNS records as instructed
4. Update backend `CORS_ORIGIN` to include your custom domain

## Local Testing Against Production Backend

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

Then run:
```bash
cd frontend
npm run dev
```

## CLI Deployment (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel

# For production deployment
vercel --prod
```

## Automatic Deployments

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every pull request gets a preview URL
- **Instant Rollback**: One-click rollback to previous deployments

## Environment Variable Management

**Development vs Production:**
- Use `.env.local` for local development (not committed to git)
- Use Vercel dashboard for production environment variables
- `NEXT_PUBLIC_*` variables are embedded at build time

**Multiple Environments:**
```bash
# Production
NEXT_PUBLIC_API_URL=https://api.yourapp.com

# Preview (for testing)
NEXT_PUBLIC_API_URL=https://staging-api.yourapp.com

# Development
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Troubleshooting

**Build Fails:**
- Check build logs in Vercel dashboard
- Ensure `package.json` is in `frontend/` directory
- Verify all dependencies are listed in `package.json`

**Runtime Errors:**
- Check browser console for errors
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check Vercel Function logs for server-side errors

**CORS Errors:**
- Backend `CORS_ORIGIN` must include your Vercel URL
- Include both `https://your-app.vercel.app` and any custom domains
- For multiple origins, use comma-separated: `https://app1.vercel.app,https://app2.com`

**API Not Responding:**
- Render free tier sleeps after 15 min → first request takes ~30s (cold start)
- Consider upgrading Render to paid plan for always-on backend
- Check if backend is running: `curl https://your-backend-url.onrender.com/health`

## Performance Tips

1. **Enable Edge Network**: Vercel automatically uses global CDN
2. **Image Optimization**: Use Next.js `<Image>` component (already in your code)
3. **Code Splitting**: Next.js automatically splits code per route
4. **Caching**: Vercel caches static assets automatically

## Cost

- **Hobby Plan**: FREE (perfect for personal projects)
  - Unlimited deployments
  - HTTPS included
  - 100GB bandwidth/month
  - Serverless functions included

- **Pro Plan**: $20/month (if you need more)
  - More bandwidth
  - Analytics
  - Team features

## Monitoring

View real-time logs and analytics:
1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" → Select a deployment
3. View "Build Logs" and "Function Logs"
4. Check "Analytics" tab for visitor stats (Pro plan)

## Quick Reference

```bash
# Clone and test locally
git clone https://github.com/muhammadnavas/AI_CodeEditor.git
cd AI_CodeEditor/frontend
npm install
npm run dev

# Deploy to Vercel
vercel --prod

# View logs
vercel logs <deployment-url>
```

## Success! 🎉

Your frontend is now live at:
- **Production**: `https://your-app.vercel.app`
- **Auto-Deploy**: Every git push deploys automatically
- **Preview URLs**: Every PR gets a unique URL for testing

Next: Update your backend's `CORS_ORIGIN` to allow requests from your Vercel URL!
