const express = require('express');
const router = express.Router();
const codeRunner = require('../services/codeRunner');

// Basic code execution endpoint
router.post('/execute', async (req, res) => {
  try {
    const { code, language, input = '' } = req.body;

    if (!code || !language) {
      return res.status(400).json({ 
        error: 'Code and language are required',
        success: false 
      });
    }

    console.log(`[CodeExecution] Executing ${language} code`);
    
    const result = await codeRunner.executeCode(code, language, 10000, input);
    
    res.json({
      success: result.success,
      output: result.output || '',
      error: result.error || null,
      executionTime: result.executionTime || 0,
      timedOut: result.timedOut || false,
      apiUsed: result.apiUsed || 'local'
    });

  } catch (error) {
    console.error('[CodeExecution] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      output: '',
      executionTime: 0,
      timedOut: false
    });
  }
});

module.exports = router;
