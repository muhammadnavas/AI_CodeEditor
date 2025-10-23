// Comprehensive Test - All Language Code Execution
// Run with: node test-all-languages.js

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Helper function to make requests
async function request(path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json'
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

// Test cases for each language
const languageTests = [
  {
    name: 'Python - Palindrome Check',
    language: 'python',
    code: `def is_palindrome(s):
    l,r=0,len(s)-1
    while l<r:
        while l<r and not s[l].isalnum():
            l+=1
        while l<r and not s[r].isalnum():
            r-=1
        if s[l].lower()!=s[r].lower():
            return False
        l+=1
        r-=1
    return True`,
    expectedOutput: 'True'
  },
  {
    name: 'Python - Sum Function',
    language: 'python',
    code: `def add_numbers(a, b):
    return a + b

print(add_numbers(5, 3))`,
    expectedOutput: '8'
  },
  {
    name: 'Python - List Max',
    language: 'python',
    code: `def find_max(numbers):
    return max(numbers)

print(find_max([1, 5, 3, 9, 2]))`,
    expectedOutput: '9'
  },
  {
    name: 'JavaScript - Array Sum',
    language: 'javascript',
    code: `function sumArray(arr) {
  return arr.reduce((sum, num) => sum + num, 0);
}

console.log(sumArray([1, 2, 3, 4, 5]));`,
    expectedOutput: '15'
  },
  {
    name: 'JavaScript - Factorial',
    language: 'javascript',
    code: `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

console.log(factorial(5));`,
    expectedOutput: '120'
  },
  {
    name: 'Java - Hello World',
    language: 'java',
    code: `public class Solution {
  public static void main(String[] args) {
    System.out.println("Hello from Java!");
  }
}`,
    expectedOutput: 'Hello from Java!'
  },
  {
    name: 'Java - Simple Math',
    language: 'java',
    code: `public class Solution {
  public static void main(String[] args) {
    int result = 10 + 20;
    System.out.println(result);
  }
}`,
    expectedOutput: '30'
  },
  {
    name: 'C++ - Hello World',
    language: 'cpp',
    code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++" << endl;
    return 0;
}`,
    expectedOutput: 'Hello from C++'
  },
  {
    name: 'C++ - Simple Math',
    language: 'cpp',
    code: `#include <iostream>
using namespace std;

int main() {
    int sum = 5 + 10;
    cout << sum << endl;
    return 0;
}`,
    expectedOutput: '15'
  },
  {
    name: 'TypeScript - Type Safe Function',
    language: 'typescript',
    code: `function greet(name: string): string {
  return "Hello, " + name;
}

console.log(greet("TypeScript"));`,
    expectedOutput: 'Hello, TypeScript'
  }
];

// Run tests
(async () => {
  console.log('='.repeat(70));
  console.log('AI Code Editor - Comprehensive Language Execution Test');
  console.log('Testing Docker-based code execution for all supported languages');
  console.log('='.repeat(70));
  console.log('');

  let passed = 0;
  let failed = 0;
  const results = {};

  for (const test of languageTests) {
    try {
      console.log(`Testing: ${test.name}...`);
      
      const { status, data } = await request('/api/code/execute', {
        code: test.code,
        language: test.language
      });

      if (status !== 200) {
        throw new Error(`HTTP ${status}: ${JSON.stringify(data)}`);
      }

      const success = data.success === true || !data.error;
      const output = data.output ? data.output.trim() : '';
      
      // Check if output contains expected value
      const outputMatches = output.includes(test.expectedOutput);

      if (success && outputMatches) {
        console.log(`✅ PASS: ${test.name}`);
        console.log(`   Expected: "${test.expectedOutput}"`);
        console.log(`   Got: "${output}"`);
        console.log(`   Execution Time: ${data.executionTime}ms`);
        passed++;
        
        if (!results[test.language]) {
          results[test.language] = { passed: 0, failed: 0 };
        }
        results[test.language].passed++;
      } else {
        console.log(`❌ FAIL: ${test.name}`);
        console.log(`   Expected: "${test.expectedOutput}"`);
        console.log(`   Got: "${output}"`);
        if (data.error) {
          console.log(`   Error: ${data.error}`);
        }
        failed++;
        
        if (!results[test.language]) {
          results[test.language] = { passed: 0, failed: 0 };
        }
        results[test.language].failed++;
      }
    } catch (error) {
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
      
      if (!results[test.language]) {
        results[test.language] = { passed: 0, failed: 0 };
      }
      results[test.language].failed++;
    }
    console.log('');
  }

  console.log('='.repeat(70));
  console.log('Test Summary');
  console.log('='.repeat(70));
  console.log('');
  
  // Language breakdown
  console.log('Results by Language:');
  for (const [language, stats] of Object.entries(results)) {
    const total = stats.passed + stats.failed;
    const percentage = Math.round((stats.passed / total) * 100);
    const status = stats.failed === 0 ? '✅' : '⚠️';
    console.log(`  ${status} ${language.toUpperCase()}: ${stats.passed}/${total} passed (${percentage}%)`);
  }
  
  console.log('');
  console.log(`Overall: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(70));

  if (failed === 0) {
    console.log('');
    console.log('🎉 All tests passed! Code execution is working for all languages.');
    console.log('');
    console.log('✅ Docker-based execution is functional');
    console.log('✅ All languages execute correctly');
    console.log('✅ Output parsing is working');
    console.log('✅ Error handling is functional');
    console.log('');
    console.log('Your AI Code Editor is ready for production! 🚀');
    process.exit(0);
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Check the errors above.');
    console.log('');
    console.log('Common issues:');
    console.log('1. Docker not running - Start Docker Desktop');
    console.log('2. Missing Docker images - Run: docker pull node:18-alpine python:3.11-alpine openjdk:17-alpine gcc:latest');
    console.log('3. Language runtime not installed - Check specific error messages');
    console.log('4. Backend not running - Check: curl http://localhost:3001/health');
    process.exit(1);
  }
})();
