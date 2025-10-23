/**
 * API Key Authentication Middleware
 */

const API_KEYS = new Map();

// Initialize with default API key from env
if (process.env.API_KEY) {
  API_KEYS.set(process.env.API_KEY, {
    name: 'Default API Key',
    scopes: ['all'],
    createdAt: new Date()
  });
}

/**
 * Verify API key from request headers
 */
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'API key is required. Provide via X-API-Key or Authorization header.'
    });
  }

  const keyData = API_KEYS.get(apiKey);
  
  if (!keyData) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }

  // Attach key data to request
  req.apiKey = keyData;
  next();
};

/**
 * Optional API key verification (allows anonymous access)
 */
const optionalApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (apiKey) {
    const keyData = API_KEYS.get(apiKey);
    if (keyData) {
      req.apiKey = keyData;
    }
  }
  
  next();
};

/**
 * Add a new API key
 */
const addApiKey = (key, name, scopes = ['all']) => {
  API_KEYS.set(key, {
    name,
    scopes,
    createdAt: new Date()
  });
};

/**
 * Remove an API key
 */
const removeApiKey = (key) => {
  return API_KEYS.delete(key);
};

/**
 * List all API keys (without showing the actual keys)
 */
const listApiKeys = () => {
  const keys = [];
  for (const [key, data] of API_KEYS.entries()) {
    keys.push({
      keyPreview: `${key.substring(0, 8)}...${key.substring(key.length - 4)}`,
      ...data
    });
  }
  return keys;
};

module.exports = {
  verifyApiKey,
  optionalApiKey,
  addApiKey,
  removeApiKey,
  listApiKeys
};
