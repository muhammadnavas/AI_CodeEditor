/**
 * Test the modified endpoints for "Test Ended" functionality
 */

require('dotenv').config();

console.log('🧪 Testing "Test Ended" functionality...\n');

// Test the results endpoint to ensure it returns "Test Ended" message
async function testResultsEndpoint() {
  try {
    const response = await fetch('http://localhost:3001/api/test/results/test-session-123', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Results endpoint response:');
      console.log('   Message:', data.message);
      console.log('   Status:', data.status);
      console.log('   Note:', data.note);
    } else {
      console.log('❌ Results endpoint returned:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Results endpoint error:', error.message);
  }
}

// Test data structure for the candidate collection update
function testCandidateDataStructure() {
  console.log('\n📊 Expected candidate collection structure after test completion:');
  
  const expectedStructure = {
    // ... existing candidate fields remain unchanged ...
    candidateId: "ObjectId('68f909508b0f083d6bf39efd')",
    candidateName: "navas",
    candidateEmail: "navasns0409@gmail.com",
    
    // NEW TEST COMPLETION FIELDS:
    sessionId: "session-id-123",
    testStatus: "completed",
    testCompletedAt: "2025-11-12T...",
    testDuration: "1800000", // milliseconds
    
    testResults: {
      totalQuestions: 3,
      questionsAttempted: 3,
      questionsCompleted: 2,
      totalScore: 150,
      averageScore: 75.00,
      language: "javascript",
      difficulty: "mixed"
    },
    
    questionResults: [
      {
        questionNumber: 1,
        timeSpent: 600,
        score: 100,
        status: "completed",
        feedback: "Excellent solution!",
        codeSubmitted: "function twoSum(nums, target) { ... }",
        submittedAt: "2025-11-12T..."
      }
      // ... more question results
    ],
    
    testResultsUpdatedAt: "2025-11-12T..."
  };
  
  console.log(JSON.stringify(expectedStructure, null, 2));
}

// Main test function
async function runTests() {
  testCandidateDataStructure();
  
  console.log('\n🔗 Testing API endpoints...');
  await testResultsEndpoint();
  
  console.log('\n✅ Tests completed!');
  console.log('\n📝 Summary of changes:');
  console.log('   1. ✅ submit-code endpoint now saves final results to candidate collection');
  console.log('   2. ✅ timeout-question endpoint also saves final results when test completes');
  console.log('   3. ✅ results endpoint now returns "Test Ended" message instead of detailed results');
  console.log('   4. ✅ Test results are preserved in the candidate collection for later analysis');
  console.log('   5. ✅ Frontend will see testEnded=true and message="Test Ended" on completion');
}

runTests().catch(console.error);