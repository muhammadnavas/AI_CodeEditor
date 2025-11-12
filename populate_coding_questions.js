/**
 * Database Population Script for Coding Interview Questions
 * This script populates the MongoDB database with LeetCode/HackerEarth style coding questions
 * in the format expected by the AI CodeEditor system.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

// MongoDB connection configuration
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'test';
const COLLECTION_NAME = process.env.MONGO_CONFIGS_COLLECTION || 'shortlistedcandidates';

if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is required');
  process.exit(1);
}

// Sample coding questions in LeetCode/HackerEarth format
const codingQuestions = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    timeLimit: 1800, // 30 minutes
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]

Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.`,
    
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
      },
      {
        input: "[[0,4,3,0], 0]",
        expectedOutput: "[0,3]",
        explanation: "Zero target"
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
3. Every close bracket has a corresponding open bracket of the same type.

Example 1:
Input: s = "()"
Output: true

Example 2:
Input: s = "()[]{}"
Output: true

Example 3:
Input: s = "(]"
Output: false

Constraints:
- 1 <= s.length <= 10^4
- s consists of parentheses only '()[]{}'.`,
    
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
      },
      {
        input: '["()[]{}"]', 
        expectedOutput: "true",
        explanation: "All bracket types"
      }
    ],
    
    tags: ["string", "stack", "easy"],
    companies: ["Google", "Microsoft", "Amazon"],
    category: "Stack"
  },

  {
    id: "longest-substring-without-repeating",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium", 
    timeLimit: 2700, // 45 minutes
    description: `Given a string s, find the length of the longest substring without repeating characters.

Example 1:
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.

Example 2:
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.

Example 3:
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3.
Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.

Constraints:
- 0 <= s.length <= 5 * 10^4
- s consists of English letters, digits, symbols and spaces.`,
    
    signatures: {
      javascript: "function lengthOfLongestSubstring(s) {\n    // Your code here\n    return 0;\n}",
      python: "def length_of_longest_substring(s):\n    # Your code here\n    return 0",
      java: "public class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Your code here\n        return 0;\n    }\n}",
      cpp: "#include <string>\n#include <unordered_set>\nusing namespace std;\n\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Your code here\n        return 0;\n    }\n};",
      typescript: "function lengthOfLongestSubstring(s: string): number {\n    // Your code here\n    return 0;\n}"
    },
    
    sampleTests: [
      {
        input: '["abcabcbb"]',
        expectedOutput: "3",
        explanation: "abc is longest"
      },
      {
        input: '["bbbbb"]',
        expectedOutput: "1", 
        explanation: "All same character"
      },
      {
        input: '["pwwkew"]',
        expectedOutput: "3",
        explanation: "wke is longest"
      }
    ],
    
    hiddenTests: [
      {
        input: '[""]',
        expectedOutput: "0",
        explanation: "Empty string"
      },
      {
        input: '["dvdf"]',
        expectedOutput: "3",
        explanation: "vdf is longest"
      }
    ],
    
    tags: ["string", "sliding-window", "hash-table", "medium"],
    companies: ["Amazon", "Microsoft", "Google", "Facebook"],
    category: "Sliding Window"
  },

  {
    id: "binary-tree-inorder",
    title: "Binary Tree Inorder Traversal",
    difficulty: "easy",
    timeLimit: 1800, // 30 minutes
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

Constraints:
- The number of nodes in the tree is in the range [0, 100].
- -100 <= Node.val <= 100

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
      },
      {
        input: "[[1]]",
        expectedOutput: "[1]",
        explanation: "Single node"
      }
    ],
    
    hiddenTests: [
      {
        input: "[[1,2,3,4,5]]",
        expectedOutput: "[4,2,5,1,3]",
        explanation: "Complete binary tree"
      }
    ],
    
    tags: ["tree", "depth-first-search", "binary-tree", "easy"],
    companies: ["Microsoft", "Amazon", "Google"],
    category: "Binary Tree"
  },

  {
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "medium",
    timeLimit: 2400, // 40 minutes  
    description: `Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

Example 1:
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Explanation: Since intervals [1,3] and [2,6] overlap, merge them into [1,6].

Example 2:
Input: intervals = [[1,4],[4,5]]
Output: [[1,5]]
Explanation: Intervals [1,4] and [4,5] are considered overlapping.

Constraints:
- 1 <= intervals.length <= 10^4
- intervals[i].length == 2
- 0 <= starti <= endi <= 10^4`,
    
    signatures: {
      javascript: "function merge(intervals) {\n    // Your code here\n    return [];\n}",
      python: "def merge(intervals):\n    # Your code here\n    return []",
      java: "import java.util.*;\n\npublic class Solution {\n    public int[][] merge(int[][] intervals) {\n        // Your code here\n        return new int[0][];\n    }\n}",
      cpp: "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Your code here\n        return {};\n    }\n};",
      typescript: "function merge(intervals: number[][]): number[][] {\n    // Your code here\n    return [];\n}"
    },
    
    sampleTests: [
      {
        input: "[[[1,3],[2,6],[8,10],[15,18]]]",
        expectedOutput: "[[1,6],[8,10],[15,18]]",
        explanation: "Merge overlapping intervals"
      },
      {
        input: "[[[1,4],[4,5]]]", 
        expectedOutput: "[[1,5]]",
        explanation: "Adjacent intervals merge"
      }
    ],
    
    hiddenTests: [
      {
        input: "[[[1,4],[2,3]]]",
        expectedOutput: "[[1,4]]",
        explanation: "Contained interval"
      },
      {
        input: "[[[1,4],[0,4]]]",
        expectedOutput: "[[0,4]]", 
        explanation: "Overlapping at start"
      }
    ],
    
    tags: ["array", "sorting", "medium"],
    companies: ["Facebook", "Google", "Microsoft", "LinkedIn"],
    category: "Intervals"
  }
];

/**
 * Creates a candidate document with coding assessment in the expected format
 */
function createCandidateDocument(candidateName, candidateEmail, phoneNumber, companyName, role, questions) {
  const { ObjectId } = require('mongodb');
  
  return {
    candidateId: new ObjectId(),
    applicationId: new ObjectId(),
    jobId: new ObjectId(),
    candidateName,
    candidateEmail,
    phoneNumber,
    companyName: companyName,
    role: role,
    recruiterId: new ObjectId(),
    interviewStatus: "scheduled",
    callAttempts: 0,
    call_tracking: {
      call_history: [],
      created_at: new Date().toISOString(),
      interview_details: {
        scheduled_slot: "Monday at 2 PM",
        scheduled_at: new Date().toISOString(),
        call_sid: "CA" + Math.random().toString(36).substr(2, 9),
        email_sent: true,
        confirmation_sent_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString(),
      status: "interview_scheduled"
    },
    techStack: ["JavaScript", "Python", "Java", "C++"],
    experience: "2-5",
    shortlistedAt: new Date(),
    __v: 0,
    aiInterviewSessionId: "CA" + Math.random().toString(36).substr(2, 9),
    notes: "Coding interview scheduled. Technical assessment prepared.",
    lastCallSid: "CA" + Math.random().toString(36).substr(2, 9),
    scheduledInterviewDate: new Date(),
    updatedAt: new Date().toISOString(),
    
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
    
    totalQuestions: questions.length,
    
    // Additional metadata
    __v: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Main function to populate the database
 */
async function populateDatabase() {
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
    
    // Create sample candidates with different question sets
    const candidates = [
      {
        name: "Rajesh Kumar",
        email: "rajesh.kumar@techmail.com", 
        phone: "9876543210",
        company: "LinkUp",
        role: "Frontend Developer",
        questions: [codingQuestions[0], codingQuestions[1]] // Easy questions
      },
      {
        name: "Priya Sharma", 
        email: "priya.sharma@devmail.com",
        phone: "8765432109", 
        company: "TechFlow Solutions",
        role: "Full Stack Developer", 
        questions: [codingQuestions[0], codingQuestions[2], codingQuestions[3]] // Mixed difficulty
      },
      {
        name: "Amit Patel",
        email: "amit.patel@codeworks.in",
        phone: "7654321098",
        company: "InnovateAI",
        role: "Senior Software Engineer", 
        questions: codingQuestions // All questions
      },
      {
        name: "Sneha Reddy",
        email: "sneha.reddy@webdev.co", 
        phone: "6543210987",
        company: "DataVision Corp",
        role: "Backend Developer",
        questions: [codingQuestions[1], codingQuestions[4]] // Stack and intervals
      },
      {
        name: "Arjun Singh",
        email: "arjun.singh@techstack.io", 
        phone: "5432109876",
        company: "CloudTech Systems",
        role: "AI Engineer",
        questions: [codingQuestions[2], codingQuestions[3], codingQuestions[4]] // Medium-Hard questions
      }
    ];
    
    console.log('🚀 Creating candidate documents...');
    
    for (const candidate of candidates) {
      const doc = createCandidateDocument(
        candidate.name,
        candidate.email, 
        candidate.phone,
        candidate.company,
        candidate.role,
        candidate.questions
      );
      
      // Check if candidate already exists
      const existing = await collection.findOne({ 
        candidateEmail: candidate.email 
      });
      
      if (existing) {
        console.log(`⚠️  Candidate ${candidate.name} already exists, skipping...`);
        continue;
      }
      
      // Insert new candidate
      const result = await collection.insertOne(doc);
      console.log(`✅ Created candidate: ${candidate.name} (ID: ${result.insertedId})`);
      console.log(`   📧 Email: ${candidate.email}`);
      console.log(`   🏢 Company: ${candidate.company} - ${candidate.role}`);
      console.log(`   📝 Questions: ${candidate.questions.length}`);
      console.log('');
    }
    
    // Display summary
    const totalDocs = await collection.countDocuments();
    console.log('📊 Database Summary:');
    console.log(`   Total candidates: ${totalDocs}`);
    console.log(`   Available questions: ${codingQuestions.length}`);
    console.log(`   Supported languages: JavaScript, Python, Java, C++, TypeScript`);
    
    console.log('');
    console.log('🎉 Database population completed successfully!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Start your backend server: npm start');
    console.log('   2. Test the API endpoints:');
    console.log('      - GET /api/test/candidates (list all candidates)');
    console.log('      - GET /api/test/candidate/:id (get specific candidate)');
    console.log('      - POST /api/test/test-code (run code tests)');
    
  } catch (error) {
    console.error('❌ Error populating database:', error.message);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('🔐 Database connection closed');
    }
  }
}

// Add additional utility functions
async function clearDatabase() {
  let client;
  try {
    console.log('🧹 Clearing existing data...');
    client = new MongoClient(MONGO_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    const result = await collection.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} existing documents`);
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--clear')) {
    clearDatabase()
      .then(() => populateDatabase())
      .catch(console.error);
  } else if (args.includes('--clear-only')) {
    clearDatabase().catch(console.error);
  } else {
    populateDatabase().catch(console.error);
  }
}

module.exports = {
  populateDatabase,
  clearDatabase,
  codingQuestions,
  createCandidateDocument
};