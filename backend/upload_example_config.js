const fs = require('fs');
const path = require('path');
const http = require('http');

const filePath = path.join(__dirname, '../frontend/test-configs/example_test.json');
if (!fs.existsSync(filePath)) {
  console.error('Example config not found at', filePath);
  process.exit(1);
}
const payload = fs.readFileSync(filePath, 'utf8');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/test/upload-config',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('BODY:', body);
  });
});

req.on('error', (e) => {
  console.error('problem with request:', e.message);
});

req.write(payload);
req.end();
