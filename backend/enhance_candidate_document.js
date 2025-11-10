// MongoDB Update Script for Enhanced Question Format
// This script transforms your existing document to support multi-language signatures and enhanced structure

const { MongoClient } = require('mongodb');

// MongoDB connection configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'test';
const COLLECTION_NAME = process.env.MONGO_CONFIGS_FALLBACK_COLLECTION || 'candidates';

async function updateCandidateDocument() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Find the specific candidate
    const candidateId = '68f909508b0f083d6bf39efd';
    const existingDoc = await collection.findOne({ candidateId });
    
    if (!existingDoc) {
      console.log('❌ Candidate not found:', candidateId);
      return;
    }
    
    console.log('📋 Found existing document:', existingDoc.candidateName);
    
    // Enhanced document with multi-language support
    const enhancedDoc = {
      "_id": existingDoc._id,
      "candidateId": candidateId,
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
      "codingAssessment": {
        "candidateId": candidateId,
        "candidateName": "Navas",
        "difficulty": "medium",
        "language": "javascript",
        "timePerQuestion": 450,
        "questions": [
          {
            "id": "two-sum",
            "title": "Two Sum",
            "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
            "difficulty": "easy",
            "language": "javascript",
            "timeLimit": 300,
            "signatures": {
              "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Your code here\n};",
              "python": "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Your code here\n        pass",
              "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[0];\n    }\n}",
              "cpp": "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your code here\n        return {};\n    }\n};"
            },
            "functionName": "twoSum",
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
              },
              {
                "input": "nums = [3,3], target = 6",
                "output": "[0,1]",
                "explanation": "Because nums[0] + nums[1] == 6, we return [0, 1]."
              }
            ],
            "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
            "expectedComplexity": "Time: O(n), Space: O(n)",
            "sampleTests": [
              {
                "input": "([2,7,11,15], 9)",
                "expectedOutput": "[0,1]",
                "description": "Basic two sum"
              },
              {
                "input": "([3,2,4], 6)",
                "expectedOutput": "[1,2]",
                "description": "Different indices"
              }
            ],
            "hiddenTests": [
              {
                "input": "([3,3], 6)",
                "expectedOutput": "[0,1]",
                "description": "Same values"
              },
              {
                "input": "([-1,-2,-3,-4,-5], -8)",
                "expectedOutput": "[2,4]",
                "description": "Negative numbers"
              }
            ],
            "testCases": [
              {
                "input": "([2,7,11,15], 9)",
                "expectedOutput": "[0,1]",
                "description": "Example case"
              },
              {
                "input": "([3,2,4], 6)",
                "expectedOutput": "[1,2]",
                "description": "Second example"
              },
              {
                "input": "([3,3], 6)",
                "expectedOutput": "[0,1]",
                "description": "Duplicate values"
              }
            ]
          },
          {
            "id": "valid-parentheses",
            "title": "Valid Parentheses", 
            "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets. Open brackets must be closed in the correct order.",
            "difficulty": "easy",
            "language": "javascript",
            "timeLimit": 300,
            "signatures": {
              "javascript": "/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    // Your code here\n};",
              "python": "class Solution:\n    def isValid(self, s: str) -> bool:\n        # Your code here\n        pass",
              "java": "class Solution {\n    public boolean isValid(String s) {\n        // Your code here\n        return false;\n    }\n}",
              "cpp": "class Solution {\npublic:\n    bool isValid(string s) {\n        // Your code here\n        return false;\n    }\n};"
            },
            "functionName": "isValid",
            "examples": [
              {
                "input": "s = \"()\"",
                "output": "true",
                "explanation": "The string contains valid parentheses."
              },
              {
                "input": "s = \"()[]{}\"",
                "output": "true",
                "explanation": "All brackets are properly closed."
              },
              {
                "input": "s = \"(]\"",
                "output": "false",
                "explanation": "Opening bracket '(' is closed by wrong type ']'."
              },
              {
                "input": "s = \"([)]\"",
                "output": "false",
                "explanation": "Brackets are not closed in correct order."
              }
            ],
            "constraints": "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
            "expectedComplexity": "Time: O(n), Space: O(n)",
            "sampleTests": [
              {
                "input": "(\"()\")",
                "expectedOutput": "true",
                "description": "Simple valid parentheses"
              },
              {
                "input": "(\"()[]{}\")",
                "expectedOutput": "true",
                "description": "Multiple bracket types"
              }
            ],
            "hiddenTests": [
              {
                "input": "(\"(]\")",
                "expectedOutput": "false",
                "description": "Wrong bracket type"
              },
              {
                "input": "(\"([)]\")",
                "expectedOutput": "false",
                "description": "Wrong order"
              },
              {
                "input": "(\"\")",
                "expectedOutput": "true",
                "description": "Empty string"
              }
            ],
            "testCases": [
              {
                "input": "(\"()\")",
                "expectedOutput": "true",
                "description": "Basic valid case"
              },
              {
                "input": "(\"()[]{}\")",
                "expectedOutput": "true",
                "description": "All bracket types"
              },
              {
                "input": "(\"(]\")",
                "expectedOutput": "false",
                "description": "Invalid bracket"
              },
              {
                "input": "(\"([)]\")",
                "expectedOutput": "false",
                "description": "Wrong nesting"
              }
            ]
          }
        ]
      },
      "createdAt": existingDoc.createdAt || new Date(),
      "updatedAt": new Date()
    };
    
    // Replace the entire document
    const result = await collection.replaceOne(
      { candidateId: candidateId }, 
      enhancedDoc
    );
    
    console.log('✅ Document updated successfully:', {
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
    
    // Verify the update
    const updatedDoc = await collection.findOne({ candidateId });
    console.log('📋 Updated document structure:');
    console.log('- Questions:', updatedDoc.codingAssessment?.questions?.length || 0);
    console.log('- Languages supported:', updatedDoc.codingAssessment?.questions?.[0]?.signatures ? Object.keys(updatedDoc.codingAssessment.questions[0].signatures) : 'None');
    console.log('- Sample tests:', updatedDoc.codingAssessment?.questions?.[0]?.sampleTests?.length || 0);
    console.log('- Hidden tests:', updatedDoc.codingAssessment?.questions?.[0]?.hiddenTests?.length || 0);
    
  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('📡 MongoDB connection closed');
    }
  }
}

// Verification function to check document structure
async function verifyEnhancedStructure(candidateId = '68f909508b0f083d6bf39efd') {
  let client;
  
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    const doc = await collection.findOne({ candidateId });
    
    if (!doc) {
      console.log('❌ Document not found');
      return false;
    }
    
    console.log('🔍 Document Structure Verification:');
    console.log('✓ Candidate ID:', doc.candidateId);
    console.log('✓ Candidate Name:', doc.candidateName);
    console.log('✓ Has codingAssessment:', !!doc.codingAssessment);
    
    if (doc.codingAssessment) {
      console.log('✓ Questions count:', doc.codingAssessment.questions?.length || 0);
      
      if (doc.codingAssessment.questions?.[0]) {
        const firstQ = doc.codingAssessment.questions[0];
        console.log('✓ First question has signatures:', !!firstQ.signatures);
        console.log('✓ Supported languages:', firstQ.signatures ? Object.keys(firstQ.signatures) : 'None');
        console.log('✓ Has sampleTests:', !!firstQ.sampleTests);
        console.log('✓ Has hiddenTests:', !!firstQ.hiddenTests);
        console.log('✓ Has testCases:', !!firstQ.testCases);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting MongoDB document enhancement...\n');
  
  // Update the document
  await updateCandidateDocument();
  
  console.log('\n🔍 Verifying enhanced structure...\n');
  
  // Verify the changes
  await verifyEnhancedStructure();
  
  console.log('\n🎉 MongoDB enhancement complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Start your backend server: npm run dev (in backend folder)');
  console.log('2. Start your frontend server: npm run dev (in frontend folder)');
  console.log('3. Test with URL: http://localhost:3000/?candidateId=68f909508b0f083d6bf39efd');
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  updateCandidateDocument,
  verifyEnhancedStructure
};