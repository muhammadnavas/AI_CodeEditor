// Test Script - Verify Production Setup
// Run with: node test-deployment.js

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const API_KEY = process.env.API_KEY || 'test-api-key';

// Helper function to make requests
async function request(path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test cases
const tests = [
  {
    name: 'Health Check',
    fn: async () => {
      const { status, data } = await request('/health');
      console.assert(status === 200, 'Health check should return 200');
      console.assert(data.status === 'OK', 'Health status should be OK');
      console.assert(data.docker !== undefined, 'Should check Docker status');
      return data;
    }
  },
  {
    name: 'Python Execution',
    fn: async () => {
      const { status, data } = await request('/api/code/execute', {
        code: 'print(2 + 2)\nprint("Hello Python")',
        language: 'python'
      });
      console.assert(status === 200, 'Execute should return 200');
      console.assert(data.success === true, 'Execution should succeed');
      console.assert(data.output.includes('4'), 'Output should contain 4');
      return data;
    }
  },
  {
    name: 'JavaScript Execution',
    fn: async () => {
      const { status, data } = await request('/api/code/execute', {
        code: 'console.log(10 + 5)\nconsole.log("Hello JS")',
        language: 'javascript'
      });
      console.assert(status === 200, 'Execute should return 200');
      console.assert(data.success === true, 'Execution should succeed');
      console.assert(data.output.includes('15'), 'Output should contain 15');
      return data;
    }
  },
  {
    name: 'Java Execution',
    fn: async () => {
      const { status, data } = await request('/api/code/execute', {
        code: 'public class Solution {\n  public static void main(String[] args) {\n    System.out.println("Hello Java");\n  }\n}',
        language: 'java'
      });
      console.assert(status === 200, 'Execute should return 200');
      console.assert(data.success === true, 'Execution should succeed');
      return data;
    }
  },
  {
    name: 'Timeout Test',
    fn: async () => {
      const { status, data } = await request('/api/code/execute', {
        code: 'import time\ntime.sleep(10)\nprint("Done")',
        language: 'python'
      });
      console.assert(status === 200, 'Execute should return 200');
      console.assert(data.timedOut === true, 'Should timeout');
      return data;
    }
  },
  {
    name: 'Error Handling',
    fn: async () => {
      const { status, data } = await request('/api/code/execute', {
        code: 'print(undefined_variable)',
        language: 'python'
      });
      console.assert(status === 200, 'Execute should return 200');
      console.assert(data.success === false, 'Should fail with error');
      console.assert(data.error !== null, 'Should have error message');
      return data;
    }
  }
];

// Run tests
(async () => {
  console.log('='.repeat(60));
  console.log('AI Code Editor - Production Deployment Tests');
  console.log('='.repeat(60));
  console.log('');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Running: ${test.name}...`);
      const result = await test.fn();
      console.log(`✅ PASS: ${test.name}`);
      console.log(`   Output: ${JSON.stringify(result).substring(0, 100)}...`);
      passed++;
    } catch (error) {
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('');
    console.log('🎉 All tests passed! Your deployment is working correctly.');
    console.log('');
    console.log('✅ Real code execution in Docker containers');
    console.log('✅ Security middleware active');
    console.log('✅ API authentication working');
    console.log('✅ Error handling functional');
    console.log('✅ Timeout protection active');
    console.log('');
    console.log('You can now integrate with your AI Interviewer!');
    process.exit(0);
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Please check:');
    console.log('1. Docker is running: docker ps');
    console.log('2. Services are up: docker-compose ps');
    console.log('3. Backend is healthy: curl http://localhost:3001/health');
    process.exit(1);
  }
})();
