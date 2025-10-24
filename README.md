# AI Code Editor

A full-stack AI-powered code editor with real-time code execution and AI assistance.

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, Monaco Editor
- **Backend**: Node.js, Express, OpenAI API
- **Infrastructure**: Docker
- **Code Execution**: Docker containers for Python, JavaScript, Java, C++

## 📋 Prerequisites

- Node.js 18+ (for local development)
- Docker & Docker Compose (for production deployment)
- OpenAI API Key

## 🔧 Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/muhammadnavas/AI_CodeEditor.git
cd AI_CodeEditor
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-your-actual-key-here
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local if needed (default: http://localhost:3001)
```

### 4. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Access the application:
- Frontend: http://localhost:5000
- Backend API: http://localhost:3001

## 🐳 Docker Production Deployment

### Option 1: Docker Compose (Recommended for VPS)

1. **Set Environment Variables**

```bash
cd backend

# Copy and edit .env file
cp .env.example .env
```

Edit `.env` and set:
```env
OPENAI_API_KEY=sk-your-actual-openai-key
CORS_ORIGIN=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NODE_ENV=production
```

2. **Build and Start Services**

```bash
cd backend
docker compose up -d --build
```

3. **Verify Services**

```bash
# Check running containers
docker compose ps

# View logs
docker compose logs -f

# Test backend health
curl http://localhost:3001/health
```

4. **Stop Services**

```bash
docker compose down
```

### Option 2: Deploy to Cloud Platforms

#### **Railway** (Easiest)

1. Push code to GitHub
2. Connect Railway to your repo
3. Create two services:
   - **Backend**: Root directory = `backend/`, Start command = `npm start`
   - **Frontend**: Root directory = `frontend/`, Start command = `npm start`
4. Add environment variables for each service
5. Railway will auto-deploy on push

#### **Render**

1. Create two Web Services:
   - **Backend**:
     - Build Command: `cd backend && npm install`
     - Start Command: `cd backend && npm start`
   - **Frontend**:
     - Build Command: `cd frontend && npm install && npm run build`
     - Start Command: `cd frontend && npm start`

2. Add PostgreSQL and Redis from Render's Add-ons *(Optional - not currently used)*

3. Set environment variables from `.env.example`

#### **Vercel + Backend on VPS**

**Frontend (Vercel):**
```bash
cd frontend
vercel --prod
```

**Backend (DigitalOcean/AWS/etc):**
```bash
# On your VPS
git clone <repo>
cd AI_CodeEditor/backend
cp .env.example .env
# Edit .env
docker compose up -d --build
```

## 🔒 Security Checklist

- [ ] ✅ `.env` files are in `.gitignore`
- [ ] ✅ Change default database passwords
- [ ] ✅ Add your domain to `CORS_ORIGIN`
- [ ] ⚠️  **CRITICAL**: Never commit real API keys to git!
- [ ] ✅ Use strong random strings for `API_KEY`
- [ ] ✅ Enable HTTPS in production
- [ ] ✅ Set `NODE_ENV=production`

## 🛠️ Environment Variables

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key for AI features |
| `PORT` | No | Backend port (default: 3001) |
| `CORS_ORIGIN` | Yes | Allowed frontend origins |
| `NODE_ENV` | Yes | `development` or `production` |

### Frontend (.env.local)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Backend API URL |

## 📡 API Endpoints

- `GET /health` - Health check
- `POST /api/code/execute` - Execute code
- `POST /api/test/generate` - Generate AI tests
- `POST /setup-docker` - Pull code execution images

## 🐛 Troubleshooting

### Docker Issues

```bash
# Check Docker is running
docker ps

# View container logs
docker compose logs backend
docker compose logs frontend

# Restart services
docker compose restart

# Rebuild from scratch
docker compose down -v
docker compose up -d --build
```

### Port Conflicts

If ports 3000/3001 are in use:
```bash
# Change in backend/.env
PORT=3002

# Change in docker-compose.yml
ports:
  - "3002:3001"
```

### OpenAI API Errors

- Verify API key is valid
- Check billing/quota on OpenAI dashboard
- Ensure `OPENAI_API_KEY` is set correctly

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📧 Support

For issues and questions, please open a GitHub issue.

---

**⚠️ SECURITY WARNING**: Your `.env` file currently contains a real OpenAI API key! Please:
1. Revoke the exposed key at https://platform.openai.com/api-keys
2. Generate a new key
3. Run: `git rm --cached backend/.env`
4. Add `.env` to `.gitignore` (already done)
5. Never commit `.env` files again
