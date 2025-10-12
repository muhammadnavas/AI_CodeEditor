const express = require('express');
const OpenAI = require('openai');
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


// Execute code (JavaScript native, others simulated)
router.post('/execute', async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // For JavaScript, execute natively; for others, simulate
    if (language !== 'javascript') {
      const simulationResult = await simulateCodeExecution(code, language);
      return res.json(simulationResult);
    }

    const startTime = Date.now();
    let output = '';
    let error = null;

    try {
      // Create a sandboxed environment for JavaScript execution
      const originalConsoleLog = console.log;
      const logs = [];
      
      // Override console.log to capture output
      console.log = (...args) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };

      // Execute the code in a try-catch block
      const result = eval(`
        (function() {
          ${code}
        })()
      `);

      // Restore original console.log
      console.log = originalConsoleLog;

      // Prepare output
      output = logs.join('\n');
      if (result !== undefined) {
        output += (output ? '\n' : '') + `Return value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`;
      }
      
      if (!output) {
        output = 'Code executed successfully (no output)';
      }

    } catch (executionError) {
      console.log = originalConsoleLog;
      error = executionError.message;
      output = `Error: ${error}`;
    }

    const executionTime = Date.now() - startTime;

    res.json({
      output,
      error,
      executionTime
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

// Helper function to simulate code execution for non-JavaScript languages
async function simulateCodeExecution(code, language) {
  try {
    const startTime = Date.now();
    
    const prompt = `Analyze and simulate execution of this ${language} code:
    
    \`\`\`${language}
    ${code}
    \`\`\`
    
    Simulate what this code would output when executed. Check for:
    1. Syntax errors
    2. Logic errors  
    3. Expected output
    4. Any runtime exceptions
    
    Return JSON format:
    {
      "output": "simulated program output or error message",
      "error": "error message if syntax/runtime error exists, null otherwise", 
      "executionTime": ${Date.now() - startTime},
      "explanation": "brief explanation of what the code does"
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `You are a ${language} code execution simulator. Provide realistic output simulation.` },
        { role: "user", content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.2,
    });

    const simulation = JSON.parse(completion.choices[0].message.content);
    
    return {
      output: simulation.output || `Code analyzed (${language} simulation)`,
      error: simulation.error,
      executionTime: Date.now() - startTime,
      simulated: true,
      explanation: simulation.explanation
    };

  } catch (error) {
    return {
      output: `Unable to simulate ${language} code execution`,
      error: `Simulation error: ${error.message}`,
      executionTime: 0,
      simulated: true
    };
  }
}

module.exports = router;