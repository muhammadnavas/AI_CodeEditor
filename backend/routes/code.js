const express = require('express');
const OpenAI = require('openai');
const { codeExecutionLimiter } = require('../middleware/security');
const { optionalApiKey } = require('../middleware/auth');
const codeRunner = require('../services/codeRunner');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Code analysis and suggestions
router.post('/analyze', async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const prompt = `Analyze this ${language || 'JavaScript'} code and provide:
    1. Code quality assessment
    2. Potential bugs or issues
    3. Performance suggestions
    4. Best practices recommendations
    5. Overall rating (1-10)

    Code:
    \`\`\`${language || 'javascript'}
    ${code}
    \`\`\`

    Provide response in JSON format with fields: quality, issues, suggestions, bestPractices, rating, summary`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a senior code reviewer and software engineer." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const response = completion.choices[0].message.content;
    
    try {
      const analysisData = JSON.parse(response);
      res.json(analysisData);
    } catch (parseError) {
      res.json({ 
        summary: response,
        rating: 7 
      });
    }

  } catch (error) {
    console.error('Code Analysis Error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze code',
      details: error.message 
    });
  }
});

// Execute code (Docker or local fallback)
router.post('/execute', codeExecutionLimiter, optionalApiKey, async (req, res) => {
  try {
    const { code, language = 'javascript', input = '' } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // Check if Docker is available or if we support local execution
    const dockerStatus = await codeRunner.checkDocker();
    if (!dockerStatus.available && !(await codeRunner.supportsLocalExecution(language))) {
      return res.status(503).json({
        error: 'Code execution service unavailable',
        message: `Neither Docker nor local execution is available for ${language}. Required: ${codeRunner.getRequiredCompiler(language)}`,
        details: dockerStatus.message
      });
    }

    // Execute code (will use Docker if available, otherwise local execution)
    const result = await codeRunner.executeCode(code, language, 5000, input);

    res.json({
      output: result.output || '',
      error: result.error || null,
      executionTime: result.executionTime,
      success: result.success,
      timedOut: result.timedOut,
      language
    });

  } catch (error) {
    console.error('Code Execution Error:', error);
    res.status(500).json({ 
      error: 'Failed to execute code',
      details: error.message,
      output: '',
      executionTime: 0
    });
  }
});

module.exports = router;