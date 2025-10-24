require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { helmetConfig, apiLimiter, requestSizeLimiter } = require('./middleware/security');
const codeRunner = require('./services/codeRunner');
const { connectToDB } = require('./services/db');

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
const rawOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000', 'http://localhost:5000', defaultFrontend];

// Normalization helper: trim, remove wrapping quotes, remove trailing slashes, lowercase
function normalizeOrigin(o) {
  if (!o || typeof o !== 'string') return '';
  let s = o.trim();
  // remove surrounding quotes if present
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.substring(1, s.length - 1).trim();
  }
  // remove trailing slashes
  s = s.replace(/\/+$/, '');
  return s;
}

const allowedOrigins = rawOrigins.map(normalizeOrigin).filter(Boolean);
console.log('[CORS] Allowed origins (normalized):', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, mobile, etc.)
    if (!origin) return callback(null, true);

    const normalizedIncoming = normalizeOrigin(origin);

    // Allow wildcard
    if (allowedOrigins.includes('*')) return callback(null, true);

    // Exact match
    if (allowedOrigins.indexOf(normalizedIncoming) !== -1) {
      return callback(null, true);
    }

    // Not allowed - log for diagnostics and DENY (no CORS headers will be set)
    console.warn(`[CORS] Blocked origin: ${origin} (normalized: ${normalizedIncoming})`);
    // Do not throw an error here; respond without CORS headers so the browser will block.
    return callback(null, false);
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

// Log incoming origins for easier debugging in hosted environments and return a clear 403 JSON
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) console.log(`[CORS] Incoming request from origin=${origin} path=${req.path}`);

  // If origin is present and not allowed, return 403 with JSON for easier debugging in server logs.
  if (origin) {
    const normalizedIncoming = normalizeOrigin(origin);
    if (!allowedOrigins.includes('*') && !allowedOrigins.includes(normalizedIncoming)) {
      res.status(403).json({ error: 'CORS origin blocked', origin: origin });
      return;
    }
  }

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

// Initialize DB (if MONGO_URI present) and then start server
(async () => {
  try {
    if (process.env.MONGO_URI) {
      await connectToDB(process.env.MONGO_URI);
      console.log('[DB] Connected to MongoDB');
    } else {
      console.warn('[DB] MONGO_URI not set; configs will remain in-memory if code expects DB.');
    }
  } catch (err) {
    console.error('[DB] Failed to connect to MongoDB:', err.message || err);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();

module.exports = app;