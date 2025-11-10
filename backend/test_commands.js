// Simple API test using curl commands
// This script generates curl commands to test the multi-language API

console.log('🧪 Multi-Language API Test Commands\n');

const API_BASE = 'http://localhost:5000/api';
const CANDIDATE_ID = '68f909508b0f083d6bf39efd';

console.log('1️⃣ Test candidate lookup with Python:');
console.log(`curl -X POST ${API_BASE}/test/start-session-by-candidate \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '{"candidateId": "${CANDIDATE_ID}", "language": "python"}'`);
console.log('');

console.log('2️⃣ Test candidate lookup with Java:');
console.log(`curl -X POST ${API_BASE}/test/start-session-by-candidate \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '{"candidateId": "${CANDIDATE_ID}", "language": "java"}'`);
console.log('');

console.log('3️⃣ Check database status:');
console.log(`curl ${API_BASE}/test/debug/db-status`);
console.log('');

console.log('4️⃣ List all candidates:');
console.log(`curl ${API_BASE}/test/candidates`);
console.log('');

console.log('💡 Frontend test URL:');
console.log(`http://localhost:3000/?candidateId=${CANDIDATE_ID}`);
console.log('');

console.log('🔧 If the frontend shows the basic template instead of proper signatures:');
console.log('1. Check browser console for errors');
console.log('2. Verify the API response includes signatures object');
console.log('3. Make sure the frontend is properly handling language switching');
console.log('4. Refresh the page after restarting the backend');