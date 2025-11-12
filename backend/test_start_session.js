/**
 * Test start-session-by-candidate endpoint
 */

const https = require('http');

const candidateId = '68f909508b0f083d6bf39efd';
const url = `http://localhost:3001/api/test/start-session-by-candidate/${candidateId}`;

console.log('Testing start-session endpoint:', url);

const postData = JSON.stringify({
  language: 'javascript',
  questionNumber: 1
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: `/api/test/start-session-by-candidate/${candidateId}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('\n✅ Success! Response:');
      console.log('Session ID:', jsonData.sessionId);
      console.log('Candidate:', jsonData.candidateName);
      console.log('Current Question:', jsonData.currentQuestion?.title);
      console.log('Total Questions:', jsonData.totalQuestions);
      console.log('Language:', jsonData.language);
      console.log('Time Limit:', jsonData.timeLimit);
    } catch (err) {
      console.log('\nRaw response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Error:', err.message);
});

req.setTimeout(10000, () => {
  console.error('❌ Request timeout');
  req.destroy();
});

// Send the request
req.write(postData);
req.end();