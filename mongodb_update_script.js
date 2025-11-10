// MongoDB Update Script for Candidate Document
// Run this in MongoDB Compass or mongo shell

// Option 1: Complete document replacement (recommended for major updates)
db.candidates.replaceOne(
  { candidateId: "68f909508b0f083d6bf39efd" },
  {
    "candidateId": "68f909508b0f083d6bf39efd",
    "candidateName": "Navas",
    "position": "Full Stack Developer",
    "experience": "3 years", 
    "skills": [
      "JavaScript",
      "React",
      "Node.js", 
      "Python",
      "MongoDB",
      "Express.js",
      "HTML/CSS",
      "Git"
    ],
    "languages": [
      "JavaScript",
      "Python", 
      "HTML/CSS",
      "SQL"
    ],
    "projects": [
      {
        "name": "AI Technical Interviewer",
        "description": "Built an AI-powered interview system with voice recognition, real-time chat, and coding assessments",
        "techStack": [
          "React",
          "Node.js",
          "OpenAI API", 
          "MongoDB",
          "Speech Recognition"
        ]
      },
      {
        "name": "Recruitment Platform", 
        "description": "Developed a recruitment management system for job posting and candidate tracking",
        "techStack": [
          "React",
          "Node.js",
          "MongoDB",
          "Express.js"
        ]
      }
    ],
    "codingQuestions": [
      {
        "id": "two-sum",
        "title": "Two Sum Problem",
        "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
        "difficulty": "easy",
        "language": "javascript",
        "timeLimit": 300,
        "signature": "function twoSum(nums, target) {\n    // Your code here\n    return [];\n}",
        "functionName": "twoSum",
        "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
        "expectedComplexity": "Time: O(n), Space: O(n)",
        "examples": [
          {
            "input": "nums = [2,7,11,15], target = 9",
            "output": "[0,1]", 
            "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
          },
          {
            "input": "nums = [3,2,4], target = 6",
            "output": "[1,2]",
            "explanation": "Because nums[1] + nums[2] == 6, we return [1, 2]."
          }
        ],
        "sampleTests": [
          {
            "input": "[2, 7, 11, 15], 9",
            "expectedOutput": "[0, 1]",
            "description": "Basic case from example"
          },
          {
            "input": "[3, 2, 4], 6", 
            "expectedOutput": "[1, 2]",
            "description": "Second example case"
          }
        ],
        "hiddenTests": [
          {
            "input": "[3, 3], 6",
            "expectedOutput": "[0, 1]",
            "description": "Duplicate numbers"
          },
          {
            "input": "[-1, -2, -3, -4, -5], -8",
            "expectedOutput": "[2, 4]",
            "description": "Negative numbers"
          },
          {
            "input": "[1, 2, 3, 4, 5, 6, 7, 8, 9], 17", 
            "expectedOutput": "[7, 8]",
            "description": "Larger array, last elements"
          }
        ],
        "testCases": [
          {
            "input": "[2, 7, 11, 15], 9",
            "expectedOutput": "[0, 1]",
            "description": "Example 1"
          },
          {
            "input": "[3, 2, 4], 6",
            "expectedOutput": "[1, 2]",
            "description": "Example 2"
          },
          {
            "input": "[3, 3], 6", 
            "expectedOutput": "[0, 1]",
            "description": "Duplicate elements"
          },
          {
            "input": "[-1, -2, -3, -4, -5], -8",
            "expectedOutput": "[2, 4]", 
            "description": "Negative numbers"
          },
          {
            "input": "[1, 2, 3, 4, 5, 6, 7, 8, 9], 17",
            "expectedOutput": "[7, 8]",
            "description": "Larger array"
          }
        ]
      },
      {
        "id": "palindrome-check",
        "title": "Valid Palindrome",
        "description": "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string s, return true if it is a palindrome, or false otherwise.",
        "difficulty": "easy",
        "language": "javascript",
        "timeLimit": 240, 
        "signature": "function isPalindrome(s) {\n    // Your code here\n    return false;\n}",
        "functionName": "isPalindrome",
        "constraints": "1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.",
        "expectedComplexity": "Time: O(n), Space: O(1)",
        "examples": [
          {
            "input": "s = \"A man, a plan, a canal: Panama\"",
            "output": "true",
            "explanation": "After removing non-alphanumeric characters and converting to lowercase: 'amanaplanacanalpanama' is a palindrome."
          },
          {
            "input": "s = \"race a car\"",
            "output": "false",
            "explanation": "After processing: 'raceacar' is not a palindrome."
          }
        ],
        "sampleTests": [
          {
            "input": "\"A man, a plan, a canal: Panama\"", 
            "expectedOutput": "true",
            "description": "Classic palindrome with spaces and punctuation"
          },
          {
            "input": "\"race a car\"",
            "expectedOutput": "false",
            "description": "Not a palindrome"
          }
        ],
        "hiddenTests": [
          {
            "input": "\" \"",
            "expectedOutput": "true",
            "description": "Single space becomes empty string (palindrome)"
          },
          {
            "input": "\"a\"",
            "expectedOutput": "true", 
            "description": "Single character"
          },
          {
            "input": "\"Madam\"",
            "expectedOutput": "true",
            "description": "Case insensitive palindrome"
          }
        ],
        "testCases": [
          {
            "input": "\"A man, a plan, a canal: Panama\"",
            "expectedOutput": "true",
            "description": "Example 1"
          },
          {
            "input": "\"race a car\"",
            "expectedOutput": "false", 
            "description": "Example 2"
          },
          {
            "input": "\" \"",
            "expectedOutput": "true",
            "description": "Edge case - space only"
          },
          {
            "input": "\"a\"",
            "expectedOutput": "true",
            "description": "Single character"
          }
        ]
      }
    ],
    "createdAt": new Date(),
    "updatedAt": new Date()
  }
);

// Option 2: Just add proper test cases to existing questions
db.candidates.updateOne(
  { candidateId: "68f909508b0f083d6bf39efd" },
  {
    $set: {
      "codingQuestions.$[elem].sampleTests": [
        {
          "input": "[2, 7, 11, 15], 9",
          "expectedOutput": "[0, 1]",
          "description": "Basic two sum case"
        }
      ],
      "codingQuestions.$[elem].hiddenTests": [
        {
          "input": "[3, 3], 6", 
          "expectedOutput": "[0, 1]",
          "description": "Duplicate numbers case"
        },
        {
          "input": "[-1, -2, -3, -4, -5], -8",
          "expectedOutput": "[2, 4]",
          "description": "Negative numbers case"
        }
      ],
      "codingQuestions.$[elem].testCases": [
        {
          "input": "[2, 7, 11, 15], 9",
          "expectedOutput": "[0, 1]",
          "description": "Example 1"
        },
        {
          "input": "[3, 2, 4], 6",
          "expectedOutput": "[1, 2]",
          "description": "Example 2"
        },
        {
          "input": "[3, 3], 6",
          "expectedOutput": "[0, 1]", 
          "description": "Duplicate elements"
        }
      ],
      "codingQuestions.$[elem].functionName": "twoSum",
      "codingQuestions.$[elem].signature": "function twoSum(nums, target) {\n    // Your code here\n    return [];\n}",
      "codingQuestions.$[elem].constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
      "codingQuestions.$[elem].expectedComplexity": "Time: O(n), Space: O(n)",
      "codingQuestions.$[elem].examples": [
        {
          "input": "nums = [2,7,11,15], target = 9",
          "output": "[0,1]",
          "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
        }
      ]
    }
  },
  {
    arrayFilters: [{ "elem.title": { $regex: "Two Sum", $options: "i" } }]
  }
);

// Verification query - run this to check your update worked
db.candidates.findOne(
  { candidateId: "68f909508b0f083d6bf39efd" },
  { 
    candidateId: 1, 
    candidateName: 1, 
    "codingQuestions.title": 1,
    "codingQuestions.sampleTests": 1,
    "codingQuestions.hiddenTests": 1
  }
);