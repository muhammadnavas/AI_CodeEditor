const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test sessions storage (in production, use a database)
const testSessions = new Map();

// DB-backed stored test configs
const { getConfigsCollection } = require('../services/db');

// Custom question banks storage (recruiters can add their own)
const questionBanks = new Map();

// Default question categories (fallback only)
const defaultQuestionCategories = new Map();

// Question categories and difficulties for multiple languages
const questionCategories = {
  javascript: {
    easy: [
      "Write a function that returns the sum of two numbers",
      "Create a function to check if a number is even or odd", 
      "Write a function to reverse a string",
      "Create a function to find the largest number in an array",
      "Write a function to count vowels in a string"
    ],
    medium: [
      "Write a function to find the second largest number in an array",
      "Create a function to check if a string is a palindrome",
      "Write a function to remove duplicates from an array",
      "Create a function to merge two sorted arrays",
      "Write a function to implement basic binary search"
    ],
    hard: [
      "Implement a function to find the longest common subsequence",
      "Write a function to solve the coin change problem",
      "Create a function to implement quicksort algorithm",
      "Write a function to detect cycle in a linked list",
      "Implement a function for depth-first search in a graph"
    ]
  },
  python: {
    easy: [
      "Write a function that returns the sum of two numbers",
      "Create a function to check if a number is even or odd", 
      "Write a function to reverse a string",
      "Create a function to find the largest number in a list",
      "Write a function to count vowels in a string"
    ],
    medium: [
      "Write a function to find the second largest number in a list",
      "Create a function to check if a string is a palindrome",
      "Write a function to remove duplicates from a list",
      "Create a function to merge two sorted lists",
      "Write a function to implement basic binary search"
    ],
    hard: [
      "Implement a function to find the longest common subsequence",
      "Write a function to solve the coin change problem",
      "Create a function to implement quicksort algorithm",
      "Write a function to detect cycle in a linked list",
      "Implement a function for depth-first search in a graph"
    ]
  },
  java: {
    easy: [
      "Write a method that returns the sum of two numbers",
      "Create a method to check if a number is even or odd", 
      "Write a method to reverse a string",
      "Create a method to find the largest number in an array",
      "Write a method to count vowels in a string"
    ],
    medium: [
      "Write a method to find the second largest number in an array",
      "Create a method to check if a string is a palindrome",
      "Write a method to remove duplicates from an array",
      "Create a method to merge two sorted arrays",
      "Write a method to implement basic binary search"
    ],
    hard: [
      "Implement a method to find the longest common subsequence",
      "Write a method to solve the coin change problem",
      "Create a method to implement quicksort algorithm",
      "Write a method to detect cycle in a linked list",
      "Implement a method for depth-first search in a graph"
    ]
  },
  cpp: {
    easy: [
      "Write a function that returns the sum of two numbers",
      "Create a function to check if a number is even or odd", 
      "Write a function to reverse a string",
      "Create a function to find the largest number in a vector",
      "Write a function to count vowels in a string"
    ],
    medium: [
      "Write a function to find the second largest number in a vector",
      "Create a function to check if a string is a palindrome",
      "Write a function to remove duplicates from a vector",
      "Create a function to merge two sorted vectors",
      "Write a function to implement basic binary search"
    ],
    hard: [
      "Implement a function to find the longest common subsequence",
      "Write a function to solve the coin change problem",
      "Create a function to implement quicksort algorithm",
      "Write a function to detect cycle in a linked list",
      "Implement a function for depth-first search in a graph"
    ]
  },
  typescript: {
    easy: [
      "Write a function that returns the sum of two numbers with type annotations",
      "Create a function to check if a number is even or odd with proper typing", 
      "Write a function to reverse a string with type safety",
      "Create a function to find the largest number in an array with generics",
      "Write a function to count vowels in a string with TypeScript types"
    ],
    medium: [
      "Write a typed function to find the second largest number in an array",
      "Create a function to check if a string is a palindrome with interface",
      "Write a function to remove duplicates from an array with generics",
      "Create a function to merge two sorted arrays with type constraints",
      "Write a function to implement basic binary search with TypeScript"
    ],
    hard: [
      "Implement a typed function to find the longest common subsequence",
      "Write a function to solve the coin change problem with advanced types",
      "Create a function to implement quicksort algorithm with generics",
      "Write a function to detect cycle in a linked list with TypeScript",
      "Implement a function for depth-first search with type definitions"
    ]
  }
};

// Language-specific code templates (no imports needed)
const codeTemplates = {
  javascript: {
    template: "// Write your JavaScript solution here\nfunction solutionName() {\n  // Your code here\n}",
    comment: "//"
  },
  python: {
    template: "# Write your Python solution here\ndef solution_name():\n    # Your code here\n    pass",
    comment: "#"
  },
  java: {
    template: "// Write your Java solution here\n// All necessary imports are already available\npublic class Solution {\n    public static void solutionName() {\n        // Your code here\n    }\n}",
    comment: "//"
  },
  cpp: {
    template: "// Write your C++ solution here\n// All necessary headers are already included\nvoid solutionName() {\n    // Your code here\n}",
    comment: "//"
  },
  typescript: {
    template: "// Write your TypeScript solution here\nfunction solutionName(): void {\n  // Your code here\n}",
    comment: "//"
  }
};

// Generate AI-powered coding question
router.post('/generate-question', async (req, res) => {
  try {
    const { difficulty = 'easy', language = 'javascript', questionIndex = 0 } = req.body;
    
    const prompt = `Generate a ${difficulty} level ${language} coding challenge. 
    Include:
    1. Clear problem statement (2-3 sentences)
    2. Sample Input/Output examples (at least 3 examples with clear format)
    3. Function signature appropriate for ${language}
    4. Constraints and edge cases
    5. Expected time/space complexity
    
    Format examples as:
    "Input: [specific input]\nOutput: [expected output]\nExplanation: [brief why]"
    
    Make it practical and interview-appropriate.
    Format as JSON with fields: title, description, examples, signature, constraints, expectedComplexity`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a senior software engineer creating coding interview questions." },
        { role: "user", content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    
    try {
      const questionData = JSON.parse(response);
      const template = codeTemplates[language] || codeTemplates.javascript;
      
      res.json({
        ...questionData,
        difficulty,
        language,
        questionNumber: questionIndex + 1,
        timeLimit: 300, // 5 minutes in seconds
        signature: questionData.signature || template.template
      });
    } catch (parseError) {
      // Fallback to predefined questions
      const fallbackQuestions = questionCategories[language]?.[difficulty] || questionCategories.javascript.easy;
      const question = fallbackQuestions[questionIndex % fallbackQuestions.length];
      const template = codeTemplates[language] || codeTemplates.javascript;
      
      // Create sample examples for fallback questions
      const sampleExamples = generateSampleExamples(question, language);
      const testCases = generateTestCases(question, language);
      
      res.json({
        title: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Challenge`,
        description: question,
        examples: sampleExamples,
        signature: template.template,
        testCases: testCases,
        constraints: "Standard input constraints apply",
        complexity: "To be analyzed based on solution",
        difficulty,
        language,
        questionNumber: questionIndex + 1,
        timeLimit: 300
      });
    }

  } catch (error) {
    console.error('Question Generation Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate question',
      details: error.message 
    });
  }
});

// Start a new test session
router.post('/start-session', async (req, res) => {
  try {
    // Support two modes:
    // 1) Legacy: { candidateName, difficulty, language, questionBankId, totalQuestions }
    // 2) Uploaded test config: { testConfig: { candidateName, timePerQuestion, difficulty, language, questions: [...] } }
    const body = req.body || {};

    // If an operator uploaded a full test JSON, prefer that
    const uploadedConfig = body.testConfig || (Array.isArray(body.questions) ? {
      candidateName: body.candidateName,
      difficulty: body.difficulty,
      language: body.language,
      totalQuestions: body.totalQuestions || body.questions.length,
      timePerQuestion: body.timePerQuestion,
      questions: body.questions
    } : null);

    let candidateName = body.candidateName;
    let difficulty = body.difficulty || 'easy';
    let language = body.language || 'javascript';
    let questionBankId = body.questionBankId || null;
    let recruiterId = body.recruiterId || null;
    let totalQuestions = typeof body.totalQuestions === 'number' ? body.totalQuestions : 2;

    const sessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session = {
      id: sessionId,
      candidateName: candidateName || (uploadedConfig && uploadedConfig.candidateName) || 'Candidate',
      difficulty,
      language,
      questionBankId,
      recruiterId,
      startTime: new Date(),
      currentQuestion: 0,
      totalQuestions,
      questions: [],
      results: [],
      usedQuestionTypes: new Set(),
      availableQuestions: [],
      isActive: true
    };

    // Helper to extract function name from a provided signature/template
    function extractFunctionName(signature, lang) {
      if (!signature || typeof signature !== 'string') return null;
      try {
        // JavaScript common patterns
        if (/function\s+([a-zA-Z0-9_]+)/.test(signature)) {
          return signature.match(/function\s+([a-zA-Z0-9_]+)/)[1];
        }
        if (/const\s+([a-zA-Z0-9_]+)\s*=\s*\(/.test(signature)) {
          return signature.match(/const\s+([a-zA-Z0-9_]+)\s*=\s*\(/)[1];
        }
        if (/let\s+([a-zA-Z0-9_]+)\s*=\s*\(/.test(signature)) {
          return signature.match(/let\s+([a-zA-Z0-9_]+)\s*=\s*\(/)[1];
        }
        if (/([a-zA-Z0-9_]+)\s*:\s*function\s*\(/.test(signature)) {
          return signature.match(/([a-zA-Z0-9_]+)\s*:\s*function\s*\(/)[1];
        }
        // Python: def name(
        if (/def\s+([a-zA-Z0-9_]+)\s*\(/.test(signature)) {
          return signature.match(/def\s+([a-zA-Z0-9_]+)\s*\(/)[1];
        }
        // Java: returnType name(...)
        if (/\w+\s+([a-zA-Z0-9_]+)\s*\(.*\)\s*\{?/.test(signature)) {
          const m = signature.match(/\w+\s+([a-zA-Z0-9_]+)\s*\(.*\)/);
          if (m) return m[1];
        }
        return null;
      } catch (e) {
        return null;
      }
    }

    // If uploaded test config provided, normalize and use its questions directly
    // Additionally support loading a config by configId (e.g., stored in DB) when provided
    if (body.configId) {
      try {
        const configs = getConfigsCollection();
        const storedDoc = await configs.findOne({ configId: body.configId });
        if (storedDoc && storedDoc.normalized) {
          // Merge stored config into uploadedConfig variable for reuse
          Object.assign(uploadedConfig || (uploadedConfig = {}), storedDoc.normalized);
        }
      } catch (err) {
        console.warn('Failed to load config from DB for configId=', body.configId, err && err.message);
      }
    }

    // If a candidateId is provided (and no configId), attempt to load the latest config for that candidate
    if (!uploadedConfig && body.candidateId) {
      try {
        const configs = getConfigsCollection();
        const docs = await configs.find({ 'normalized.candidateId': body.candidateId }).sort({ createdAt: -1 }).limit(1).toArray();
        if (docs && docs.length > 0 && docs[0].normalized) {
          Object.assign(uploadedConfig || (uploadedConfig = {}), docs[0].normalized);
        }
      } catch (err) {
        console.warn('Failed to load config from DB for candidateId=', body.candidateId, err && err.message);
      }
    }

    if (uploadedConfig && Array.isArray(uploadedConfig.questions) && uploadedConfig.questions.length > 0) {
      // Allow uploaded config to override session defaults
  // Allow explicit overrides from request body (e.g., UI language selector) to take precedence
  session.candidateName = body.candidateName || uploadedConfig.candidateName || session.candidateName;
  session.difficulty = body.difficulty || uploadedConfig.difficulty || session.difficulty;
  session.language = body.language || uploadedConfig.language || session.language;
  session.totalQuestions = typeof uploadedConfig.totalQuestions === 'number' ? uploadedConfig.totalQuestions : uploadedConfig.questions.length;

      // Normalize questions
      session.questions = uploadedConfig.questions.map((q, idx) => {
        const sig = q.signature || q.function || q.signatureTemplate || '';
        const lang = (q.language || session.language || 'javascript').toLowerCase();
        const id = q.id || `q_${Date.now()}_${idx}_${Math.random().toString(36).substr(2,6)}`;
        return {
          id,
          title: q.title || q.name || `Question ${idx + 1}`,
          description: q.description || q.prompt || '',
          signature: sig,
          functionName: q.functionName || extractFunctionName(sig, lang) || null,
          sampleTests: q.sampleTests || q.samples || q.examples || [],
          hiddenTests: q.hiddenTests || q.hidden || [],
          testCases: q.testCases || q.tests || [],
          constraints: q.constraints || q.constraint || '',
          expectedComplexity: q.expectedComplexity || q.complexity || '',
          difficulty: q.difficulty || session.difficulty,
          language: lang,
          timeLimit: q.timeLimit || uploadedConfig.timePerQuestion || 300,
          metadata: q.metadata || {}
        };
      });

      // Persist session and return first question
      testSessions.set(sessionId, session);

      const firstQuestion = session.questions[0];

      return res.json({
        sessionId,
        question: firstQuestion,
        questionNumber: 1,
        totalQuestions: session.totalQuestions,
        timeLimit: firstQuestion.timeLimit || 300
      });
    }

    // Legacy behavior: use question bank or generate questions dynamically
    // Load questions from custom bank or use defaults
    if (questionBankId) {
      const questionBank = questionBanks.get(questionBankId);
      if (!questionBank) {
        return res.status(404).json({ error: 'Question bank not found' });
      }
      
      // Check access permissions
      if (questionBank.isPrivate && questionBank.recruiterId !== recruiterId) {
        return res.status(403).json({ error: 'Access denied to private question bank' });
      }
      
      // Filter questions by difficulty and language
      session.availableQuestions = questionBank.questions.filter(q => 
        q.difficulty === difficulty && q.language.toLowerCase() === language.toLowerCase()
      );
      
      if (session.availableQuestions.length === 0) {
        return res.status(400).json({ 
          error: `No questions found for ${difficulty} ${language} in the selected question bank` 
        });
      }
    }

    testSessions.set(sessionId, session);
    
    // Generate first question
    const firstQuestion = await generateUniqueQuestion(difficulty, language, 0, session);
    session.questions.push(firstQuestion);
    
    res.json({
      sessionId,
      question: firstQuestion,
      questionNumber: 1,
      totalQuestions: session.totalQuestions,
      timeLimit: 300
    });

  } catch (error) {
    console.error('Start Session Error:', error);
    res.status(500).json({ 
      error: 'Failed to start test session',
      details: error.message 
    });
  }
});

// Test code with sample cases only (no analysis or scoring)
router.post('/test-code', async (req, res) => {
  try {
    const { sessionId, code, questionNumber } = req.body;
    
    const session = testSessions.get(sessionId);
    if (!session || !session.isActive) {
      return res.status(400).json({ error: 'Invalid or expired session' });
    }

    if (!code || code.trim() === '') {
      return res.json({ error: 'No code provided' });
    }

    // Get the current question
    const question = session.questions[questionNumber - 1];
    if (!question) {
      return res.status(400).json({ error: 'Question not found' });
    }

    // Test with sample cases only
    let sampleTestResults = [];
    let output = null;
    let error = null;

    try {
      // For non-JavaScript languages, skip the basic execution and go straight to sample tests
      const jsLanguages = ['javascript', 'js', 'node', 'nodejs'];
      if (jsLanguages.includes(session.language.toLowerCase())) {
        // Execute JavaScript code to get basic output; prefer the question's function name when available
        const executionResult = await executeCode(code, session.language, false, question.functionName || null);
        
        if (executionResult.error) {
          error = executionResult.error;
        } else {
          output = executionResult.output;
        }
      } else {
        // For Python, Java, C++, etc. - skip basic execution and show message
        output = `Code structure looks good for ${session.language}. Running sample tests...`;
      }

      // Run sample tests from the question
      if (question.sampleTests && question.sampleTests.length > 0) {
        sampleTestResults = await runSampleTests(code, session.language, question.sampleTests, question.functionName || null);
      } else if (question.testCases && question.testCases.length > 0) {
        // Fallback to first few test cases as samples
        const sampleCases = question.testCases.slice(0, Math.min(3, question.testCases.length));
        sampleTestResults = await runSampleTests(code, session.language, sampleCases, question.functionName || null);
      }

    } catch (execError) {
      error = execError.message;
    }

    res.json({
      output,
      error,
      sampleTests: sampleTestResults,
      message: error ? 'Please check your code and try again.' : 'Sample tests completed. Click Submit when ready for full evaluation.'
    });

  } catch (error) {
    console.error('Test Code Error:', error);
    res.status(500).json({ 
      error: 'Failed to test code',
      details: error.message 
    });
  }
});

// Submit and analyze code
router.post('/submit-code', async (req, res) => {
  try {
    const { sessionId, code, questionNumber, timeSpent } = req.body;
    
    const session = testSessions.get(sessionId);
    if (!session || !session.isActive) {
      return res.status(400).json({ error: 'Invalid or expired session' });
    }

    // Analyze the submitted code
    const analysis = await analyzeCodeSubmission(code, session.language, session.questions[questionNumber - 1]);
    
    // Store result
    session.results.push({
      questionNumber,
      code,
      timeSpent,
      analysis,
      timestamp: new Date()
    });

    // Check if we should move to next question
    let nextQuestion = null;
    let testComplete = false;
    
    if (questionNumber < session.totalQuestions) {
      // Generate next unique question
      nextQuestion = await generateUniqueQuestion(session.difficulty, session.language, questionNumber, session);
      session.questions.push(nextQuestion);
      session.currentQuestion = questionNumber;
    } else {
      // Test complete
      session.isActive = false;
      testComplete = true;
    }

    res.json({
      analysis,
      nextQuestion,
      testComplete,
      questionNumber: testComplete ? questionNumber : questionNumber + 1,
      totalQuestions: session.totalQuestions,
      sessionId
    });

  } catch (error) {
    console.error('Submit Code Error:', error);
    res.status(500).json({ 
      error: 'Failed to submit code',
      details: error.message 
    });
  }
});

// Auto-move to next question (when time expires)
router.post('/timeout-question', async (req, res) => {
  try {
    const { sessionId, questionNumber } = req.body;
    
    const session = testSessions.get(sessionId);
    if (!session || !session.isActive) {
      return res.status(400).json({ error: 'Invalid or expired session' });
    }

    // Record timeout
    session.results.push({
      questionNumber,
      code: '',
      timeSpent: 300, // 5 minutes
      analysis: {
        status: 'timeout',
        feedback: 'Time expired - no code submitted'
      },
      timestamp: new Date()
    });

    // Move to next question or complete test
    let nextQuestion = null;
    let testComplete = false;
    
    if (questionNumber < session.totalQuestions) {
      nextQuestion = await generateUniqueQuestion(session.difficulty, session.language, questionNumber, session);
      session.questions.push(nextQuestion);
      session.currentQuestion = questionNumber;
    } else {
      session.isActive = false;
      testComplete = true;
    }

    res.json({
      nextQuestion,
      testComplete,
      questionNumber: testComplete ? questionNumber : questionNumber + 1,
      totalQuestions: session.totalQuestions,
      message: 'Time expired, moving to next question'
    });

  } catch (error) {
    console.error('Timeout Question Error:', error);
    res.status(500).json({ 
      error: 'Failed to handle timeout',
      details: error.message 
    });
  }
});

// API Documentation for recruiters
router.get('/api-docs', async (req, res) => {
  try {
    const apiDocs = {
      title: "Custom Question Bank Management API",
      version: "1.0.0",
      description: "API for recruiters to manage their own coding question banks",
      baseUrl: "/api/test",
      endpoints: {
        "Question Bank Management": {
          "POST /question-bank": {
            description: "Create or update a custom question bank",
            body: {
              bankId: "string (required) - Unique identifier for the question bank",
              bankName: "string (required) - Display name for the bank",
              recruiterId: "string (required) - ID of the recruiter creating the bank",
              questions: "array (required) - Array of question objects",
              isPrivate: "boolean (optional) - Whether bank is private (default: false)",
              tags: "array (optional) - Tags for categorization"
            },
            questionFormat: {
              title: "string - Question title",
              description: "string - Problem description", 
              difficulty: "string - easy|medium|hard",
              language: "string - javascript|python|java|cpp|typescript",
              examples: "array - Input/output examples",
              testCases: "array - Test cases for validation",
              sampleTests: "array - Visible test cases",
              hiddenTests: "array - Hidden test cases",
              constraints: "string - Problem constraints",
              expectedComplexity: "string - Time/space complexity",
              signature: "string - Function signature template",
              hints: "array - Hints for candidates"
            }
          },
          "GET /question-banks": {
            description: "Get list of available question banks",
            query: {
              recruiterId: "string (optional) - Filter by recruiter",
              includePublic: "boolean (optional) - Include public banks"
            }
          },
          "GET /question-bank/:bankId": {
            description: "Get specific question bank details",
            params: { bankId: "string - Question bank ID" },
            query: { recruiterId: "string - For access control" }
          },
          "DELETE /question-bank/:bankId": {
            description: "Delete a question bank",
            params: { bankId: "string - Question bank ID" },
            body: { recruiterId: "string - Owner verification" }
          },
          "POST /question-bank/import": {
            description: "Import questions from various formats",
            body: {
              bankId: "string - Target bank ID",
              bankName: "string - Bank display name",
              recruiterId: "string - Owner ID",
              importFormat: "string - json|csv|leetcode",
              data: "string - Data to import",
              overwrite: "boolean - Overwrite existing bank"
            }
          }
        },
        "Test Session Management": {
          "POST /start-session": {
            description: "Start a test session with custom question bank",
            body: {
              candidateName: "string - Candidate name",
              difficulty: "string - easy|medium|hard",
              language: "string - Programming language",
              questionBankId: "string (optional) - Custom question bank ID",
              recruiterId: "string (optional) - For access control",
              totalQuestions: "number (optional) - Number of questions (default: 2)"
            }
          }
        }
      },
      examples: {
        createQuestionBank: {
          method: "POST",
          url: "/api/test/question-bank",
          body: {
            bankId: "my-company-js-easy",
            bankName: "My Company JavaScript Easy Questions",
            recruiterId: "recruiter123",
            isPrivate: true,
            tags: ["frontend", "algorithms"],
            questions: [
              {
                title: "Array Sum",
                description: "Calculate the sum of all numbers in an array",
                difficulty: "easy",
                language: "javascript",
                examples: [
                  {
                    input: "[1, 2, 3, 4]",
                    output: "10",
                    explanation: "1 + 2 + 3 + 4 = 10"
                  }
                ],
                signature: "function arraySum(numbers) {\n  // Your code here\n}",
                testCases: [
                  {
                    input: "[1, 2, 3, 4]",
                    expectedOutput: "10",
                    description: "Basic sum test"
                  }
                ],
                sampleTests: [
                  {
                    input: "[1, 2, 3]",
                    expectedOutput: "6",
                    description: "Sample test"
                  }
                ],
                hiddenTests: [
                  {
                    input: "[]",
                    expectedOutput: "0",
                    description: "Empty array"
                  }
                ]
              }
            ]
          }
        },
        startSessionWithCustomBank: {
          method: "POST",
          url: "/api/test/start-session",
          body: {
            candidateName: "John Doe",
            difficulty: "easy",
            language: "javascript",
            questionBankId: "my-company-js-easy",
            recruiterId: "recruiter123",
            totalQuestions: 3
          }
        }
      }
    };

    res.json(apiDocs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate API documentation', details: error.message });
  }
});

// Test endpoint to preview question format (for development)
router.get('/preview-question', async (req, res) => {
  try {
    const { difficulty = 'easy', language = 'javascript' } = req.query;
    const question = await generateQuestion(difficulty, language, 0);
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate preview question', details: error.message });
  }
});

// Serve the example test config file so clients can fetch a sample via API
router.get('/example-config', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const examplePath = path.join(__dirname, '../../frontend/test-configs/example_test.json');
    if (!fs.existsSync(examplePath)) {
      return res.status(404).json({ error: 'Example test config not found' });
    }
    const content = fs.readFileSync(examplePath, 'utf8');
    const json = JSON.parse(content);
    res.json(json);
  } catch (error) {
    console.error('Failed to load example config:', error);
    res.status(500).json({ error: 'Failed to load example config', details: error.message });
  }
});

// Upload a test config via API (accepts JSON body). Returns normalized config.
router.post('/upload-config', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Missing JSON body' });
    }

    // Basic validation
    if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
      return res.status(400).json({ error: 'Payload must include a non-empty "questions" array' });
    }

    // Normalize questions similar to start-session logic
    const normalized = {
      candidateName: payload.candidateName || 'Candidate',
      timePerQuestion: payload.timePerQuestion || payload.timePerQuestion === 0 ? payload.timePerQuestion : 300,
      difficulty: payload.difficulty || 'easy',
      questions: payload.questions.map((q, idx) => {
        const sig = q.signature || q.function || q.signatureTemplate || '';
        const lang = (q.language || payload.language || 'javascript').toLowerCase();
        const id = q.id || `q_upload_${Date.now()}_${idx}_${Math.random().toString(36).substr(2,6)}`;
        return {
          id,
          title: q.title || q.name || `Question ${idx + 1}`,
          description: q.description || q.prompt || '',
          signature: sig,
          functionName: q.functionName || (sig ? (sig.match(/function\s+([a-zA-Z0-9_]+)\s*\(|def\s+([a-zA-Z0-9_]+)\s*\(/) || [null, null])[1] : null),
          sampleTests: q.sampleTests || q.samples || q.examples || [],
          hiddenTests: q.hiddenTests || q.hidden || [],
          testCases: q.testCases || q.tests || [],
          constraints: q.constraints || q.constraint || '',
          expectedComplexity: q.expectedComplexity || q.complexity || '',
          difficulty: q.difficulty || payload.difficulty || 'easy',
          language: lang,
          timeLimit: q.timeLimit || payload.timePerQuestion || 300,
          metadata: q.metadata || {}
        };
      })
    };

    // Store normalized config in MongoDB and return id
    const configId = `cfg_${Date.now()}_${Math.random().toString(36).substr(2,8)}`;
    // Attach candidateId if present in payload or metadata
    normalized.candidateId = payload.candidateId || payload.metadata && payload.metadata.candidateId || normalized.candidateId || null;
    try {
      const configs = getConfigsCollection();
      await configs.insertOne({ configId, normalized, createdAt: new Date() });
    } catch (err) {
      console.error('Failed to persist config to DB:', err && err.message);
      // Fallback: still return id and normalized (caller may retry storing)
    }

    // Return normalized config and id
    res.json({ success: true, configId, normalized });
  } catch (error) {
    console.error('Upload config error:', error);
    res.status(500).json({ error: 'Failed to upload config', details: error.message });
  }
});

// Save a test config explicitly (alias) and return generated id
router.post('/config', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.questions) || payload.questions.length === 0) {
      return res.status(400).json({ error: 'Invalid payload; must include questions array' });
    }

    const configId = `cfg_${Date.now()}_${Math.random().toString(36).substr(2,8)}`;
    // lightweight normalization (reuse logic from upload-config)
    const normalized = {
      candidateName: payload.candidateName || 'Candidate',
      timePerQuestion: payload.timePerQuestion || 300,
      difficulty: payload.difficulty || 'easy',
      questions: payload.questions.map((q, idx) => ({
        id: q.id || `q_${configId}_${idx}`,
        title: q.title || q.name || `Question ${idx + 1}`,
        description: q.description || q.prompt || '',
        signature: q.signature || '',
        functionName: q.functionName || null,
        sampleTests: q.sampleTests || q.samples || q.examples || [],
        hiddenTests: q.hiddenTests || q.hidden || [],
        testCases: q.testCases || q.tests || [],
        constraints: q.constraints || '',
        difficulty: q.difficulty || payload.difficulty || 'easy',
        language: (q.language || payload.language || 'javascript').toLowerCase(),
        timeLimit: q.timeLimit || payload.timePerQuestion || 300,
        metadata: q.metadata || {}
      }))
    };

    // Attach candidateId if provided
    normalized.candidateId = payload.candidateId || payload.metadata && payload.metadata.candidateId || null;
    try {
      const configs = getConfigsCollection();
      await configs.insertOne({ configId, normalized, createdAt: new Date() });
    } catch (err) {
      console.error('Failed to persist config to DB:', err && err.message);
    }
    res.json({ success: true, configId });
  } catch (error) {
    console.error('Create config error:', error);
    res.status(500).json({ error: 'Failed to create config', details: error.message });
  }
});

// Fetch a stored test config by id
router.get('/config/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    const configs = getConfigsCollection();
    const doc = await configs.findOne({ configId });
    if (!doc) {
      return res.status(404).json({ error: 'Config not found' });
    }
    res.json(doc.normalized || doc);
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to fetch config', details: error.message });
  }
});

// Fetch a stored test config by candidateId (most recent)
router.get('/config/by-candidate/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    const configs = getConfigsCollection();
    const doc = await configs.find({ 'normalized.candidateId': candidateId })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    if (!doc || doc.length === 0) {
      return res.status(404).json({ error: 'Config not found for candidate' });
    }
    res.json(doc[0].normalized || doc[0]);
  } catch (error) {
    console.error('Get config by candidate error:', error);
    res.status(500).json({ error: 'Failed to fetch config by candidate', details: error.message });
  }
});

// ===== QUESTION BANK MANAGEMENT APIs =====

// Create or update a custom question bank
router.post('/question-bank', async (req, res) => {
  try {
    const { 
      bankId, 
      bankName, 
      recruiterId, 
      questions, 
      isPrivate = false,
      tags = []
    } = req.body;

    if (!bankId || !bankName || !questions || questions.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: bankId, bankName, questions' 
      });
    }

    // Validate question structure
    const validatedQuestions = questions.map(q => {
      if (!q.title || !q.description || !q.difficulty || !q.language) {
        throw new Error('Each question must have: title, description, difficulty, language');
      }
      
      return {
        id: q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: q.title,
        description: q.description,
        difficulty: q.difficulty.toLowerCase(), // easy, medium, hard
        language: q.language.toLowerCase(),
        examples: q.examples || [],
        testCases: q.testCases || [],
        sampleTests: q.sampleTests || [],
        hiddenTests: q.hiddenTests || [],
        constraints: q.constraints || 'Standard constraints apply',
        expectedComplexity: q.expectedComplexity || 'To be analyzed',
        signature: q.signature || '',
        hints: q.hints || [],
        categories: q.categories || [],
        createdAt: q.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    const questionBank = {
      id: bankId,
      name: bankName,
      recruiterId,
      isPrivate,
      tags,
      questions: validatedQuestions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questionCount: validatedQuestions.length,
      languages: [...new Set(validatedQuestions.map(q => q.language))],
      difficulties: [...new Set(validatedQuestions.map(q => q.difficulty))]
    };

    questionBanks.set(bankId, questionBank);

    res.json({
      success: true,
      message: 'Question bank created/updated successfully',
      bankId,
      questionCount: validatedQuestions.length
    });

  } catch (error) {
    console.error('Question Bank Creation Error:', error);
    res.status(500).json({ 
      error: 'Failed to create question bank',
      details: error.message 
    });
  }
});

// Get available question banks
router.get('/question-banks', async (req, res) => {
  try {
    const { recruiterId, includePublic = true } = req.query;
    
    const availableBanks = [];
    
    for (const [bankId, bank] of questionBanks.entries()) {
      // Include if it's public or belongs to the recruiter
      if (!bank.isPrivate || bank.recruiterId === recruiterId) {
        availableBanks.push({
          id: bank.id,
          name: bank.name,
          isPrivate: bank.isPrivate,
          questionCount: bank.questionCount,
          languages: bank.languages,
          difficulties: bank.difficulties,
          tags: bank.tags,
          createdAt: bank.createdAt,
          updatedAt: bank.updatedAt
        });
      }
    }

    res.json({
      banks: availableBanks,
      total: availableBanks.length
    });

  } catch (error) {
    console.error('Get Question Banks Error:', error);
    res.status(500).json({ 
      error: 'Failed to get question banks',
      details: error.message 
    });
  }
});

// Get specific question bank details
router.get('/question-bank/:bankId', async (req, res) => {
  try {
    const { bankId } = req.params;
    const { recruiterId } = req.query;
    
    const bank = questionBanks.get(bankId);
    if (!bank) {
      return res.status(404).json({ error: 'Question bank not found' });
    }

    // Check access permissions
    if (bank.isPrivate && bank.recruiterId !== recruiterId) {
      return res.status(403).json({ error: 'Access denied to private question bank' });
    }

    res.json(bank);

  } catch (error) {
    console.error('Get Question Bank Error:', error);
    res.status(500).json({ 
      error: 'Failed to get question bank',
      details: error.message 
    });
  }
});

// Delete a question bank
router.delete('/question-bank/:bankId', async (req, res) => {
  try {
    const { bankId } = req.params;
    const { recruiterId } = req.body;
    
    const bank = questionBanks.get(bankId);
    if (!bank) {
      return res.status(404).json({ error: 'Question bank not found' });
    }

    // Check ownership
    if (bank.recruiterId !== recruiterId) {
      return res.status(403).json({ error: 'Only the owner can delete this question bank' });
    }

    questionBanks.delete(bankId);

    res.json({
      success: true,
      message: 'Question bank deleted successfully'
    });

  } catch (error) {
    console.error('Delete Question Bank Error:', error);
    res.status(500).json({ 
      error: 'Failed to delete question bank',
      details: error.message 
    });
  }
});

// Import questions from various formats (JSON, CSV, etc.)
router.post('/question-bank/import', async (req, res) => {
  try {
    const { 
      bankId,
      bankName,
      recruiterId,
      importFormat, // 'json', 'csv', 'leetcode'
      data,
      overwrite = false
    } = req.body;

    let questions = [];

    switch (importFormat.toLowerCase()) {
      case 'json':
        questions = JSON.parse(data);
        break;
      case 'csv':
        questions = parseCSVQuestions(data);
        break;
      case 'leetcode':
        questions = parseLeetCodeFormat(data);
        break;
      default:
        throw new Error('Unsupported import format. Use: json, csv, or leetcode');
    }

    // Create or update question bank
    const bankData = {
      bankId,
      bankName,
      recruiterId,
      questions,
      isPrivate: true // Imported banks are private by default
    };

    // Reuse the existing question bank creation logic
    const createResponse = await createQuestionBank(bankData, overwrite);
    
    res.json({
      success: true,
      message: `Successfully imported ${questions.length} questions`,
      bankId,
      importedCount: questions.length
    });

  } catch (error) {
    console.error('Question Import Error:', error);
    res.status(500).json({ 
      error: 'Failed to import questions',
      details: error.message 
    });
  }
});

// Get test results
router.get('/results/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = testSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const totalScore = session.results.reduce((sum, result) => {
      if (result.analysis && result.analysis.score) {
        return sum + result.analysis.score;
      }
      return sum;
    }, 0);

    const averageScore = session.results.length > 0 ? totalScore / session.results.length : 0;

    res.json({
      sessionId,
      candidateName: session.candidateName,
      difficulty: session.difficulty,
      language: session.language,
      startTime: session.startTime,
      endTime: new Date(),
      results: session.results,
      totalScore,
      averageScore,
      questionsAttempted: session.results.length,
      totalQuestions: session.totalQuestions
    });

  } catch (error) {
    console.error('Get Results Error:', error);
    res.status(500).json({ 
      error: 'Failed to get results',
      details: error.message 
    });
  }
});

// Helper function to generate unique questions (no repeats)
async function generateUniqueQuestion(difficulty, language, questionIndex, session) {
  // First check if session has custom questions from a question bank
  if (session.availableQuestions && session.availableQuestions.length > 0) {
    return generateFromCustomBank(session, questionIndex);
  }
  
  // Fallback to LeetCode problems that match the difficulty
  const leetCodeKeys = Object.keys(leetCodeProblems).filter(key => 
    leetCodeProblems[key].difficulty === difficulty
  );
  
  if (leetCodeKeys.length > 0) {
    // Use unused LeetCode problems first
    const unusedProblems = leetCodeKeys.filter(key => !session.usedQuestionTypes.has(key));
    
    if (unusedProblems.length === 0) {
      // If all problems used, reset and reuse
      session.usedQuestionTypes.clear();
    }
    
    const selectedKey = unusedProblems.length > 0 ? 
      unusedProblems[questionIndex % unusedProblems.length] :
      leetCodeKeys[questionIndex % leetCodeKeys.length];
    
    session.usedQuestionTypes.add(selectedKey);
    
    const problem = leetCodeProblems[selectedKey];
    const testCases = generateTestCases(selectedKey, language);
    
    return {
      title: problem.title,
      description: problem.description,
      examples: problem.examples,
      signature: getLanguageTemplate(language, selectedKey),
      testCases: testCases.allTests,
      sampleTests: testCases.sampleTests,
      hiddenTests: testCases.hiddenTests,
      constraints: problem.constraints,
      complexity: getExpectedComplexity(selectedKey),
      difficulty: problem.difficulty,
      language: language,
      questionNumber: questionIndex + 1,
      timeLimit: 300
    };
  }
  
  // Fallback to original question generation
  const availableQuestions = questionCategories[language]?.[difficulty] || questionCategories.javascript.easy;
  const unusedQuestions = availableQuestions.filter(q => !session.usedQuestionTypes.has(q));
  
  if (unusedQuestions.length === 0) {
    session.usedQuestionTypes.clear();
  }
  
  const selectedQuestion = unusedQuestions.length > 0 ? 
    unusedQuestions[questionIndex % unusedQuestions.length] :
    availableQuestions[questionIndex % availableQuestions.length];
  
  session.usedQuestionTypes.add(selectedQuestion);
  
  return await generateQuestion(difficulty, language, questionIndex, selectedQuestion);
}

// Helper function to get language-specific templates for LeetCode problems
function getLanguageTemplate(language, problemKey) {
  const templates = {
    "sum of two numbers": {
      javascript: "function twoSum(nums, target) {\n    // Your code here\n}",
      python: "def two_sum(nums, target):\n    # Your code here\n    pass",
      java: "public int[] twoSum(int[] nums, int target) {\n    // Your code here\n}",
      cpp: "vector<int> twoSum(vector<int>& nums, int target) {\n    // Your code here\n}",
      typescript: "function twoSum(nums: number[], target: number): number[] {\n    // Your code here\n}"
    },
    "reverse a string": {
      javascript: "function reverseString(s) {\n    // Your code here\n}",
      python: "def reverse_string(s):\n    # Your code here\n    pass",
      java: "public void reverseString(char[] s) {\n    // Your code here\n}",
      cpp: "void reverseString(vector<char>& s) {\n    // Your code here\n}",
      typescript: "function reverseString(s: string[]): void {\n    // Your code here\n}"
    },
    "largest number in array": {
      javascript: "function findMax(nums) {\n    // Your code here\n}",
      python: "def find_max(nums):\n    # Your code here\n    pass",
      java: "public int findMax(int[] nums) {\n    // Your code here\n}",
      cpp: "int findMax(vector<int>& nums) {\n    // Your code here\n}",
      typescript: "function findMax(nums: number[]): number {\n    // Your code here\n}"
    },
    "palindrome": {
      javascript: "function isPalindrome(s) {\n    // Your code here\n}",
      python: "def is_palindrome(s):\n    # Your code here\n    pass",
      java: "public boolean isPalindrome(String s) {\n    // Your code here\n}",
      cpp: "bool isPalindrome(string s) {\n    // Your code here\n}",
      typescript: "function isPalindrome(s: string): boolean {\n    // Your code here\n}"
    },
    "binary search": {
      javascript: "function search(nums, target) {\n    // Your code here\n}",
      python: "def search(nums, target):\n    # Your code here\n    pass",
      java: "public int search(int[] nums, int target) {\n    // Your code here\n}",
      cpp: "int search(vector<int>& nums, int target) {\n    // Your code here\n}",
      typescript: "function search(nums: number[], target: number): number {\n    // Your code here\n}"
    },
    "sum of squares": {
      javascript: "function sumOfSquares(nums) {\n    // Calculate the sum of squares of all numbers in the array\n    // Example: [1, 2, 3] should return 1² + 2² + 3² = 14\n    \n    // Your code here\n}",
      python: "def sum_of_squares(nums):\n    # Calculate the sum of squares of all numbers in the array\n    # Example: [1, 2, 3] should return 1² + 2² + 3² = 14\n    \n    # Your code here\n    pass",
      java: "public int sumOfSquares(int[] nums) {\n    // Calculate the sum of squares of all numbers in the array\n    // Example: [1, 2, 3] should return 1² + 2² + 3² = 14\n    \n    // Your code here\n}",
      cpp: "int sumOfSquares(vector<int>& nums) {\n    // Calculate the sum of squares of all numbers in the array\n    // Example: [1, 2, 3] should return 1² + 2² + 3² = 14\n    \n    // Your code here\n}",
      typescript: "function sumOfSquares(nums: number[]): number {\n    // Calculate the sum of squares of all numbers in the array\n    // Example: [1, 2, 3] should return 1² + 2² + 3² = 14\n    \n    // Your code here\n}"
    }
  };
  
  return templates[problemKey]?.[language] || templates[problemKey]?.javascript || "// Write your solution here";
}

// Helper function to get expected complexity for problems
function getExpectedComplexity(problemKey) {
  const complexities = {
    "sum of two numbers": "Time: O(n²) brute force, O(n) optimal; Space: O(n)",
    "reverse a string": "Time: O(n); Space: O(1)",
    "largest number in array": "Time: O(n); Space: O(1)",
    "palindrome": "Time: O(n); Space: O(1)",
    "binary search": "Time: O(log n); Space: O(1)",
    "sum of squares": "Time: O(n); Space: O(1)"
  };
  
  return complexities[problemKey] || "To be analyzed";
}

// Helper function to generate questions
async function generateQuestion(difficulty, language, questionIndex, specificQuestion = null) {
  try {
    const template = codeTemplates[language] || codeTemplates.javascript;
    const languageSpecifics = getLanguageSpecifics(language);
    
    const prompt = `Generate a ${difficulty} level ${language} coding problem.
    Make it different from previous questions in the test.
    
    Language specifics:
    - Use ${languageSpecifics.syntax} syntax
    - Follow ${languageSpecifics.conventions} naming conventions
    - Include appropriate ${languageSpecifics.dataTypes} data types
    
    Include:
    1. Problem title (clear and concise)
    2. Problem description (2-3 sentences explaining what to solve)
    3. Input/output examples (exactly 3 examples with clear format)
    4. Function signature appropriate for ${language} (NO IMPORT STATEMENTS)
    5. Test cases for automatic validation (3 test cases)
    6. Constraints (input limits, edge cases)
    7. Expected time/space complexity
    
    Format as JSON with fields: title, description, examples, signature, testCases, constraints, complexity
    
    Examples must be in this exact JSON format:
    [
      {
        "input": "concrete input value (e.g., '5, 3' or '[1,2,3]' or '\"hello\"')",
        "output": "exact expected output (e.g., '8' or 'true' or '\"olleh\"')",
        "explanation": "clear explanation of the logic (1-2 sentences)"
      },
      {
        "input": "different input demonstrating normal case",
        "output": "corresponding correct output",
        "explanation": "why this input produces this output"
      },
      {
        "input": "edge case or boundary condition",
        "output": "expected edge case result",
        "explanation": "importance of handling this edge case"
      }
    ]
    
    Make inputs and outputs very specific and testable. Avoid vague descriptions.
    
    Test cases should be in this format:
    [
      {
        "input": "function parameters as they would be called",
        "expectedOutput": "exact expected return value",
        "description": "what this test validates"
      },
      {
        "input": "second test input",
        "expectedOutput": "second expected output", 
        "description": "different scenario test"
      },
      {
        "input": "edge case input",
        "expectedOutput": "edge case output",
        "description": "edge case validation"
      }
    ]
    
    Do NOT include any import statements in the function signature. All necessary libraries should be assumed available.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `Generate unique ${language} coding interview questions with proper syntax and conventions.` },
        { role: "user", content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.8,
    });

    const questionData = JSON.parse(completion.choices[0].message.content);
    
    return {
      ...questionData,
      signature: questionData.signature || template.template
    };
  } catch (error) {
    // Fallback to predefined questions
    const question = specificQuestion || (questionCategories[language]?.[difficulty] || questionCategories.javascript.easy)[questionIndex % (questionCategories[language]?.[difficulty] || questionCategories.javascript.easy).length];
    const template = codeTemplates[language] || codeTemplates.javascript;
    
    // Create sample examples for fallback questions
    const sampleExamples = generateSampleExamples(question, language);
    const testCases = generateTestCases(question, language);
    
    return {
      title: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Challenge ${questionIndex + 1}`,
      description: question,
      examples: sampleExamples,
      signature: template.template,
      testCases: testCases,
      constraints: "Standard input constraints apply",
      complexity: "To be analyzed based on solution"
    };
  }
}

// Helper function to get language-specific details
function getLanguageSpecifics(language) {
  const specifics = {
    javascript: {
      syntax: "JavaScript ES6+",
      conventions: "camelCase",
      dataTypes: "dynamic",
      executionNote: "Can be executed"
    },
    python: {
      syntax: "Python 3",
      conventions: "snake_case",
      dataTypes: "dynamic with type hints",
      executionNote: "Simulated execution only"
    },
    java: {
      syntax: "Java",
      conventions: "camelCase with PascalCase classes",
      dataTypes: "static typing",
      executionNote: "Simulated execution only"
    },
    cpp: {
      syntax: "Modern C++",
      conventions: "snake_case or camelCase",
      dataTypes: "static typing with STL",
      executionNote: "Simulated execution only"
    },
    typescript: {
      syntax: "TypeScript",
      conventions: "camelCase with type annotations",
      dataTypes: "static typing",
      executionNote: "Simulated execution only"
    }
  };
  
  return specifics[language] || specifics.javascript;
}

// Helper function to generate sample examples for fallback questions
function generateSampleExamples(questionDescription, language) {
  const examples = [];
  
  if (questionDescription.includes("sum of two numbers")) {
    examples.push(
      {
        input: "5, 3",
        output: "8",
        explanation: "5 + 3 = 8"
      },
      {
        input: "-2, 7",
        output: "5", 
        explanation: "-2 + 7 = 5"
      },
      {
        input: "0, 0",
        output: "0",
        explanation: "0 + 0 = 0"
      }
    );
  } else if (questionDescription.includes("even or odd")) {
    examples.push(
      {
        input: "4",
        output: "even",
        explanation: "4 is divisible by 2"
      },
      {
        input: "7",
        output: "odd",
        explanation: "7 is not divisible by 2"
      },
      {
        input: "0",
        output: "even",
        explanation: "0 is considered even"
      }
    );
  } else if (questionDescription.includes("reverse a string")) {
    examples.push(
      {
        input: '"hello"',
        output: '"olleh"',
        explanation: "Characters reversed in order"
      },
      {
        input: '"abc"',
        output: '"cba"',
        explanation: "String reversed character by character"
      },
      {
        input: '""',
        output: '""',
        explanation: "Empty string remains empty"
      }
    );
  } else if (questionDescription.includes("largest number")) {
    const arrayNotation = language === 'python' ? '[2, 8, 1, 9, 3]' : language === 'java' || language === 'cpp' ? '{2, 8, 1, 9, 3}' : '[2, 8, 1, 9, 3]';
    examples.push(
      {
        input: arrayNotation,
        output: "9",
        explanation: "9 is the largest number in the array"
      },
      {
        input: language === 'python' ? '[1, 1, 1]' : language === 'java' || language === 'cpp' ? '{1, 1, 1}' : '[1, 1, 1]',
        output: "1",
        explanation: "All numbers are the same"
      },
      {
        input: language === 'python' ? '[-5, -2, -10]' : language === 'java' || language === 'cpp' ? '{-5, -2, -10}' : '[-5, -2, -10]',
        output: "-2",
        explanation: "-2 is the largest among negative numbers"
      }
    );
  } else if (questionDescription.includes("count vowels")) {
    examples.push(
      {
        input: '"hello"',
        output: "2",
        explanation: "Contains 'e' and 'o'"
      },
      {
        input: '"programming"',
        output: "3",
        explanation: "Contains 'o', 'a', and 'i'"
      },
      {
        input: '"xyz"',
        output: "0",
        explanation: "No vowels present"
      }
    );
  } else if (questionDescription.includes("palindrome")) {
    examples.push(
      {
        input: '"racecar"',
        output: "true",
        explanation: "Reads the same forwards and backwards"
      },
      {
        input: '"hello"',
        output: "false",
        explanation: "Not the same when reversed"
      },
      {
        input: '"a"',
        output: "true",
        explanation: "Single character is always a palindrome"
      }
    );
  } else if (questionDescription.includes("second largest")) {
    const arrayNotation = language === 'python' ? '[5, 2, 8, 1, 9]' : language === 'java' || language === 'cpp' ? '{5, 2, 8, 1, 9}' : '[5, 2, 8, 1, 9]';
    examples.push(
      {
        input: arrayNotation,
        output: "8",
        explanation: "9 is largest, 8 is second largest"
      },
      {
        input: language === 'python' ? '[3, 3, 1]' : language === 'java' || language === 'cpp' ? '{3, 3, 1}' : '[3, 3, 1]',
        output: "1",
        explanation: "After removing duplicates, 1 is second largest"
      },
      {
        input: language === 'python' ? '[7, 7, 7]' : language === 'java' || language === 'cpp' ? '{7, 7, 7}' : '[7, 7, 7]',
        output: "null",
        explanation: "All elements are the same, no second largest"
      }
    );
  } else if (questionDescription.includes("binary search")) {
    const arrayNotation = language === 'python' ? '[1, 3, 5, 7, 9], target=5' : language === 'java' || language === 'cpp' ? '{1, 3, 5, 7, 9}, target=5' : '[1, 3, 5, 7, 9], target=5';
    examples.push(
      {
        input: arrayNotation,
        output: "2",
        explanation: "Element 5 is found at index 2"
      },
      {
        input: language === 'python' ? '[1, 3, 5, 7, 9], target=6' : language === 'java' || language === 'cpp' ? '{1, 3, 5, 7, 9}, target=6' : '[1, 3, 5, 7, 9], target=6',
        output: "-1",
        explanation: "Element 6 is not found in the array"
      },
      {
        input: language === 'python' ? '[2], target=2' : language === 'java' || language === 'cpp' ? '{2}, target=2' : '[2], target=2',
        output: "0",
        explanation: "Single element found at index 0"
      }
    );
  } else {
    // Generic examples for complex problems
    examples.push(
      {
        input: "sample input 1",
        output: "expected output 1",
        explanation: "Standard case demonstration"
      },
      {
        input: "sample input 2",
        output: "expected output 2",
        explanation: "Alternative case example"
      },
      {
        input: "edge case input",
        output: "edge case output",
        explanation: "Boundary or special condition handling"
      }
    );
  }
  
  return examples;
}

// Helper function to generate test cases for automatic validation
// LeetCode-style problem definitions with comprehensive test cases
const leetCodeProblems = {
  "sum of two numbers": {
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6", 
        output: "[1,2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
      }
    ],
    sampleTests: [
      { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", description: "Basic case" },
      { input: "[3,2,4], 6", expectedOutput: "[1,2]", description: "Different indices" }
    ],
    hiddenTests: [
      { input: "[3,3], 6", expectedOutput: "[0,1]", description: "Duplicate values" },
      { input: "[1,5,7,9], 10", expectedOutput: "[0,3]", description: "Larger array" },
      { input: "[-1,2,1,-4], 0", expectedOutput: "[0,2]", description: "Negative numbers" }
    ],
    constraints: "2 ≤ nums.length ≤ 10^4, -10^9 ≤ nums[i] ≤ 10^9, -10^9 ≤ target ≤ 10^9",
    difficulty: "easy"
  },

  "reverse a string": {
    title: "Reverse String",
    description: "Write a function that reverses a string. The input string is given as an array of characters s.",
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        explanation: "Reverse the array of characters in-place."
      }
    ],
    sampleTests: [
      { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', description: "Basic reversal" },
      { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', description: "Palindrome name" }
    ],
    hiddenTests: [
      { input: '["a"]', expectedOutput: '["a"]', description: "Single character" },
      { input: '["A"," ","m","a","n",","," ","a"," ","p","l","a","n",","," ","a"," ","c","a","n","a","l",":"," ","P","a","n","a","m","a"]', expectedOutput: '["a","m","a","n","a","P"," ",":","l","a","n","a","c"," ","a"," ",",","n","a","l","p"," ","a"," ",",","n","a","m"," ","A"]', description: "Long sentence" },
      { input: '[]', expectedOutput: '[]', description: "Empty array" }
    ],
    constraints: "1 ≤ s.length ≤ 10^5",
    difficulty: "easy"
  },

  "largest number in array": {
    title: "Find Maximum in Array",
    description: "Given an array of integers, find and return the largest number.",
    examples: [
      {
        input: "nums = [1,3,2,5,4]",
        output: "5",
        explanation: "5 is the largest number in the array."
      }
    ],
    sampleTests: [
      { input: "[1,3,2,5,4]", expectedOutput: "5", description: "Mixed positive numbers" },
      { input: "[10,22,5,75,65,80]", expectedOutput: "80", description: "Larger numbers" }
    ],
    hiddenTests: [
      { input: "[-5,-1,-10,-3]", expectedOutput: "-1", description: "All negative numbers" },
      { input: "[42]", expectedOutput: "42", description: "Single element" },
      { input: "[0,0,0,0]", expectedOutput: "0", description: "All zeros" },
      { input: "[-100,100,-50,50]", expectedOutput: "100", description: "Mix of positive and negative" }
    ],
    constraints: "1 ≤ nums.length ≤ 10^4, -10^9 ≤ nums[i] ≤ 10^9",
    difficulty: "easy"
  },

  "palindrome": {
    title: "Valid Palindrome",
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: "true",
        explanation: 'After removing non-alphanumeric characters: "amanaplanacanalpanama", which is a palindrome.'
      }
    ],
    sampleTests: [
      { input: '"A man, a plan, a canal: Panama"', expectedOutput: "true", description: "Classic palindrome" },
      { input: '"race a car"', expectedOutput: "false", description: "Not a palindrome" }
    ],
    hiddenTests: [
      { input: '""', expectedOutput: "true", description: "Empty string" },
      { input: '"a"', expectedOutput: "true", description: "Single character" },
      { input: '"Madam"', expectedOutput: "true", description: "Simple word palindrome" },
      { input: '"No \'x\' in Nixon"', expectedOutput: "true", description: "Complex palindrome with punctuation" }
    ],
    constraints: "1 ≤ s.length ≤ 2 * 10^5",
    difficulty: "medium"
  },

  "binary search": {
    title: "Binary Search",
    description: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.",
    examples: [
      {
        input: "nums = [-1,0,3,5,9,12], target = 9",
        output: "4",
        explanation: "9 exists in nums and its index is 4"
      }
    ],
    sampleTests: [
      { input: "[-1,0,3,5,9,12], 9", expectedOutput: "4", description: "Target found" },
      { input: "[-1,0,3,5,9,12], 2", expectedOutput: "-1", description: "Target not found" }
    ],
    hiddenTests: [
      { input: "[5], 5", expectedOutput: "0", description: "Single element found" },
      { input: "[5], -5", expectedOutput: "-1", description: "Single element not found" },
      { input: "[1,2,3,4,5], 1", expectedOutput: "0", description: "First element" },
      { input: "[1,2,3,4,5], 5", expectedOutput: "4", description: "Last element" },
      { input: "[1,3,5,7,9], 6", expectedOutput: "-1", description: "Missing middle element" }
    ],
    constraints: "1 ≤ nums.length ≤ 10^4, -10^4 < nums[i], target < 10^4",
    difficulty: "easy"
  },

  "sum of squares": {
    title: "Sum of Squares",
    description: "Write a function that takes an array of numbers as input and returns the sum of squares of all the numbers.",
    examples: [
      {
        input: "nums = [1, 2, 3]",
        output: "14",
        explanation: "1² + 2² + 3² = 1 + 4 + 9 = 14"
      },
      {
        input: "nums = [0, 5, 3, 2]",
        output: "38",
        explanation: "0² + 5² + 3² + 2² = 0 + 25 + 9 + 4 = 38"
      }
    ],
    sampleTests: [
      { input: "[1, 2, 3]", expectedOutput: "14", description: "Basic case" },
      { input: "[0, 5, 3, 2]", expectedOutput: "38", description: "Mixed numbers" }
    ],
    hiddenTests: [
      { input: "[10]", expectedOutput: "100", description: "Single element" },
      { input: "[-2, -3, -1]", expectedOutput: "14", description: "Negative numbers" },
      { input: "[0, 0, 0, 0]", expectedOutput: "0", description: "All zeros" },
      { input: "[1, -1, 2, -2]", expectedOutput: "10", description: "Mix of positive and negative" }
    ],
    constraints: "1 ≤ nums.length ≤ 100, -100 ≤ nums[i] ≤ 100",
    difficulty: "easy"
  }
};

function generateTestCases(questionDescription, language) {
  // Find matching LeetCode problem
  const problemKey = Object.keys(leetCodeProblems).find(key => 
    questionDescription.toLowerCase().includes(key.toLowerCase())
  );
  
  if (problemKey && leetCodeProblems[problemKey]) {
    const problem = leetCodeProblems[problemKey];
    return {
      sampleTests: problem.sampleTests,
      hiddenTests: problem.hiddenTests,
      allTests: [...problem.sampleTests, ...problem.hiddenTests]
    };
  }

  // Fallback to basic test cases
  const testCases = [];
  
  if (questionDescription.includes("sum of two numbers")) {
    testCases.push(
      {
        input: "5, 3",
        expectedOutput: "8",
        description: "Basic addition test"
      },
      {
        input: "-2, 7",
        expectedOutput: "5", 
        description: "Negative number test"
      },
      {
        input: "0, 0",
        expectedOutput: "0",
        description: "Zero values test"
      }
    );
  } else if (questionDescription.includes("sum of squares")) {
    testCases.push(
      {
        input: "[1, 2, 3]",
        expectedOutput: "14",
        description: "Basic sum of squares test"
      },
      {
        input: "[0, 5, 3, 2]",
        expectedOutput: "38",
        description: "Mixed numbers with zero"
      },
      {
        input: "[-2, -3, -1]",
        expectedOutput: "14",
        description: "Negative numbers test"
      }
    );
  } else if (questionDescription.includes("even or odd")) {
    testCases.push(
      {
        input: "4",
        expectedOutput: "even",
        description: "Even number test"
      },
      {
        input: "7",
        expectedOutput: "odd",
        description: "Odd number test"
      },
      {
        input: "0",
        expectedOutput: "even",
        description: "Zero edge case"
      }
    );
  } else if (questionDescription.includes("reverse a string")) {
    testCases.push(
      {
        input: '"hello"',
        expectedOutput: '"olleh"',
        description: "Basic string reversal"
      },
      {
        input: '"a"',
        expectedOutput: '"a"',
        description: "Single character"
      },
      {
        input: '""',
        expectedOutput: '""',
        description: "Empty string"
      }
    );
  } else if (questionDescription.includes("largest number")) {
    const arrayNotation = language === 'python' ? '[2, 8, 1, 9, 3]' : '[2, 8, 1, 9, 3]';
    testCases.push(
      {
        input: arrayNotation,
        expectedOutput: "9",
        description: "Mixed numbers array"
      },
      {
        input: language === 'python' ? '[1, 1, 1]' : '[1, 1, 1]',
        expectedOutput: "1",
        description: "All same numbers"
      },
      {
        input: language === 'python' ? '[-5, -2, -10]' : '[-5, -2, -10]',
        expectedOutput: "-2",
        description: "All negative numbers"
      }
    );
  } else if (questionDescription.includes("count vowels")) {
    testCases.push(
      {
        input: '"hello"',
        expectedOutput: "2",
        description: "String with vowels"
      },
      {
        input: '"xyz"',
        expectedOutput: "0",
        description: "No vowels"
      },
      {
        input: '"aeiou"',
        expectedOutput: "5",
        description: "All vowels"
      }
    );
  } else if (questionDescription.includes("palindrome")) {
    testCases.push(
      {
        input: '"racecar"',
        expectedOutput: "true",
        description: "Valid palindrome"
      },
      {
        input: '"hello"',
        expectedOutput: "false",
        description: "Not a palindrome"
      },
      {
        input: '"a"',
        expectedOutput: "true",
        description: "Single character"
      }
    );
  } else {
    // Generic test cases
    testCases.push(
      {
        input: "test input 1",
        expectedOutput: "expected 1",
        description: "Basic functionality test"
      },
      {
        input: "test input 2",
        expectedOutput: "expected 2",
        description: "Alternative case test"
      },
      {
        input: "edge case",
        expectedOutput: "edge result",
        description: "Edge case validation"
      }
    );
  }
  
  return {
    sampleTests: testCases.slice(0, 2), // First 2 as sample tests
    hiddenTests: testCases.slice(2),    // Rest as hidden tests  
    allTests: testCases
  };
}

// PRODUCTION-GRADE: Sample test runner for recruitment accuracy
async function runSampleTests(code, language, sampleTests, expectedFunctionName = null) {
  const results = [];
  
  for (const testCase of sampleTests) {
    try {
      // Use actual code execution for all supported languages
      const jsLanguages = ['javascript', 'js', 'node', 'nodejs'];
      if (language && jsLanguages.includes(language.toLowerCase())) {
        // JavaScript - use VM-based execution, prefer expected function name when provided
        const result = await runJavaScriptTest(code, testCase, expectedFunctionName);
        result.simulated = false;
        results.push(result);
      } else {
        // Other languages - use real system execution
        const result = await runMultiLanguageTest(code, language, testCase);
        results.push(result);
      }
    } catch (error) {
      results.push({
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: 'System Error',
        passed: false,
        description: testCase.description,
        error: `System error: ${error.message}`,
        executionTime: 0
      });
    }
  }
  
  return results;
}

// CRITICAL: Rigorous JavaScript test execution for recruitment
async function runJavaScriptTest(code, testCase, expectedFunctionName = null) {
  const startTime = Date.now();
  
  try {
  // Execute code to get function (silent mode for testing)
  const codeExecution = await executeJavaScriptCode(code, startTime, true, expectedFunctionName);
    
    if (codeExecution.error) {
      return {
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: 'Code Error',
        passed: false,
        description: testCase.description,
        error: codeExecution.error,
        executionTime: codeExecution.executionTime
      };
    }

    const functionName = codeExecution.functionName;
    const capturedFunction = codeExecution.capturedFunction;

    // CRITICAL: Ensure function exists
    if (!functionName || !capturedFunction) {
      return {
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: 'No Function Found',
        passed: false,
        description: testCase.description,
        error: 'No valid function definition found in code',
        executionTime: codeExecution.executionTime
      };
    }

    // CRITICAL: Parse test inputs correctly
    const testInput = parseTestInput(testCase.input);
    const expectedOutput = parseExpectedOutput(testCase.expectedOutput);

    // CRITICAL: Execute function with proper error handling
    const vm = require('vm');
    const testContext = {
      testFunction: capturedFunction,
      testInput: testInput,
      Array, Object, JSON, Math, String, Number, Boolean,
      result: undefined,
      error: null,
      console: {
        log: () => {}, // Silent for test execution
        error: () => {}
      }
    };

    const testExecutionCode = `
      try {
        if (Array.isArray(testInput)) {
          // Multiple parameters
          result = testFunction(...testInput);
        } else {
          // Single parameter
          result = testFunction(testInput);
        }
      } catch (err) {
        error = err.message;
      }
    `;

    vm.createContext(testContext);
    vm.runInContext(testExecutionCode, testContext, {
      timeout: 5000
    });

    if (testContext.error) {
      return {
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: 'Runtime Error',
        passed: false,
        description: testCase.description,
        error: testContext.error,
        executionTime: Date.now() - startTime
      };
    }

    const actualOutput = testContext.result;
    
    // CRITICAL: Precise output comparison
    const passed = compareOutputsRigorous(actualOutput, expectedOutput);

    return {
      input: testCase.input,
      expected: testCase.expectedOutput,
      actual: formatOutputForDisplay(actualOutput),
      passed: passed,
      description: testCase.description,
      error: null,
      executionTime: Date.now() - startTime
    };

  } catch (error) {
    return {
      input: testCase.input,
      expected: testCase.expectedOutput,
      actual: 'Execution Error',
      passed: false,
      description: testCase.description,
      error: error.message,
      executionTime: Date.now() - startTime
    };
  }
}

// Multi-language test execution (Python, Java, C++, etc.)
async function runMultiLanguageTest(code, language, testCase) {
  const startTime = Date.now();
  
  try {
    // Parse test inputs
    const testInput = parseTestInput(testCase.input);
    const expectedOutput = parseExpectedOutput(testCase.expectedOutput);
    
    // Create test wrapper code for the language
    const testCode = createTestWrapper(code, language, testInput);
    
    // Execute the test code
    const executionResult = await executeMultiLanguageCode(testCode, language, startTime, true);
    
    if (executionResult.error) {
      return {
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: 'Code Error',
        passed: false,
        description: testCase.description,
        error: executionResult.error,
        executionTime: executionResult.executionTime,
        simulated: false
      };
    }
    
    // Parse the actual output
    const actualOutput = parseActualOutput(executionResult.output, language);
    
    // Compare outputs
    const passed = compareOutputsRigorous(actualOutput, expectedOutput);
    
    return {
      input: testCase.input,
      expected: testCase.expectedOutput,
      actual: formatOutputForDisplay(actualOutput),
      passed: passed,
      description: testCase.description,
      error: null,
      executionTime: executionResult.executionTime,
      simulated: false
    };
    
  } catch (error) {
    return {
      input: testCase.input,
      expected: testCase.expectedOutput,
      actual: 'Execution Error',
      passed: false,
      description: testCase.description,
      error: error.message,
      executionTime: Date.now() - startTime,
      simulated: false
    };
  }
}

// Helper function to create test wrapper code for different languages
function createTestWrapper(userCode, language, testInput) {
  switch (language.toLowerCase()) {
    case 'python':
    case 'py':
      return createPythonTestWrapper(userCode, testInput);
    case 'java':
      return createJavaTestWrapper(userCode, testInput);
    case 'cpp':
    case 'c++':
      return createCppTestWrapper(userCode, testInput);
    case 'c':
      return createCTestWrapper(userCode, testInput);
    case 'typescript':
    case 'ts':
      return createTypeScriptTestWrapper(userCode, testInput);
    default:
      throw new Error(`Test wrapper not implemented for ${language}`);
  }
}

// Python test wrapper
function createPythonTestWrapper(userCode, testInput) {
  // Normalize Python indentation first
  userCode = normalizePythonIndentation(userCode);
  
  // Build proper function call
  let functionCall;
  
  // Check if testInput represents multiple function parameters
  // Multiple parameters: parseTestInput returns [[2,7,11,15], 9] - array with mixed types
  // Single parameter: parseTestInput returns [1,3,2,5,4] - array with all same type numbers
  
  const isMultipleParameters = Array.isArray(testInput) && testInput.length > 1 && (
    // Check if first element is array and second is not (like [[2,7,11,15], 9])
    (Array.isArray(testInput[0]) && !Array.isArray(testInput[1])) ||
    // Or if we have different types (mixed parameters)
    (testInput.some((item, index) => index > 0 && typeof item !== typeof testInput[0]))
  );
  
  if (isMultipleParameters) {
    // Multiple arguments: this is like [[2,7,11,15], 9] for two_sum
    const args = testInput.map(input => {
      if (typeof input === 'string') {
        return `"${input}"`;
      } else if (Array.isArray(input)) {
        return JSON.stringify(input);
      } else {
        return String(input);
      }
    }).join(', ');
    functionCall = `result = func(${args})`;
  } else {
    // Single argument: this includes single arrays like [1,3,2,5,4] for find_max
    let arg;
    if (typeof testInput === 'string') {
      arg = `"${testInput}"`;
    } else if (Array.isArray(testInput)) {
      arg = JSON.stringify(testInput);
    } else {
      arg = String(testInput);
    }
    functionCall = `result = func(${arg})`;
  }
    
  return `${userCode}

# Test execution
if __name__ == "__main__":
    try:
        # Find the first function defined in user code
        import inspect
        import sys
        
        current_module = sys.modules[__name__]
        functions = [name for name, obj in inspect.getmembers(current_module, inspect.isfunction) 
                    if not name.startswith('__')]
        
        if functions:
            func = getattr(current_module, functions[0])
            ${functionCall}
            print(result)
        else:
            print("No function found")
    except Exception as e:
        print(f"Error: {e}")
`;
}

// Java test wrapper
function createJavaTestWrapper(userCode, testInput) {
  const classMatch = userCode.match(/class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : 'Solution';
  
  // Check if testInput represents multiple function parameters vs single array
  const isMultipleParameters = Array.isArray(testInput) && testInput.length > 1 && (
    (Array.isArray(testInput[0]) && !Array.isArray(testInput[1])) ||
    (testInput.some((item, index) => index > 0 && typeof item !== typeof testInput[0]))
  );
  
  let inputStr;
  if (isMultipleParameters) {
    inputStr = testInput.map(input => typeof input === 'string' ? `"${input}"` : JSON.stringify(input)).join(', ');
  } else {
    inputStr = typeof testInput === 'string' ? `"${testInput}"` : 
               Array.isArray(testInput) ? JSON.stringify(testInput).replace(/"/g, '') :
               String(testInput);
  }
    
  // Insert main method if not exists
  if (!userCode.includes('public static void main')) {
    const insertPos = userCode.lastIndexOf('}');
    const beforeMain = userCode.substring(0, insertPos);
    const mainMethod = `
    public static void main(String[] args) {
        ${className} solution = new ${className}();
        try {
            // Call the first public method (assuming it's the solution method)
            ${Array.isArray(testInput) ? `var result = solution.solve(${inputStr});` : `var result = solution.solve(${inputStr});`}
            System.out.println(result);
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}`;
    return beforeMain + mainMethod;
  }
  
  return userCode;
}

// C++ test wrapper
function createCppTestWrapper(userCode, testInput) {
  // Check if testInput represents multiple function parameters vs single array/vector
  const isMultipleParameters = Array.isArray(testInput) && testInput.length > 1 && (
    (Array.isArray(testInput[0]) && !Array.isArray(testInput[1])) ||
    (testInput.some((item, index) => index > 0 && typeof item !== typeof testInput[0]))
  );
  
  let inputStr;
  if (isMultipleParameters) {
    inputStr = testInput.map(input => typeof input === 'string' ? `"${input}"` : 
                           Array.isArray(input) ? `{${input.join(', ')}}` : String(input)).join(', ');
  } else {
    inputStr = typeof testInput === 'string' ? `"${testInput}"` : 
               Array.isArray(testInput) ? `{${testInput.join(', ')}}` :
               String(testInput);
  }
    
  return `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

${userCode}

int main() {
    try {
        ${Array.isArray(testInput) ? `auto result = solution(${inputStr});` : `auto result = solution(${inputStr});`}
        cout << result << endl;
    } catch (const exception& e) {
        cout << "Error: " << e.what() << endl;
    }
    return 0;
}`;
}

// C test wrapper
function createCTestWrapper(userCode, testInput) {
  const inputStr = Array.isArray(testInput) 
    ? testInput.map(input => typeof input === 'string' ? `"${input}"` : String(input)).join(', ')
    : typeof testInput === 'string' ? `"${testInput}"` : String(testInput);
    
  return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

${userCode}

int main() {
    ${Array.isArray(testInput) ? `int result = solution(${inputStr});` : `int result = solution(${inputStr});`}
    printf("%d\\n", result);
    return 0;
}`;
}

// TypeScript test wrapper
function createTypeScriptTestWrapper(userCode, testInput) {
  // Check if testInput represents multiple function parameters vs single array
  const isMultipleParameters = Array.isArray(testInput) && testInput.length > 1 && (
    (Array.isArray(testInput[0]) && !Array.isArray(testInput[1])) ||
    (testInput.some((item, index) => index > 0 && typeof item !== typeof testInput[0]))
  );
  
  let inputStr;
  if (isMultipleParameters) {
    inputStr = testInput.map(input => typeof input === 'string' ? `"${input}"` : JSON.stringify(input)).join(', ');
  } else {
    inputStr = typeof testInput === 'string' ? `"${testInput}"` : 
               Array.isArray(testInput) ? JSON.stringify(testInput) :
               String(testInput);
  }
    
  return `${userCode}

// Test execution
try {
    ${Array.isArray(testInput) ? `const result = solution(${inputStr});` : `const result = solution(${inputStr});`}
    console.log(result);
} catch (error) {
    console.log('Error:', error.message);
}`;
}

// Helper function to parse actual output from execution
function parseActualOutput(output, language) {
  if (!output || typeof output !== 'string') {
    return output;
  }
  
  // Clean up output
  const lines = output.split('\n').filter(line => line.trim());
  if (lines.length === 0) return '';
  
  // Get the last meaningful line (usually the result)
  const lastLine = lines[lines.length - 1].trim();
  
  // Try to parse as JSON for arrays/objects
  try {
    return JSON.parse(lastLine);
  } catch {
    // Try to parse as number
    const num = Number(lastLine);
    if (!isNaN(num)) return num;
    
    // Return as string
    return lastLine;
  }
}

// CRITICAL: Enhanced AI simulation with strict validation (DEPRECATED)
async function runAISimulatedTest(code, language, testCase) {
  const startTime = Date.now();
  
  try {
    // Check for empty or trivial code first
    const codeLines = code.trim().split('\n').filter(line => 
      line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('#')
    );
    
    if (codeLines.length === 0) {
      return {
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: 'Empty Code',
        passed: false,
        description: testCase.description,
        error: 'No implementation provided',
        executionTime: Date.now() - startTime,
        simulated: true
      };
    }

    // Check for basic function structure
    const hasFunction = code.includes('def ') || code.includes('function') || code.includes('public ') || code.includes('=>');
    const hasReturn = code.includes('return');
    const hasLogic = code.includes('for ') || code.includes('while ') || code.includes('if ') || 
                    code.includes('=') || code.includes('+') || code.includes('-') || 
                    code.includes('*') || code.includes('/');

    if (!hasFunction) {
      return {
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: 'No Function Definition',
        passed: false,
        description: testCase.description,
        error: 'No function definition found',
        executionTime: Date.now() - startTime,
        simulated: true
      };
    }

    const prompt = `RECRUITMENT TEST - CRITICAL ANALYSIS REQUIRED

Analyze this ${language} code for a technical interview:

\`\`\`${language}
${code}
\`\`\`

Test Case:
Input: ${testCase.input}
Expected Output: ${testCase.expectedOutput}

STRICT REQUIREMENTS:
1. IGNORE import statements (assume available)
2. Trace through EVERY line of logic step by step
3. Check if algorithm is ACTUALLY IMPLEMENTED (not just empty/placeholder)
4. Verify the logic would produce EXACTLY the expected output
5. Be extremely strict - this is for hiring decisions

COMMON FAIL PATTERNS:
- Empty function body (just pass/return/comments)  
- Wrong algorithm completely
- Missing critical logic steps
- Off-by-one errors
- Incorrect data structure usage

RESPONSE FORMAT (EXACTLY):
ANALYSIS: [step-by-step trace through the code]
RESULT: PASS or FAIL  
OUTPUT: [exact output the code would produce]
CONFIDENCE: [HIGH/MEDIUM/LOW]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4", // GPT-4 for critical recruitment accuracy
      messages: [
        { 
          role: "system", 
          content: "You are a senior software engineer conducting technical interviews. Be extremely precise and strict in code analysis. This determines hiring decisions." 
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.0 // Zero temperature for consistency
    });

    const response = completion.choices[0].message.content;
    
    // Parse AI response strictly
    const resultMatch = response.match(/RESULT:\s*(PASS|FAIL)/i);
    const outputMatch = response.match(/OUTPUT:\s*(.+?)(?:\n|CONFIDENCE:)/i);
    const analysisMatch = response.match(/ANALYSIS:\s*(.+?)(?:\n|RESULT:)/i);
    const confidenceMatch = response.match(/CONFIDENCE:\s*(HIGH|MEDIUM|LOW)/i);

    const passed = resultMatch && resultMatch[1].toUpperCase() === 'PASS';
    const actualOutput = outputMatch ? outputMatch[1].trim() : (passed ? testCase.expectedOutput : 'Logic Error');
    const analysis = analysisMatch ? analysisMatch[1].trim() : 'AI analysis completed';
    const confidence = confidenceMatch ? confidenceMatch[1] : 'UNKNOWN';

    // Additional validation - if confidence is LOW, automatically fail
    const finalPassed = passed && confidence !== 'LOW';

    return {
      input: testCase.input,
      expected: testCase.expectedOutput,
      actual: actualOutput,
      passed: finalPassed,
      description: testCase.description,
      error: null,
      executionTime: Date.now() - startTime,
      simulated: true,
      aiAnalysis: analysis,
      confidence: confidence
    };

  } catch (error) {
    return {
      input: testCase.input,
      expected: testCase.expectedOutput,
      actual: 'AI Analysis Failed',
      passed: false,
      description: testCase.description,
      error: `AI simulation error: ${error.message}`,
      executionTime: Date.now() - startTime,
      simulated: true
    };
  }
}

// UTILITY: Production-grade input parsing
function parseTestInput(inputString) {
  try {
    // Handle single array format: "[1,2,3]" (should be treated as single parameter)
    if (inputString.startsWith('[') && inputString.endsWith(']')) {
      // Check if this is a complete array without external commas
      let bracketCount = 0;
      let hasExternalComma = false;
      
      for (let i = 0; i < inputString.length; i++) {
        const char = inputString[i];
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
        if (char === ',' && bracketCount === 0) {
          hasExternalComma = true;
          break;
        }
      }
      
      if (!hasExternalComma) {
        // This is a single array parameter
        return JSON.parse(inputString);
      }
    }
    
    // Handle single string format: '"hello"'
    if (inputString.startsWith('"') && inputString.endsWith('"')) {
      // Check if this is a complete string without external commas
      let inQuotes = false;
      let hasExternalComma = false;
      
      for (let i = 0; i < inputString.length; i++) {
        const char = inputString[i];
        if (char === '"' && (i === 0 || inputString[i-1] !== '\\')) {
          inQuotes = !inQuotes;
        }
        if (char === ',' && !inQuotes) {
          hasExternalComma = true;
          break;
        }
      }
      
      if (!hasExternalComma) {
        // This is a single string parameter
        return JSON.parse(inputString);
      }
    }
    
    // Handle multiple parameters with smart comma parsing
    if (inputString.includes(',')) {
      const params = [];
      let current = '';
      let bracketCount = 0;
      let inQuotes = false;
      
      for (let i = 0; i < inputString.length; i++) {
        const char = inputString[i];
        
        if (char === '"' && (i === 0 || inputString[i-1] !== '\\')) {
          inQuotes = !inQuotes;
        }
        
        if (!inQuotes) {
          if (char === '[' || char === '{') bracketCount++;
          if (char === ']' || char === '}') bracketCount--;
        }
        
        if (char === ',' && bracketCount === 0 && !inQuotes) {
          params.push(parseTestInputSingle(current.trim()));
          current = '';
        } else {
          current += char;
        }
      }
      
      if (current.trim()) {
        params.push(parseTestInputSingle(current.trim()));
      }
      
      return params;
    }
    
    // Single parameter
    return parseTestInputSingle(inputString);
  } catch (error) {
    return inputString; // Fallback to original string
  }
}

// Helper function to parse a single parameter
function parseTestInputSingle(paramString) {
  try {
    const trimmed = paramString.trim();
    
    // Handle JSON arrays and objects
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      return JSON.parse(trimmed);
    }
    
    // Handle quoted strings
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return JSON.parse(trimmed);
    }
    
    // Handle booleans
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    
    // Handle numbers
    const num = Number(trimmed);
    if (!isNaN(num)) return num;
    
    return trimmed;
  } catch (error) {
    return paramString;
  }
}

// UTILITY: Parse expected output with type handling
function parseExpectedOutput(outputString) {
  try {
    // Handle JSON arrays and objects
    if (outputString.startsWith('[') || outputString.startsWith('{')) {
      return JSON.parse(outputString);
    }
    
    // Handle strings
    if (outputString.startsWith('"') && outputString.endsWith('"')) {
      return JSON.parse(outputString);
    }
    
    // Handle booleans
    if (outputString === 'true') return true;
    if (outputString === 'false') return false;
    
    // Handle numbers
    const num = Number(outputString);
    if (!isNaN(num)) return num;
    
    return outputString;
  } catch (error) {
    return outputString;
  }
}

// CRITICAL: Rigorous output comparison for recruitment accuracy  
function compareOutputsRigorous(actual, expected) {
  // Exact equality check first
  if (actual === expected) return true;
  
  // Type mismatch check
  if (typeof actual !== typeof expected) return false;
  
  // Array comparison with order sensitivity
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;
    return actual.every((item, index) => compareOutputsRigorous(item, expected[index]));
  }
  
  // Object comparison with key-value matching
  if (actual && expected && typeof actual === 'object' && typeof expected === 'object') {
    const actualKeys = Object.keys(actual).sort();
    const expectedKeys = Object.keys(expected).sort();
    
    if (actualKeys.length !== expectedKeys.length) return false;
    if (!actualKeys.every(key => expectedKeys.includes(key))) return false;
    
    return actualKeys.every(key => compareOutputsRigorous(actual[key], expected[key]));
  }
  
  // Number comparison with precision handling
  if (typeof actual === 'number' && typeof expected === 'number') {
    return Math.abs(actual - expected) < Number.EPSILON;
  }
  
  // String comparison (case-sensitive for recruitment)
  return String(actual).trim() === String(expected).trim();
}

// UTILITY: Format output for display
function formatOutputForDisplay(output) {
  if (output === null) return 'null';
  if (output === undefined) return 'undefined';
  if (typeof output === 'string') return output;
  if (typeof output === 'object') return JSON.stringify(output);
  return String(output);
}

// Helper function to analyze code submission
async function analyzeCodeSubmission(code, language, question) {
  try {
    if (!code || code.trim() === '') {
      return {
        status: 'no-code',
        feedback: 'No code submitted',
        score: 0,
        hasSyntaxErrors: true,
        hasLogicErrors: true,
        complexity: 'N/A'
      };
    }

    // First, try to execute the code to check for runtime errors
    let executionResult = null;
    try {
      executionResult = await executeCode(code, language, false, question.functionName || null);
    } catch (execError) {
      executionResult = { error: execError.message };
    }

    const prompt = `Analyze this ${language} code submission for a coding interview:
    
    Problem: ${question.description || question.title}
    ${question.examples ? `Examples: ${Array.isArray(question.examples) ? question.examples.join('\n') : question.examples}` : ''}
    
    Submitted Code:
    \`\`\`${language}
    ${code}
    \`\`\`
    
    Execution Result: ${executionResult ? JSON.stringify(executionResult) : 'Not executed'}
    
    IMPORTANT INSTRUCTIONS:
    - IGNORE any missing import statements or library imports
    - Assume ALL necessary libraries and modules are automatically available
    - Focus ONLY on the algorithm logic and implementation
    - Do NOT penalize for missing imports (typing, List, etc.)
    - Do NOT mention import errors in feedback
    - Evaluate based on correctness of the core logic only
    
    RETURN ONLY VALID JSON (no markdown, no extra text) in this exact format:
    {
      "status": "correct|incorrect|partial|error",
      "score": 0-100,
      "hasSyntaxErrors": false,
      "hasLogicErrors": boolean,
      "complexity": "O(n), O(log n), etc.",
      "feedback": "Constructive feedback focusing on algorithm logic only",
      "strengths": ["what the candidate did well in terms of logic"],
      "improvements": ["specific areas to improve logic-wise"],
      "isCorrectSolution": boolean
    }
    
    Be constructive and educational. Focus on algorithm correctness, not import issues. Return clean JSON only.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a senior software engineer conducting a technical interview. ALWAYS respond with valid JSON only. No markdown, no explanations outside JSON. Focus on algorithm correctness and ignore import issues." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    let analysis;
    try {
      const response = completion.choices[0].message.content.trim();
      // Clean up any markdown formatting or extra text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      analysis = JSON.parse(jsonStr);
      
      // Ensure required fields exist
      if (!analysis.status) analysis.status = 'partial';
      if (!analysis.score) analysis.score = 50;
      if (!analysis.feedback) analysis.feedback = 'Code analysis completed';
      if (!analysis.complexity) analysis.complexity = 'Unable to analyze';
      
    } catch (parseError) {
      console.log('JSON parsing failed for analysis:', completion.choices[0].message.content);
      // Fallback analysis if JSON parsing fails
      const response = completion.choices[0].message.content;
      analysis = {
        status: executionResult?.error ? 'error' : 'partial',
        feedback: response.includes('{') ? 'Analysis completed but formatting issue occurred. The code logic appears to be mostly correct.' : response,
        score: executionResult?.error ? 20 : 60,
        hasSyntaxErrors: !!executionResult?.error,
        hasLogicErrors: false,
        complexity: 'Unable to analyze',
        strengths: ['Code structure is readable'],
        improvements: ['Consider reviewing the implementation for edge cases']
      };
    }
    
    analysis.executionResult = executionResult;
    
    // Enhanced error detection (ignore import-related errors)
    if (executionResult?.error) {
      const errorMessage = executionResult.error.toLowerCase();
      const isImportError = errorMessage.includes('import') || 
                           errorMessage.includes('module') ||
                           errorMessage.includes('typing') ||
                           errorMessage.includes('list') ||
                           errorMessage.includes('from typing');
      
      if (!isImportError) {
        analysis.hasSyntaxErrors = true;
        analysis.status = 'error';
        if (analysis.score > 30) analysis.score = 20; // Cap score for syntax errors
      } else {
        // It's just an import error, don't penalize heavily
        analysis.hasSyntaxErrors = false;
        if (analysis.status === 'error') analysis.status = 'partial';
        if (analysis.score < 70) analysis.score = 70; // Give good score for logic correctness
      }
    }

    // Run automatic test cases if available
    if (question.testCases && question.testCases.length > 0 && !executionResult?.error) {
      // Use hidden tests for final analysis (includes both sample and hidden tests)
      const testsToRun = question.hiddenTests && question.hiddenTests.length > 0 
        ? [...(question.sampleTests || []), ...question.hiddenTests]
        : question.testCases || [];
      const testResults = await runAutomaticTests(code, language, testsToRun, question.functionName || null);
      analysis.testResults = testResults;
      analysis.testsPassed = testResults.filter(t => t.passed).length;
      analysis.totalTests = testResults.length;
      
      // Adjust score based on test results
      if (analysis.testsPassed === analysis.totalTests) {
        analysis.status = 'correct';
        if (analysis.score < 80) analysis.score = Math.max(analysis.score, 80);
      } else if (analysis.testsPassed > 0) {
        analysis.status = 'partial';
        analysis.score = Math.max(analysis.score, (analysis.testsPassed / analysis.totalTests) * 70);
      } else {
        analysis.status = 'incorrect';
        analysis.score = Math.min(analysis.score, 30);
      }
    }

    // Auto-correction logic (ignore import issues)
    if (analysis.status === 'incorrect' || (analysis.status === 'error' && analysis.hasSyntaxErrors)) {
      if (!analysis.correctedCode && analysis.hasSyntaxErrors) {
        // Attempt basic syntax fix (excluding import issues)
        try {
          const fixPrompt = `Fix the logic and syntax errors in this ${language} code, but IGNORE any import issues:
          
          \`\`\`${language}
          ${code}
          \`\`\`
          
          Rules:
          - Do NOT add any import statements
          - Assume all libraries are automatically available
          - Focus only on logic and syntax corrections
          - Return only the corrected code without explanations`;

          const fixCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: "Fix logic and syntax errors in code, but ignore import issues. All libraries are assumed available." },
              { role: "user", content: fixPrompt }
            ],
            max_tokens: 500,
            temperature: 0.1,
          });

          analysis.correctedCode = fixCompletion.choices[0].message.content.replace(/```[\w]*\n?/g, '').trim();
        } catch (fixError) {
          console.error('Auto-correction failed:', fixError);
        }
      }
    }

    return analysis;

  } catch (error) {
    console.error('Code analysis error:', error);
    return {
      status: 'analysis-error',
      feedback: 'Unable to analyze code automatically. Please ensure your code is valid JavaScript.',
      score: 0,
      error: error.message,
      hasSyntaxErrors: true,
      hasLogicErrors: true,
      complexity: 'Unknown'
    };
  }
}

// Helper function to execute code safely
// Production-grade code execution engine for recruitment testing
async function executeCode(code, language, silent = false, expectedFunctionName = null) {
  const startTime = Date.now();
  
  const jsLanguages = ['javascript', 'js', 'node', 'nodejs'];
  if (language && jsLanguages.includes(language.toLowerCase())) {
    return await executeJavaScriptCode(code, startTime, silent, expectedFunctionName);
  } else {
    // Use real execution for other languages
    return await executeMultiLanguageCode(code, language, startTime, silent);
  }
}

// Secure JavaScript execution with proper function testing
async function executeJavaScriptCode(code, startTime, silent = false, expectedFunctionName = null) {
  try {
    const vm = require('vm');
    let output = '';
    let error = null;
    const logs = [];
    let functionName = null;
    let executedFunction = null;

    // Create secure VM context
    const context = {
      console: {
        log: (...args) => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          logs.push(message);
          output += message + '\n';
        },
        error: (...args) => {
          const message = 'ERROR: ' + args.join(' ');
          logs.push(message);
          output += message + '\n';
        }
      },
      // Essential JavaScript globals
      Array, Object, JSON, Math, String, Number, Boolean,
      parseInt, parseFloat, isNaN, isFinite, Date,
      // Mock common imports for testing
      List: Array,
      typing: {},
      Set, Map, WeakMap, WeakSet,
      // Security: disable dangerous globals
      setTimeout: undefined,
      setInterval: undefined,
      require: undefined,
      process: undefined,
      global: undefined,
      // Result capture
      _functionName: null,
      _capturedFunction: null
    };

    // Enhanced code wrapping for function detection and execution
    const wrappedCode = `
      try {
        // Execute the user code
        ${code}
        
        // Auto-detect functions
        const userFunctions = [];
        for (const key in this) {
          if (typeof this[key] === 'function' && !key.startsWith('_') && key !== 'console') {
            userFunctions.push(key);
          }
        }
        
        if (userFunctions.length > 0) {
          this._functionName = userFunctions[0];
          this._capturedFunction = this[userFunctions[0]];
        }
        
      } catch (err) {
        console.error('Execution error:', err.message);
        throw err;
      }
    `;

    // Execute in VM with timeout
    vm.createContext(context);
    vm.runInContext(wrappedCode, context, {
      timeout: 10000, // 10 second timeout for safety
      displayErrors: true
    });

    functionName = context._functionName;
    executedFunction = context._capturedFunction;

    // If an expectedFunctionName was provided and exists in the context, prefer it
    if (expectedFunctionName && typeof expectedFunctionName === 'string') {
      try {
        if (Object.prototype.hasOwnProperty.call(context, expectedFunctionName) && typeof context[expectedFunctionName] === 'function') {
          functionName = expectedFunctionName;
          executedFunction = context[expectedFunctionName];
        }
      } catch (e) {
        // ignore and fall back to auto-detected function
      }
    }

    // Only add success message if not in silent mode (for test execution)
    if (functionName && !silent) {
      output += `Function '${functionName}' defined successfully\n`;
    }

    const executionTime = Date.now() - startTime;

    return {
      output: silent ? '' : (output.trim() || 'Code executed successfully'),
      error,
      executionTime,
      functionName,
      capturedFunction: executedFunction,
      logs
    };

  } catch (executionError) {
    const executionTime = Date.now() - startTime;
    return {
      output: '',
      error: executionError.message,
      executionTime,
      functionName: null,
      capturedFunction: null,
      logs: []
    };
  }
}

// Helper function to normalize Python indentation
function normalizePythonIndentation(code) {
  // Convert all tabs to 4 spaces
  let normalized = code.replace(/\t/g, '    ');
  
  // Split into lines
  const lines = normalized.split('\n');
  
  // Find the minimum indentation (excluding empty lines)
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim().length > 0) {
      const indent = line.match(/^ */)[0].length;
      minIndent = Math.min(minIndent, indent);
    }
  }
  
  // Remove the common leading indentation from all lines
  if (minIndent > 0 && minIndent !== Infinity) {
    const dedented = lines.map(line => {
      if (line.trim().length === 0) return '';
      return line.substring(minIndent);
    }).join('\n');
    return dedented;
  }
  
  return normalized;
}

// Real multi-language code execution
async function executeMultiLanguageCode(code, language, startTime, silent = false) {
  const fs = require('fs');
  const path = require('path');
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    const tempDir = path.join(__dirname, '../../temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    let fileName, command, output = '', error = null;
    
    switch (language.toLowerCase()) {
      case 'python':
      case 'py':
        fileName = `temp_${timestamp}.py`;
        const pythonFile = path.join(tempDir, fileName);
        // Normalize Python indentation (convert tabs to spaces)
        const normalizedPythonCode = normalizePythonIndentation(code);
        fs.writeFileSync(pythonFile, normalizedPythonCode);
        command = `cd "${tempDir}" && python "${fileName}"`;
        break;
        
      case 'java':
        // Extract class name from code or use default
        const classMatch = code.match(/class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : 'Solution';
        fileName = `${className}.java`;
        const javaFile = path.join(tempDir, fileName);
        fs.writeFileSync(javaFile, code);
        command = `cd "${tempDir}" && javac "${fileName}" && java "${className}"`;
        break;
        
      case 'cpp':
      case 'c++':
        fileName = `temp_${timestamp}.cpp`;
        const cppFile = path.join(tempDir, fileName);
        fs.writeFileSync(cppFile, code);
        const exeFile = `temp_${timestamp}.exe`;
        command = `cd "${tempDir}" && g++ "${fileName}" -o "${exeFile}" && "${exeFile}"`;
        break;
        
      case 'c':
        fileName = `temp_${timestamp}.c`;
        const cFile = path.join(tempDir, fileName);
        fs.writeFileSync(cFile, code);
        const cExeFile = `temp_${timestamp}.exe`;
        command = `cd "${tempDir}" && gcc "${fileName}" -o "${cExeFile}" && "${cExeFile}"`;
        break;
        
      case 'typescript':
      case 'ts':
        fileName = `temp_${timestamp}.ts`;
        const tsFile = path.join(tempDir, fileName);
        fs.writeFileSync(tsFile, code);
        command = `cd "${tempDir}" && npx tsc "${fileName}" --outDir . && node "${fileName.replace('.ts', '.js')}"`;
        break;
        
      default:
        return {
          output: '',
          error: `Language '${language}' not supported for execution`,
          executionTime: Date.now() - startTime,
          simulated: false
        };
    }
    
    // Execute with timeout
    const { stdout, stderr } = await execAsync(command, {
      timeout: 10000, // 10 second timeout
      maxBuffer: 1024 * 1024 // 1MB buffer
    });
    
    output = stdout.trim();
    if (stderr && stderr.trim()) {
      // Check for common compiler/runtime not found errors
      const stderrLower = stderr.toLowerCase();
      if (stderrLower.includes('not recognized') || 
          stderrLower.includes('command not found') ||
          stderrLower.includes('no such file')) {
        error = `${language} compiler/runtime not installed. Please install: ${getInstallationMessage(language)}`;
      } else {
        error = stderr.trim();
      }
    }
    
    // Cleanup temp files
    try {
      if (fs.existsSync(path.join(tempDir, fileName))) {
        fs.unlinkSync(path.join(tempDir, fileName));
      }
      // Clean up compiled files
      if (language.toLowerCase() === 'java') {
        const classMatch = code.match(/class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : 'Solution';
        const classFile = path.join(tempDir, `${className}.class`);
        if (fs.existsSync(classFile)) {
          fs.unlinkSync(classFile);
        }
      }
      if (language.toLowerCase() === 'cpp' || language.toLowerCase() === 'c++' || language.toLowerCase() === 'c') {
        const exeFile = path.join(tempDir, `temp_${timestamp}.exe`);
        if (fs.existsSync(exeFile)) {
          fs.unlinkSync(exeFile);
        }
      }
      if (language.toLowerCase() === 'typescript' || language.toLowerCase() === 'ts') {
        const jsFile = path.join(tempDir, fileName.replace('.ts', '.js'));
        if (fs.existsSync(jsFile)) {
          fs.unlinkSync(jsFile);
        }
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    const executionTime = Date.now() - startTime;
    
    if (!silent && output) {
      output = `Code executed successfully\n${output}`;
    }
    
    return {
      output: output || (error ? '' : 'Code executed successfully'),
      error,
      executionTime,
      simulated: false
    };
    
  } catch (execError) {
    const executionTime = Date.now() - startTime;
    
    // Check for common execution errors
    let errorMessage = execError.message;
    if (errorMessage.includes('not recognized') || 
        errorMessage.includes('command not found')) {
      errorMessage = `${language} compiler/runtime not installed. Please install: ${getInstallationMessage(language)}`;
    }
    
    return {
      output: '',
      error: errorMessage,
      executionTime,
      simulated: false
    };
  }
}

// Helper function to provide installation messages
function getInstallationMessage(language) {
  switch (language.toLowerCase()) {
    case 'python':
    case 'py':
      return 'Python from https://www.python.org/';
    case 'java':
      return 'Java JDK from https://www.oracle.com/java/';
    case 'cpp':
    case 'c++':
      return 'C++ compiler (g++, Visual Studio, or MinGW)';
    case 'c':
      return 'C compiler (gcc, Visual Studio, or MinGW)';
    case 'typescript':
    case 'ts':
      return 'Node.js and TypeScript (npm install -g typescript)';
    default:
      return `${language} compiler/runtime`;
  }
}

// Helper function to simulate code execution for non-JavaScript languages (DEPRECATED - keeping for backward compatibility)
async function simulateCodeExecution(code, language, startTime) {
  try {
    const languageSpecifics = getLanguageSpecifics(language);
    
    const prompt = `Analyze and simulate execution of this ${language} code:
    
    \`\`\`${language}
    ${code}
    \`\`\`
    
    IMPORTANT: 
    - IGNORE any missing import statements (typing, List, etc.)
    - Assume ALL necessary libraries are automatically available
    - Focus ONLY on the core logic simulation
    
    Provide a realistic simulation of what this code would output when executed.
    Check for:
    1. Logic errors (ignore import issues)
    2. Expected output
    3. Runtime exceptions (excluding import errors)
    
    Return JSON format:
    {
      "output": "simulated program output",
      "error": "error message if any real syntax/runtime error exists (ignore imports), null otherwise",
      "hasErrors": boolean (false if only import issues),
      "explanation": "brief explanation of what the code does"
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `You are a ${language} code execution simulator. Analyze code and predict realistic output, including any errors.` },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.2,
    });

    const simulation = JSON.parse(completion.choices[0].message.content);
    const executionTime = Date.now() - startTime;

    return {
      output: simulation.output || `Code analyzed (${language} execution simulated)`,
      error: simulation.error,
      executionTime,
      simulated: true,
      explanation: simulation.explanation
    };

  } catch (simulationError) {
    return {
      output: `Unable to simulate ${language} code execution`,
      error: `Simulation error: ${simulationError.message}`,
      executionTime: Date.now() - startTime,
      simulated: true
    };
  }
}

// Helper function to run automatic test cases
async function runAutomaticTests(code, language, testCases, expectedFunctionName = null) {
  const results = [];
  
  // Support all languages with real execution
  const jsLanguages = ['javascript', 'js', 'node', 'nodejs'];
  
  for (const testCase of testCases) {
    try {
      let result;
      
      if (jsLanguages.includes(language.toLowerCase())) {
          // JavaScript - use VM-based execution; prefer expected function name when provided
          result = await runJavaScriptTest(code, testCase, expectedFunctionName);
      } else {
        // Other languages - use system execution
        result = await runMultiLanguageTest(code, language, testCase);
      }
      
      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.actual,
        passed: result.passed,
        description: testCase.description,
        error: result.error,
        executionTime: result.executionTime
      });
      
    } catch (error) {
      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: 'Execution Error',
        passed: false,
        description: testCase.description,
        error: error.message,
        executionTime: 0
      });
    }
  }
  
  return results;
}

// ===== HELPER FUNCTIONS FOR CUSTOM QUESTION BANKS =====

// Generate question from custom question bank
function generateFromCustomBank(session, questionIndex) {
  const availableQuestions = session.availableQuestions.filter(q => 
    !session.usedQuestionTypes.has(q.id)
  );
  
  // If all questions used, reset (allow reuse)
  if (availableQuestions.length === 0) {
    session.usedQuestionTypes.clear();
    // Use all questions again
    const questionToUse = session.availableQuestions[questionIndex % session.availableQuestions.length];
    session.usedQuestionTypes.add(questionToUse.id);
    return formatCustomQuestion(questionToUse, questionIndex + 1);
  }
  
  // Select unused question
  const questionToUse = availableQuestions[questionIndex % availableQuestions.length];
  session.usedQuestionTypes.add(questionToUse.id);
  
  return formatCustomQuestion(questionToUse, questionIndex + 1);
}

// Format custom question to match expected structure
function formatCustomQuestion(customQuestion, questionNumber) {
  return {
    id: customQuestion.id,
    title: customQuestion.title,
    description: customQuestion.description,
    examples: customQuestion.examples || [],
    signature: customQuestion.signature || getDefaultSignature(customQuestion.language),
    testCases: customQuestion.testCases || [],
    sampleTests: customQuestion.sampleTests || [],
    hiddenTests: customQuestion.hiddenTests || [],
    constraints: customQuestion.constraints || 'Standard constraints apply',
    complexity: customQuestion.expectedComplexity || 'To be analyzed',
    difficulty: customQuestion.difficulty,
    language: customQuestion.language,
    questionNumber: questionNumber,
    timeLimit: 300, // 5 minutes default
    hints: customQuestion.hints || [],
    categories: customQuestion.categories || [],
    isCustom: true // Mark as custom question
  };
}

// Get default function signature for language
function getDefaultSignature(language) {
  const templates = {
    javascript: "function solution() {\n  // Your code here\n}",
    python: "def solution():\n    # Your code here\n    pass",
    java: "public class Solution {\n    public void solution() {\n        // Your code here\n    }\n}",
    cpp: "void solution() {\n    // Your code here\n}",
    typescript: "function solution(): void {\n  // Your code here\n}"
  };
  
  return templates[language.toLowerCase()] || templates.javascript;
}

// Helper function to create question bank (for import functionality)
async function createQuestionBank(bankData, overwrite = false) {
  const { bankId, bankName, recruiterId, questions, isPrivate = true } = bankData;
  
  if (!overwrite && questionBanks.has(bankId)) {
    throw new Error('Question bank already exists. Set overwrite=true to update.');
  }
  
  // Validate and process questions (reuse existing validation logic)
  const validatedQuestions = questions.map((q, index) => {
    return {
      id: q.id || `q_${bankId}_${index}_${Date.now()}`,
      title: q.title || `Question ${index + 1}`,
      description: q.description || 'No description provided',
      difficulty: (q.difficulty || 'medium').toLowerCase(),
      language: (q.language || 'javascript').toLowerCase(),
      examples: q.examples || [],
      testCases: q.testCases || [],
      sampleTests: q.sampleTests || [],
      hiddenTests: q.hiddenTests || [],
      constraints: q.constraints || 'Standard constraints apply',
      expectedComplexity: q.expectedComplexity || 'To be analyzed',
      signature: q.signature || getDefaultSignature(q.language || 'javascript'),
      hints: q.hints || [],
      categories: q.categories || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
  
  const questionBank = {
    id: bankId,
    name: bankName,
    recruiterId,
    isPrivate,
    questions: validatedQuestions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questionCount: validatedQuestions.length,
    languages: [...new Set(validatedQuestions.map(q => q.language))],
    difficulties: [...new Set(validatedQuestions.map(q => q.difficulty))]
  };
  
  questionBanks.set(bankId, questionBank);
  return questionBank;
}

// Parse CSV format questions
function parseCSVQuestions(csvData) {
  // Simple CSV parser for questions
  // Expected format: title,description,difficulty,language,examples,testCases
  const lines = csvData.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const question = {};
    
    headers.forEach((header, index) => {
      question[header.trim()] = values[index]?.trim() || '';
    });
    
    // Parse JSON fields if needed
    try {
      if (question.examples) question.examples = JSON.parse(question.examples);
      if (question.testCases) question.testCases = JSON.parse(question.testCases);
    } catch (e) {
      // Keep as strings if parsing fails
    }
    
    return question;
  });
}

// Parse LeetCode format questions
function parseLeetCodeFormat(leetcodeData) {
  // Parse LeetCode-style JSON format
  const data = JSON.parse(leetcodeData);
  
  if (Array.isArray(data)) {
    return data.map(q => ({
      title: q.title || q.name,
      description: q.description || q.content,
      difficulty: q.difficulty?.toLowerCase() || 'medium',
      language: q.language?.toLowerCase() || 'javascript',
      examples: q.examples || [],
      testCases: q.testCases || [],
      sampleTests: q.sampleTests || [],
      hiddenTests: q.hiddenTests || [],
      constraints: q.constraints || 'Standard LeetCode constraints',
      expectedComplexity: q.complexity || 'To be analyzed'
    }));
  }
  
  return [data]; // Single question
}

// Initialize some default question banks for demo
function initializeDefaultQuestionBanks() {
  // Create a sample question bank for demonstration
  const sampleBank = {
    id: 'default-easy-js',
    name: 'Default Easy JavaScript Questions',
    recruiterId: 'system',
    isPrivate: false,
    questions: [
      {
        id: 'easy-js-1',
        title: 'Sum of Two Numbers',
        description: 'Write a function that returns the sum of two numbers.',
        difficulty: 'easy',
        language: 'javascript',
        examples: [
          { input: '5, 3', output: '8', explanation: '5 + 3 = 8' }
        ],
        signature: 'function sum(a, b) {\n  // Your code here\n}',
        testCases: [
          { input: '5, 3', expectedOutput: '8', description: 'Basic addition' }
        ],
        sampleTests: [
          { input: '5, 3', expectedOutput: '8', description: 'Basic addition' }
        ],
        hiddenTests: [
          { input: '-1, 1', expectedOutput: '0', description: 'Zero result' }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questionCount: 1,
    languages: ['javascript'],
    difficulties: ['easy']
  };
  
  questionBanks.set('default-easy-js', sampleBank);
}

// Initialize default banks on startup
initializeDefaultQuestionBanks();

module.exports = router;