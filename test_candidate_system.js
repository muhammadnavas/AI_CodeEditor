// Quick Test Script for Candidate System
// Run this in your browser console or as a Node.js script

const API_BASE = 'http://localhost:5000/api';
const CANDIDATE_ID = '68f909508b0f083d6bf39efd';

async function testCandidateSystem() {
    console.log('🧪 Testing Candidate System...\n');
    
    try {
        // Test 1: Check if candidate exists
        console.log('1️⃣ Testing candidate lookup...');
        const candidateResponse = await fetch(`${API_BASE}/test/start-session-by-candidate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                candidateId: CANDIDATE_ID
            })
        });
        
        const candidateData = await candidateResponse.json();
        console.log('Candidate Response:', candidateData);
        
        if (candidateData.success) {
            console.log('✅ Candidate found:', candidateData.candidate.candidateName);
            console.log('📋 Questions available:', candidateData.candidate.questions?.length || 0);
            
            // Test 2: Check question structure
            if (candidateData.candidate.questions && candidateData.candidate.questions.length > 0) {
                const firstQuestion = candidateData.candidate.questions[0];
                console.log('\n2️⃣ Testing question structure...');
                console.log('Question Title:', firstQuestion.title);
                console.log('Has Sample Tests:', !!firstQuestion.sampleTests);
                console.log('Has Hidden Tests:', !!firstQuestion.hiddenTests);
                console.log('Has Function Signature:', !!firstQuestion.signature);
                
                if (firstQuestion.sampleTests && firstQuestion.sampleTests.length > 0) {
                    console.log('✅ Sample tests found:', firstQuestion.sampleTests.length);
                } else {
                    console.log('❌ No sample tests found');
                }
                
                if (firstQuestion.hiddenTests && firstQuestion.hiddenTests.length > 0) {
                    console.log('✅ Hidden tests found:', firstQuestion.hiddenTests.length);
                } else {
                    console.log('❌ No hidden tests found');
                }
            } else {
                console.log('❌ No questions found in candidate document');
            }
            
        } else {
            console.log('❌ Candidate not found:', candidateData.error);
        }
        
        // Test 3: Check database status
        console.log('\n3️⃣ Testing database status...');
        const dbResponse = await fetch(`${API_BASE}/test/debug/db-status`);
        const dbData = await dbResponse.json();
        console.log('Database Status:', dbData);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure backend is running on port 5000');
        console.log('2. Check MongoDB connection');
        console.log('3. Verify candidate document exists');
    }
}

// Browser version
if (typeof window !== 'undefined') {
    window.testCandidateSystem = testCandidateSystem;
    console.log('💡 Run testCandidateSystem() to test the system');
} else {
    // Node.js version
    const fetch = require('node-fetch');
    testCandidateSystem();
}

// Frontend URL test
const FRONTEND_URL = `http://localhost:3000/?candidateId=${CANDIDATE_ID}`;
console.log('\n🌐 Frontend Test URL:');
console.log(FRONTEND_URL);
console.log('\nOpen this URL to test the complete flow!');

// Sample API calls for manual testing
console.log('\n📡 Manual API Test Commands:');
console.log(`
// 1. Test candidate lookup
curl -X POST ${API_BASE}/test/start-session-by-candidate \\
  -H "Content-Type: application/json" \\
  -d '{"candidateId": "${CANDIDATE_ID}"}'

// 2. Get all candidates  
curl ${API_BASE}/test/candidates

// 3. Check database status
curl ${API_BASE}/test/debug/db-status
`);