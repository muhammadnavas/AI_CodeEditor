require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { helmetConfig, apiLimiter, requestSizeLimiter } = require('./middleware/security');
const codeRunner = require('./services/codeRunner');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Security Middleware
app.use(helmetConfig);
app.use(apiLimiter);

// CORS Configuration
// Build the allowed origins list from env or sensible defaults
const defaultFrontend = process.env.FRONTEND_URL || 'https://ai-code-editor-psi-two.vercel.app';
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5000', defaultFrontend];

// Log allowed origins on startup to help with debugging
console.log('[CORS] Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, mobile, etc.)
    if (!origin) return callback(null, true);

    // Allow wildcard
    if (allowedOrigins.includes('*')) return callback(null, true);

    // Exact match
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Not allowed - log for diagnostics and deny
    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204,
  preflightContinue: false
};

// Ensure preflight OPTIONS are handled
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Log incoming origins for easier debugging in hosted environments
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) console.log(`[CORS] Incoming request from origin=${origin} path=${req.path}`);
  next();
});

// Body parsing with size limits
app.use(express.json(requestSizeLimiter.json));
app.use(express.urlencoded(requestSizeLimiter.urlencoded));

// Routes
app.use('/api/code', require('./routes/code'));
app.use('/api/test', require('./routes/test'));

// Health check endpoint
app.get('/health', async (req, res) => {
  const dockerStatus = await codeRunner.checkDocker();
  res.json({ 
    status: 'OK', 
    message: 'AI Code Editor Backend is running',
    docker: dockerStatus,
    timestamp: new Date().toISOString()
  });
});

// Docker setup endpoint
app.post('/setup-docker', async (req, res) => {
  try {
    const dockerStatus = await codeRunner.checkDocker();
    
    if (!dockerStatus.available) {
      return res.status(503).json({
        error: 'Docker not available',
        message: dockerStatus.message,
        instructions: 'Please install Docker Desktop and ensure it is running'
      });
    }

    const pullResults = await codeRunner.pullImages();
    res.json({
      message: 'Docker images pulled successfully',
      results: pullResults
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to setup Docker',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;