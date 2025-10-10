const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat with AI for interview questions and code assistance
router.post('/message', async (req, res) => {
  try {
    const { message, context, codeContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = `You are an AI technical interviewer and coding assistant. 
    You help candidates with coding problems, provide hints, explanations, and feedback.
    Be encouraging but also provide constructive criticism when needed.
    Focus on helping the candidate learn and improve their problem-solving skills.
    
    ${codeContext ? `Current code context:\n${codeContext}` : ''}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        ...context,
        { role: "user", content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    res.json({ 
      response,
      usage: completion.usage 
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.message 
    });
  }
});

// Generate interview questions
router.post('/generate-question', async (req, res) => {
  try {
    const { difficulty, topic, language } = req.body;

    // Mock questions for different topics when OpenAI API is not available
    const mockQuestions = {
      algorithms: {
        title: "Two Sum Problem",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
        examples: [
          "Input: nums = [2,7,11,15], target = 9 → Output: [0,1] (because nums[0] + nums[1] = 2 + 7 = 9)",
          "Input: nums = [3,2,4], target = 6 → Output: [1,2]",
          "Input: nums = [3,3], target = 6 → Output: [0,1]"
        ],
        constraints: [
          "2 ≤ nums.length ≤ 10⁴",
          "-10⁹ ≤ nums[i] ≤ 10⁹",
          "-10⁹ ≤ target ≤ 10⁹",
          "Only one valid answer exists"
        ],
        timeComplexity: "O(n)"
      },
      arrays: {
        title: "Maximum Subarray",
        description: "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
        examples: [
          "Input: nums = [-2,1,-3,4,-1,2,1,-5,4] → Output: 6 (subarray [4,-1,2,1] has sum 6)",
          "Input: nums = [1] → Output: 1",
          "Input: nums = [5,4,-1,7,8] → Output: 23"
        ],
        constraints: [
          "1 ≤ nums.length ≤ 10⁵",
          "-10⁴ ≤ nums[i] ≤ 10⁴"
        ],
        timeComplexity: "O(n)"
      },
      strings: {
        title: "Valid Palindrome",
        description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome, or false otherwise.",
        examples: [
          "Input: s = \"A man, a plan, a canal: Panama\" → Output: true",
          "Input: s = \"race a car\" → Output: false",
          "Input: s = \" \" → Output: true (empty string after cleanup)"
        ],
        constraints: [
          "1 ≤ s.length ≤ 2 × 10⁵",
          "s consists only of printable ASCII characters"
        ],
        timeComplexity: "O(n)"
      }
    };

    // Try to use OpenAI API first, fall back to mock data if it fails
    try {
      const prompt = `Generate a ${difficulty || 'medium'} level coding interview question about ${topic || 'algorithms'} 
      suitable for ${language || 'JavaScript'}. 

      Return ONLY valid JSON in this exact format:
      {
        "title": "Problem Title",
        "description": "Problem description here",
        "examples": ["Example 1: Input: [1,2,3] Output: 6", "Example 2: Input: [4,5] Output: 9"],
        "constraints": ["1 <= n <= 1000", "All numbers are positive"],
        "timeComplexity": "O(n)"
      }`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a technical interview question generator. You must respond with valid JSON only, no additional text or formatting." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.8,
      });

      const response = completion.choices[0].message.content.trim();
      const questionData = JSON.parse(response);
      
      // Ensure arrays exist for frontend compatibility
      const formattedQuestion = {
        title: questionData.title || "Coding Challenge",
        description: questionData.description || "Solve this problem",
        examples: Array.isArray(questionData.examples) ? questionData.examples : [questionData.examples || "No examples provided"],
        constraints: Array.isArray(questionData.constraints) ? questionData.constraints : [questionData.constraints || "No constraints specified"],
        timeComplexity: questionData.timeComplexity || "Not specified"
      };
      
      res.json(formattedQuestion);

    } catch (openaiError) {
      console.log('OpenAI API unavailable, using mock question:', openaiError.message);
      
      // Use mock question based on topic
      const mockQuestion = mockQuestions[topic] || mockQuestions.algorithms;
      res.json(mockQuestion);
    }

  } catch (error) {
    console.error('Question Generation Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate question',
      details: error.message 
    });
  }
});

module.exports = router;