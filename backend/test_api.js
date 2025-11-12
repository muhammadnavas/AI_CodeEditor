/**
 * Test API endpoint locally
 */

const https = require('http');

const candidateId = '68f909508b0f083d6bf39efd';
const url = `http://localhost:3001/api/test/candidate/${candidateId}`;

console.log('Testing API endpoint:', url);

const req = https.get(url, (res) => {
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
      console.log('Candidate Name:', jsonData.candidateName);
      console.log('Email:', jsonData.candidateEmail);
      console.log('Total Questions:', jsonData.totalQuestions);
      console.log('Has Coding Assessment:', !!jsonData.codingAssessment);
      
      if (jsonData.questions && jsonData.questions.length > 0) {
        console.log('\nQuestions:');
        jsonData.questions.forEach((q, i) => {
          console.log(`  ${i + 1}. ${q.title} (${q.difficulty})`);
        });
      }
    } catch (err) {
      console.log('\nRaw response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Error:', err.message);
});

req.setTimeout(5000, () => {
  console.error('❌ Request timeout');
  req.destroy();
});