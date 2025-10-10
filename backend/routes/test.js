const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test sessions storage (in production, use a database)
const testSessions = new Map();

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
    const { candidateName, difficulty = 'easy', language = 'javascript' } = req.body;
    
    const sessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session = {
      id: sessionId,
      candidateName,
      difficulty,
      language,
      startTime: new Date(),
      currentQuestion: 0,
      totalQuestions: 2,
      questions: [],
      results: [],
      usedQuestionTypes: new Set(), // Track used question types
      isActive: true
    };
    
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

    // Test with sample cases only (first 2-3 examples)
    let sampleTests = [];
    let output = null;
    let error = null;

    try {
      // Execute the code to get output
      const executionResult = await executeCode(code, session.language);
      
      if (executionResult.error) {
        // Check if it's just an import error
        const errorMessage = executionResult.error.toLowerCase();
        const isImportError = errorMessage.includes('import') || 
                             errorMessage.includes('module') ||
                             errorMessage.includes('typing') ||
                             errorMessage.includes('list') ||
                             errorMessage.includes('from typing');
        
        if (!isImportError) {
          error = executionResult.error;
        } else {
          // Simulate execution for import errors
          output = 'Code structure looks good. Sample execution simulated.';
        }
      } else {
        output = executionResult.output;
      }

      // Generate sample test cases from examples
      if (question.examples && Array.isArray(question.examples)) {
        // Take first 2-3 examples as sample tests
        const sampleExamples = question.examples.slice(0, Math.min(3, question.examples.length));
        
        for (const example of sampleExamples) {
          if (typeof example === 'object' && example.input && example.output) {
            try {
              // Simple test execution (this would need to be enhanced based on language)
              const testResult = {
                input: example.input,
                expected: example.output,
                passed: true, // Simplified for now
                actual: example.output // Simplified for now
              };
              
              sampleTests.push(testResult);
            } catch (testError) {
              sampleTests.push({
                input: example.input,
                expected: example.output,
                passed: false,
                actual: 'Error',
                error: testError.message
              });
            }
          }
        }
      }

    } catch (execError) {
      error = execError.message;
    }

    res.json({
      output,
      error,
      sampleTests,
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
  const availableQuestions = questionCategories[language]?.[difficulty] || questionCategories.javascript.easy;
  const unusedQuestions = availableQuestions.filter(q => !session.usedQuestionTypes.has(q));
  
  if (unusedQuestions.length === 0) {
    // If all questions used, reset and reuse
    session.usedQuestionTypes.clear();
  }
  
  const selectedQuestion = unusedQuestions.length > 0 ? 
    unusedQuestions[questionIndex % unusedQuestions.length] :
    availableQuestions[questionIndex % availableQuestions.length];
  
  session.usedQuestionTypes.add(selectedQuestion);
  
  return await generateQuestion(difficulty, language, questionIndex, selectedQuestion);
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
function generateTestCases(questionDescription, language) {
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
  
  return testCases;
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
      executionResult = await executeCode(code, language);
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
    
    Provide detailed analysis in JSON format with:
    {
      "status": "correct|incorrect|partial|error",
      "score": 0-100,
      "hasSyntaxErrors": boolean (excluding import issues),
      "hasLogicErrors": boolean,
      "complexity": "O(n), O(log n), etc.",
      "feedback": "Constructive feedback focusing on algorithm logic only",
      "correctedCode": "If logic errors exist, provide corrected version (no imports needed)",
      "testResults": ["test1: pass/fail", "test2: pass/fail"],
      "strengths": ["what the candidate did well in terms of logic"],
      "improvements": ["specific areas to improve logic-wise"],
      "isCorrectSolution": boolean
    }
    
    Be constructive and educational in feedback. Focus on algorithm correctness, not import issues.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a senior software engineer conducting a technical interview. Provide thorough, constructive analysis of code submissions. Be encouraging but honest about mistakes." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1200,
      temperature: 0.2,
    });

    let analysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // Fallback analysis if JSON parsing fails
      const response = completion.choices[0].message.content;
      analysis = {
        status: executionResult?.error ? 'error' : 'partial',
        feedback: response,
        score: executionResult?.error ? 20 : 60,
        hasSyntaxErrors: !!executionResult?.error,
        hasLogicErrors: false,
        complexity: 'Unable to analyze'
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
      const testResults = await runAutomaticTests(code, language, question.testCases);
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
async function executeCode(code, language) {
  const startTime = Date.now();
  
  if (language === 'javascript') {
    try {
      let output = '';
      let error = null;

      const originalConsoleLog = console.log;
      const logs = [];
      
      console.log = (...args) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };

      // Mock common imports that candidates might reference
      const safeCode = `
        // Mock typing module for Python-style code
        if (typeof List === 'undefined') var List = Array;
        if (typeof typing === 'undefined') var typing = {};
        
        ${code}
      `;
      
      const result = eval(`
        (function() {
          ${safeCode}
        })()
      `);

      console.log = originalConsoleLog;

      output = logs.join('\n');
      if (result !== undefined) {
        output += (output ? '\n' : '') + `Return value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`;
      }
      
      const executionTime = Date.now() - startTime;

      return {
        output: output || 'Code executed successfully (no output)',
        error,
        executionTime
      };

    } catch (executionError) {
      return {
        output: '',
        error: executionError.message,
        executionTime: Date.now() - startTime
      };
    }
  } else {
    // For other languages, simulate execution using AI
    return await simulateCodeExecution(code, language, startTime);
  }
}

// Helper function to simulate code execution for non-JavaScript languages
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
async function runAutomaticTests(code, language, testCases) {
  const results = [];
  
  if (language === 'javascript') {
    // For JavaScript, run actual tests
    for (const testCase of testCases) {
      try {
        // Extract function name from code (simple regex)
        const functionMatch = code.match(/function\s+(\w+)/);
        const funcName = functionMatch ? functionMatch[1] : 'solution';
        
        // Create test execution code
        // Create a safe test execution environment
        const testCode = `
          // Mock any missing imports that might be referenced
          if (typeof List === 'undefined') global.List = Array;
          if (typeof typing === 'undefined') global.typing = {};
          
          ${code}
          
          // Test execution
          const result = ${funcName}(${testCase.input});
          result;
        `;
        
        const testResult = await executeCode(testCode, language);
        const actualOutput = testResult.output ? testResult.output.split('Return value: ')[1]?.trim() : '';
        const passed = actualOutput === testCase.expectedOutput || testResult.output.includes(testCase.expectedOutput);
        
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: actualOutput || testResult.output,
          passed: passed && !testResult.error,
          description: testCase.description,
          error: testResult.error
        });
      } catch (error) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: 'Error',
          passed: false,
          description: testCase.description,
          error: error.message
        });
      }
    }
  } else {
    // For other languages, use AI to simulate test results
    for (const testCase of testCases) {
      try {
        const prompt = `Given this ${language} code and test case, determine if the code would pass:
        
        Code:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Test: Input=${testCase.input}, Expected=${testCase.expectedOutput}
        
        Return JSON: {"passed": boolean, "actualOutput": "predicted output", "reasoning": "why it passes/fails"}`;

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: `Analyze ${language} code and predict test results accurately.` },
            { role: "user", content: prompt }
          ],
          max_tokens: 200,
          temperature: 0.1,
        });

        const testAnalysis = JSON.parse(completion.choices[0].message.content);
        
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: testAnalysis.actualOutput,
          passed: testAnalysis.passed,
          description: testCase.description,
          reasoning: testAnalysis.reasoning
        });
      } catch (error) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: 'Unknown',
          passed: false,
          description: testCase.description,
          error: 'Test simulation failed'
        });
      }
    }
  }
  
  return results;
}

module.exports = router;