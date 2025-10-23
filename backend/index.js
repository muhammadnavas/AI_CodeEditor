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
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
};
app.use(cors(corsOptions));

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