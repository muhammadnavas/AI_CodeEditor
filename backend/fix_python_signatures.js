// Fix Python signatures in the database
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'test';

async function fixPythonSignatures() {
  let client;
  
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('candidates');
    
    // Get the candidate document
    const candidate = await collection.findOne({ candidateId: "68f909508b0f083d6bf39efd" });
    
    if (!candidate) {
      console.log('❌ Candidate not found');
      return;
    }
    
    console.log('📝 Fixing Python signatures...');
    
    // Update the signatures with proper Python templates
    if (candidate.codingAssessment && candidate.codingAssessment.questions) {
      candidate.codingAssessment.questions.forEach(question => {
        if (question.signatures) {
          // Fix Two Sum Python signature
          if (question.id === 'two-sum') {
            question.signatures.python = `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Your code here
        return []`;
          }
          
          // Fix Valid Parentheses Python signature  
          if (question.id === 'valid-parentheses') {
            question.signatures.python = `class Solution:
    def isValid(self, s: str) -> bool:
        # Your code here
        return False`;
          }
        }
      });
    }
    
    // Update the document
    const result = await collection.replaceOne(
      { candidateId: "68f909508b0f083d6bf39efd" },
      candidate
    );
    
    console.log('✅ Python signatures updated:', {
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
    
    console.log('✅ Fixed issues:');
    console.log('  - Removed unnecessary *args parameter');
    console.log('  - Removed unnecessary pass statement');
    console.log('  - Added proper type hints');
    console.log('  - Added proper return statements');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('📡 Connection closed');
    }
  }
}

fixPythonSignatures().catch(console.error);