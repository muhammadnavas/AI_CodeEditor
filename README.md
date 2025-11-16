# 🚀 AI CodeEditor - Intelligent Coding Assessment Platform

A comprehensive full-stack platform for conducting AI-powered coding assessments with real-time code execution, multi-language support, and automated evaluation.

## ✨ Features

### 🎯 **Core Functionality**
- **Live Coding Assessment**: Real-time coding tests with timer and auto-submission
- **Multi-Language Support**: JavaScript, Python, Java, C++, TypeScript
- **Cloud Code Execution**: Judge0 API integration with local fallbacks
- **AI-Powered Analysis**: Intelligent code evaluation and feedback
- **Question Bank**: LeetCode/HackerEarth style programming challenges
- **Candidate Management**: Complete assessment workflow from setup to results

### 🔧 **Technical Capabilities**
- **Monaco Code Editor**: VS Code-like editing experience with syntax highlighting
- **Real-time Test Execution**: Run sample test cases during assessment
- **Automatic Timeout Handling**: Submit incomplete solutions when time expires
- **Session Management**: Persistent test sessions with candidate tracking
- **Database Integration**: MongoDB for candidate data and test results
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 📊 **Assessment Features**
- **Multiple Difficulty Levels**: Easy, Medium, Hard questions
- **Sample Test Cases**: Preview expected input/output before submission
- **Live Code Testing**: Run code against sample tests during development
- **Progress Tracking**: Question counter, timer, and completion status
- **Professional UI**: Clean, distraction-free assessment environment

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │    Database     │
│   (Next.js)     │◄──►│   (Express.js)   │◄──►│   (MongoDB)     │
│                 │    │                  │    │                 │
│ • React UI      │    │ • REST API       │    │ • Candidates    │
│ • Monaco Editor │    │ • Code Execution │    │ • Questions     │
│ • Timer System  │    │ • AI Integration │    │ • Test Results  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  Code Execution  │
                    │                  │
                    │ • Judge0 API     │
                    │ • Local Compilers│
                    │ • Docker Support │
                    └──────────────────┘
```

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 with React 18
- **Styling**: TailwindCSS for modern UI components
- **Code Editor**: Monaco Editor (VS Code engine)
- **Icons**: Lucide React for consistent iconography
- **HTTP Client**: Fetch API with custom service layer

### Backend
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Code Execution**: Judge0 API + local compiler fallbacks
- **Security**: CORS, input validation, rate limiting
- **Session Management**: In-memory sessions with MongoDB persistence

### Infrastructure
- **Deployment**: Render (backend) + Vercel (frontend)
- **Code Execution**: Judge0 cloud service with free tier fallback
- **Database Hosting**: MongoDB Atlas or local MongoDB
- **Environment Management**: dotenv for configuration

## 📋 Prerequisites

- **Node.js**: Version 18.0 or higher
- **MongoDB**: Local installation or MongoDB Atlas account
- **Package Manager**: npm or yarn
- **Git**: For version control
- **Code Editor**: VS Code recommended

## 🔧 Quick Start

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/muhammadnavas/AI_CodeEditor.git
cd AI_CodeEditor

# Install all dependencies
npm run install-all
# Or manually:
# cd backend && npm install
# cd ../frontend && npm install
```

### 2. Environment Configuration

#### Backend Environment (`.env`)
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ai_codeeditor
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai_codeeditor

# Judge0 Configuration (Optional - has free fallback)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your-rapidapi-key
JUDGE0_FREE_API_URL=https://judge0-ce.p.rapidapi.com

# Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:3000,https://your-frontend-domain.com
NODE_ENV=development
```

#### Frontend Environment (`.env.local`)
```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
# For production: https://your-backend-domain.com
```

### 3. Database Setup

#### Local MongoDB
```bash
# Start MongoDB service
# macOS: brew services start mongodb/brew/mongodb-community
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod

# Verify connection
mongosh
# Should connect to mongodb://localhost:27017
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server starts at http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Application available at http://localhost:3000
```

## 📚 Usage Guide

### For Test Administrators

#### 1. Add Candidates to Database
```bash
# Add candidate with coding questions
cd backend
node insert_candidate.js
```

#### 2. Create Assessment Sessions
Candidates can start assessments using:
- **Candidate ID**: `CAND_001`, `CAND_002`, etc.
- **URL Parameters**: `?candidateId=CAND_001`
- **Programmatic**: `window.startCodingTest('CAND_001')`

#### 3. Monitor and Review Results
Test results are automatically saved to the `shortlistedcandidates` collection with comprehensive data including:
- Code submissions for each question
- Time spent per question
- Scores and performance metrics
- Test completion status

### For Candidates

#### 1. Access Assessment
- Open the assessment URL provided
- Enter your Candidate ID (e.g., `CAND_001`)
- Click "Start Coding Test"

#### 2. Take Assessment
- Read problem statement carefully
- Write code in the Monaco editor
- Select programming language (JavaScript, Python, Java, C++)
- Use "Run Code" to test against sample cases
- Click "Submit Code" when ready
- Complete all questions within time limits

#### 3. Assessment Completion
- Automatic submission when time expires
- Simple "Test Ended" message displayed
- Results saved automatically for review

⚠️ **Production Security Checklist:**
- [ ] Use HTTPS for all production endpoints
- [ ] Implement API rate limiting
- [ ] Set strong MongoDB authentication
- [ ] Use environment-specific CORS origins
- [ ] Enable MongoDB Atlas IP whitelisting
- [ ] Monitor Judge0 API usage and costs
- [ ] Implement request logging and monitoring

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Follow code style guidelines (ESLint + Prettier configured)
4. Add tests for new functionality
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open Pull Request with detailed description

### Code Style Guidelines
- Use ES6+ JavaScript features
- Follow React best practices for frontend
- Implement proper error handling
- Add JSDoc comments for functions
- Use meaningful variable and function names

## 📞 Support & Community

- **GitHub Issues**: [Report bugs or request features](https://github.com/muhammadnavas/AI_CodeEditor/issues)
- **Email**: Contact maintainers for enterprise support

## 🗺️ Roadmap

### Upcoming Features
- [ ] Real-time collaboration on code
- [ ] Video proctoring integration
- [ ] Advanced AI code review
- [ ] Custom question bank import
- [ ] Detailed analytics dashboard
- [ ] White-label customization
- [ ] Mobile app development
- [ ] Integration with ATS systems

---

**Built with ❤️ by the AI CodeEditor team**
