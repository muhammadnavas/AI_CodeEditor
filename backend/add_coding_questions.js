/**
 * Add Coding Questions to Existing Candidate
 * This script adds coding assessment questions to existing candidate records
 * without modifying any existing fields.
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection configuration
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'test';
const COLLECTION_NAME = 'shortlistedcandidates';

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not configured');
  process.exit(1);
}

// Coding questions for AI Engineer role
const aiEngineerQuestions = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    timeLimit: 1800, // 30 minutes
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9`,
    
    signatures: {
      javascript: "function twoSum(nums, target) {\n    // Your code here\n    return [];\n}",
      python: "def two_sum(nums, target):\n    # Your code here\n    return []",
      java: "public class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[0];\n    }\n}",
      cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your code here\n        return {};\n    }\n};",
      typescript: "function twoSum(nums: number[], target: number): number[] {\n    // Your code here\n    return [];\n}"
    },
    
    sampleTests: [
      {
        input: "[[2,7,11,15], 9]",
        expectedOutput: "[0,1]",
        explanation: "Basic two sum"
      },
      {
        input: "[[3,2,4], 6]", 
        expectedOutput: "[1,2]",
        explanation: "Different indices"
      },
      {
        input: "[[3,3], 6]",
        expectedOutput: "[0,1]", 
        explanation: "Identical elements"
      }
    ],
    
    hiddenTests: [
      {
        input: "[[-1,-2,-3,-4,-5], -8]",
        expectedOutput: "[2,4]",
        explanation: "Negative numbers"
      }
    ],
    
    tags: ["array", "hash-table", "easy"],
    companies: ["Amazon", "Google", "Microsoft", "Facebook"],
    category: "Arrays & Hashing"
  },

  {
    id: "valid-parentheses",
    title: "Valid Parentheses", 
    difficulty: "easy",
    timeLimit: 1200, // 20 minutes
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

Example 1:
Input: s = "()"
Output: true

Example 2:
Input: s = "()[]{}"
Output: true

Example 3:
Input: s = "(]"
Output: false`,
    
    signatures: {
      javascript: "function isValid(s) {\n    // Your code here\n    return false;\n}",
      python: "def is_valid(s):\n    # Your code here\n    return False",
      java: "public class Solution {\n    public boolean isValid(String s) {\n        // Your code here\n        return false;\n    }\n}",
      cpp: "#include <string>\n#include <stack>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // Your code here\n        return false;\n    }\n};",
      typescript: "function isValid(s: string): boolean {\n    // Your code here\n    return false;\n}"
    },
    
    sampleTests: [
      {
        input: '["()"]',
        expectedOutput: "true",
        explanation: "Simple parentheses"
      },
      {
        input: '["()[{}]"]',
        expectedOutput: "true", 
        explanation: "Mixed brackets"
      },
      {
        input: '["(]"]',
        expectedOutput: "false",
        explanation: "Mismatched brackets"
      }
    ],
    
    hiddenTests: [
      {
        input: '["(("]',
        expectedOutput: "false",
        explanation: "Unclosed brackets"
      }
    ],
    
    tags: ["string", "stack", "easy"],
    companies: ["Google", "Microsoft", "Amazon"],
    category: "Stack"
  },

  {
    id: "binary-tree-inorder",
    title: "Binary Tree Inorder Traversal",
    difficulty: "medium",
    timeLimit: 2400, // 40 minutes
    description: `Given the root of a binary tree, return the inorder traversal of its nodes' values.

Example 1:
Input: root = [1,null,2,3]
Output: [1,3,2]

Example 2:
Input: root = []
Output: []

Example 3:
Input: root = [1]
Output: [1]

Follow up: Recursive solution is trivial, could you do it iteratively?`,
    
    signatures: {
      javascript: "// Definition for a binary tree node.\nfunction TreeNode(val, left, right) {\n    this.val = (val===undefined ? 0 : val)\n    this.left = (left===undefined ? null : left)\n    this.right = (right===undefined ? null : right)\n}\n\nfunction inorderTraversal(root) {\n    // Your code here\n    return [];\n}",
      python: "# Definition for a binary tree node.\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef inorder_traversal(root):\n    # Your code here\n    return []",
      java: "import java.util.*;\n\n// Definition for a binary tree node.\nclass TreeNode {\n    int val;\n    TreeNode left;\n    TreeNode right;\n    TreeNode() {}\n    TreeNode(int val) { this.val = val; }\n    TreeNode(int val, TreeNode left, TreeNode right) {\n        this.val = val;\n        this.left = left;\n        this.right = right;\n    }\n}\n\npublic class Solution {\n    public List<Integer> inorderTraversal(TreeNode root) {\n        // Your code here\n        return new ArrayList<>();\n    }\n}",
      cpp: "#include <vector>\nusing namespace std;\n\n// Definition for a binary tree node.\nstruct TreeNode {\n    int val;\n    TreeNode *left;\n    TreeNode *right;\n    TreeNode() : val(0), left(nullptr), right(nullptr) {}\n    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n};\n\nclass Solution {\npublic:\n    vector<int> inorderTraversal(TreeNode* root) {\n        // Your code here\n        return {};\n    }\n};",
      typescript: "// Definition for a binary tree node.\nclass TreeNode {\n    val: number\n    left: TreeNode | null\n    right: TreeNode | null\n    constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {\n        this.val = (val===undefined ? 0 : val)\n        this.left = (left===undefined ? null : left)\n        this.right = (right===undefined ? null : right)\n    }\n}\n\nfunction inorderTraversal(root: TreeNode | null): number[] {\n    // Your code here\n    return [];\n}"
    },
    
    sampleTests: [
      {
        input: "[[1,null,2,3]]",
        expectedOutput: "[1,3,2]",
        explanation: "Inorder: left, root, right"
      },
      {
        input: "[[]]",
        expectedOutput: "[]",
        explanation: "Empty tree"
      }
    ],
    
    hiddenTests: [
      {
        input: "[[1,2,3,4,5]]",
        expectedOutput: "[4,2,5,1,3]",
        explanation: "Complete binary tree"
      }
    ],
    
    tags: ["tree", "depth-first-search", "binary-tree", "medium"],
    companies: ["Microsoft", "Amazon", "Google"],
    category: "Binary Tree"
  }
];

/**
 * Creates the coding assessment structure to add to existing candidate
 */
function createCodingAssessment(questions) {
  return {
    // Main coding assessment structure
    codingAssessment: {
      totalQuestions: questions.length,
      timePerQuestion: 1800, // 30 minutes default
      difficulty: "mixed",
      language: "javascript", // Default language
      
      // Questions array with multi-language support
      questions: questions.map((q, index) => ({
        questionId: q.id,
        questionNumber: index + 1,
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit,
        category: q.category,
        tags: q.tags,
        companies: q.companies,
        
        // Multi-language function signatures
        signatures: q.signatures,
        
        // Test cases
        sampleTests: q.sampleTests,
        hiddenTests: q.hiddenTests,
        
        // Metadata
        totalTests: q.sampleTests.length + q.hiddenTests.length,
        points: q.difficulty === 'easy' ? 100 : q.difficulty === 'medium' ? 200 : 300,
        
        // Status tracking
        status: "not_attempted",
        submissions: [],
        attempts: 0,
        maxAttempts: 3
      }))
    },
    
    // Legacy support - keep some fields at top level for backward compatibility  
    questions: questions.map((q, index) => ({
      id: index + 1,
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      signatures: q.signatures,
      sampleTests: q.sampleTests
    })),
    
    totalQuestions: questions.length
  };
}

/**
 * Add coding questions to existing candidate
 */
async function addCodingQuestionsToExistingCandidate() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGO_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${DB_NAME}`);
    console.log(`📁 Collection: ${COLLECTION_NAME}`);
    
    // Find the existing candidate by candidateId or email
    const candidateQuery = {
      $or: [
        { candidateId: new ObjectId("68f909508b0f083d6bf39efd") },
        { candidateEmail: "navasns0409@gmail.com" },
        { candidateName: "navas" }
      ]
    };
    
    const existingCandidate = await collection.findOne(candidateQuery);
    
    if (!existingCandidate) {
      console.error('❌ Candidate not found with the specified criteria');
      return;
    }
    
    console.log(`✅ Found candidate: ${existingCandidate.candidateName} (${existingCandidate.candidateEmail})`);
    
    // Check if coding assessment already exists
    if (existingCandidate.codingAssessment || existingCandidate.questions) {
      console.log('⚠️  Candidate already has coding questions. Updating...');
    }
    
    // Create the coding assessment structure
    const codingData = createCodingAssessment(aiEngineerQuestions);
    
    // Update the candidate document by adding coding fields
    const updateResult = await collection.updateOne(
      { _id: existingCandidate._id },
      { 
        $set: {
          ...codingData,
          // Update the updatedAt field
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    if (updateResult.modifiedCount > 0) {
      console.log('🎉 Successfully added coding questions to candidate!');
      console.log(`   📝 Added ${aiEngineerQuestions.length} coding questions`);
      console.log(`   🏷️  Question categories: ${[...new Set(aiEngineerQuestions.map(q => q.category))].join(', ')}`);
      console.log(`   💻 Supported languages: JavaScript, Python, Java, C++, TypeScript`);
      console.log('');
      
      // Display the questions added
      console.log('📋 Questions added:');
      aiEngineerQuestions.forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.title} (${q.difficulty}) - ${q.timeLimit/60} minutes`);
      });
      
    } else {
      console.log('⚠️  No changes made to the document');
    }
    
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Candidate can now access coding questions via the system');
    console.log(`   2. Test API: GET /api/test/candidate/${existingCandidate.candidateId}`);
    console.log('   3. Start coding interview session');
    
  } catch (error) {
    console.error('❌ Error adding coding questions:', error.message);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('🔐 Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  addCodingQuestionsToExistingCandidate().catch(console.error);
}

module.exports = {
  addCodingQuestionsToExistingCandidate,
  aiEngineerQuestions,
  createCodingAssessment
};