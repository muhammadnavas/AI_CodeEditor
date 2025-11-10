// Test the API endpoints to verify multi-language support
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const CANDIDATE_ID = '68f909508b0f083d6bf39efd';

async function testMultiLanguageSupport() {
  console.log('🧪 Testing Multi-Language API Support...\n');
  
  try {
    // Test 1: Check candidate lookup
    console.log('1️⃣ Testing candidate lookup...');
    const candidateResponse = await fetch(`${API_BASE}/test/start-session-by-candidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidateId: CANDIDATE_ID,
        language: 'python'  // Test with Python
      })
    });
    
    if (!candidateResponse.ok) {
      throw new Error(`API Error: ${candidateResponse.status} ${candidateResponse.statusText}`);
    }
    
    const candidateData = await candidateResponse.json();
    console.log('✅ Candidate Response Status:', candidateData.success ? 'SUCCESS' : 'FAILED');
    console.log('📋 Candidate Name:', candidateData.candidateName);
    console.log('🔢 Session ID:', candidateData.sessionId);
    console.log('❓ Question Title:', candidateData.question?.title);
    
    // Check if question has multi-language signatures
    if (candidateData.question) {
      const question = candidateData.question;
      console.log('\n📝 Question Analysis:');
      console.log('- Has signatures object:', !!question.signatures);
      console.log('- Function name:', question.functionName);
      
      if (question.signatures) {
        console.log('- Available languages:', Object.keys(question.signatures));
        
        // Show Python signature specifically
        if (question.signatures.python) {
          console.log('\n🐍 Python Signature:');
          console.log(question.signatures.python);
        }
        
        // Show JavaScript signature
        if (question.signatures.javascript) {
          console.log('\n🟨 JavaScript Signature:');
          console.log(question.signatures.javascript);
        }
      } else {
        console.log('❌ No signatures object found');
        console.log('- Single signature:', question.signature ? 'Present' : 'Missing');
        console.log('- Language:', question.language);
      }
      
      // Check test cases
      console.log('\n🧪 Test Cases:');
      console.log('- Sample tests:', question.sampleTests?.length || 0);
      console.log('- Hidden tests:', question.hiddenTests?.length || 0);
      console.log('- Examples:', question.examples?.length || 0);
      
      if (question.sampleTests?.length > 0) {
        console.log('\n📋 First Sample Test:');
        console.log('  Input:', question.sampleTests[0].input);
        console.log('  Expected:', question.sampleTests[0].expectedOutput);
        console.log('  Description:', question.sampleTests[0].description);
      }
    }
    
    // Test 2: Test with different language
    console.log('\n2️⃣ Testing with Java language...');
    const javaResponse = await fetch(`${API_BASE}/test/start-session-by-candidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidateId: CANDIDATE_ID,
        language: 'java'
      })
    });
    
    const javaData = await javaResponse.json();
    if (javaData.question?.signatures?.java) {
      console.log('✅ Java signature loaded successfully');
      console.log('☕ Java Signature Preview:');
      console.log(javaData.question.signatures.java.substring(0, 100) + '...');
    } else {
      console.log('❌ Java signature not found');
    }
    
    // Test 3: Check database status
    console.log('\n3️⃣ Testing database status...');
    const dbResponse = await fetch(`${API_BASE}/test/debug/db-status`);
    const dbData = await dbResponse.json();
    console.log('📊 Database Status:', dbData.connected ? 'CONNECTED' : 'DISCONNECTED');
    console.log('🗄️  Collections:', dbData.collections?.join(', ') || 'Unknown');
    
    console.log('\n🎉 API Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure backend is running on port 5000');
    console.log('2. Check MongoDB connection');
    console.log('3. Verify candidate document exists');
    console.log('4. Check backend logs for errors');
  }
}

// Helper function to check if backend is running
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE}/test/debug/db-status`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🚀 Multi-Language Code Editor API Test\n');
  
  // Check if backend is running
  const isBackendRunning = await checkBackendHealth();
  
  if (!isBackendRunning) {
    console.log('❌ Backend not accessible at http://localhost:5000');
    console.log('💡 Make sure to start the backend server:');
    console.log('   cd backend && npm run dev');
    return;
  }
  
  console.log('✅ Backend is running\n');
  await testMultiLanguageSupport();
}

main().catch(console.error);