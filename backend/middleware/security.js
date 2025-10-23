/**
 * Security Middleware Configuration
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Helmet configuration for security headers
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API usage
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

/**
 * Rate limiting configuration
 */
const createRateLimiter = (options = {}) => {
  const defaults = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  };

  return rateLimit({ ...defaults, ...options });
};

/**
 * Strict rate limiter for code execution endpoints
 */
const codeExecutionLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 code executions per minute per IP
  message: {
    error: 'Code execution rate limit exceeded',
    message: 'You can execute code 10 times per minute. Please wait before trying again.'
  }
});

/**
 * Rate limiter for test session endpoints
 */
const testSessionLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
  message: {
    error: 'Test session rate limit exceeded',
    message: 'Too many test session requests. Please wait before creating new sessions.'
  }
});

/**
 * General API rate limiter
 */
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: {
    error: 'API rate limit exceeded',
    message: 'Too many API requests. Please wait before making more requests.'
  }
});

/**
 * Input validation middleware
 */
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Invalid input',
        details: error.details.map(d => d.message)
      });
    }
    
    req.body = value;
    next();
  };
};

/**
 * Request size limiter
 */
const requestSizeLimiter = {
  json: { limit: '100kb' },
  urlencoded: { limit: '100kb', extended: true }
};

module.exports = {
  helmetConfig,
  apiLimiter,
  codeExecutionLimiter,
  testSessionLimiter,
  validateInput,
  requestSizeLimiter,
  createRateLimiter
};
