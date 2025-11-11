/**
 * Cloud-based Code Execution Service
 * 
 * Executes code using cloud APIs (Judge0, local fallback)
 * Supports: JavaScript, Python, Java, C++, TypeScript
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch').default || require('node-fetch');

// Judge0 API Configuration
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_FREE_API_URL = process.env.JUDGE0_FREE_API_URL || 'https://ce.judge0.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

// Judge0 Language IDs (https://github.com/judge0/judge0/blob/master/DOCS.md)
const JUDGE0_LANGUAGE_IDS = {
  javascript: 63,   // Node.js
  python: 71,       // Python 3
  java: 62,         // Java (OpenJDK 13.0.1)
  cpp: 54,          // C++ (GCC 9.2.0)
  c: 50,            // C (GCC 9.2.0)
  typescript: 74,   // TypeScript
  php: 68,          // PHP
  ruby: 72,         // Ruby
  go: 60,           // Go
  rust: 73,         // Rust
  swift: 83,        // Swift
  kotlin: 78        // Kotlin
};

// Docker images for local fallback
const DOCKER_IMAGES = {
  javascript: 'node:18-alpine',
  python: 'python:3.11-alpine',
  java: 'openjdk:17-alpine',
  cpp: 'gcc:latest',
  typescript: 'node:18-alpine'
};

// File extensions
const FILE_EXTENSIONS = {
  javascript: 'js',
  python: 'py',
  java: 'java',
  cpp: 'cpp',
  typescript: 'ts'
};

// Execution commands
const EXECUTION_COMMANDS = {
  javascript: (filename) => `node ${filename}`,
  python: (filename) => `python ${filename}`,
  java: (filename) => {
    const className = path.basename(filename, '.java');
    return `javac ${filename} && java ${className}`;
  },
  cpp: (filename) => {
    const output = filename.replace('.cpp', '');
    return `g++ -o ${output} ${filename} && ./${output}`;
  },
  typescript: (filename) => `npx ts-node ${filename}`
};

class CodeRunner {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
    this.lastApiCall = 0; // For rate limiting
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Execute code in isolated Docker container
   * @param {string} code - Source code to execute
   * @param {string} language - Programming language
   * @param {number} timeout - Timeout in milliseconds (default: 5000)
   * @param {string} input - Optional stdin input
   * @returns {Promise<Object>} Execution result
   */
  async executeCode(code, language, timeout = 5000, input = '') {
    const startTime = Date.now();
    const executionId = crypto.randomBytes(8).toString('hex');
    
    try {
      // Priority 1: Try cloud execution (Judge0)
      if (JUDGE0_LANGUAGE_IDS[language.toLowerCase()]) {
        console.log(`[CodeRunner] Using cloud execution for ${language}`);
        try {
          const result = await this.executeInCloud(code, language, timeout, input);
          return {
            ...result,
            executionTime: Date.now() - startTime
          };
        } catch (cloudError) {
          console.warn(`[CodeRunner] Cloud execution failed, falling back to local: ${cloudError.message}`);
        }
      }

      // Priority 2: Try Docker execution (if available)
      const dockerStatus = await this.checkDocker();
      if (dockerStatus.available) {
        console.log(`[CodeRunner] Using Docker execution for ${language}`);
        return await this.executeInDockerLegacy(code, language, timeout, input, executionId, startTime);
      }

      // Priority 3: Try local execution (fallback)
      if (await this.supportsLocalExecution(language)) {
        console.log(`[CodeRunner] Using local execution for ${language}`);
        return await this.executeLocallyLegacy(code, language, timeout, input, executionId, startTime);
      }

      // No execution method available
      throw new Error(`Language ${language} is not supported. No execution method available.`);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime,
        timedOut: false
      };
    }
  }

  /**
   * Execute code using Judge0 cloud API
   */
  async executeInCloud(code, language, timeout = 5000, input = '') {
    const languageId = JUDGE0_LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) {
      throw new Error(`Language ${language} not supported in cloud execution`);
    }

    // Try paid API first (if API key available), then free API
    const apiConfigs = [];
    
    if (JUDGE0_API_KEY) {
      apiConfigs.push({
        url: JUDGE0_API_URL,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        name: 'RapidAPI'
      });
    }
    
    // Always add free API as fallback
    apiConfigs.push({
      url: JUDGE0_FREE_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      name: 'Free API'
    });

    // Prepare submission
    const submission = {
      source_code: code,
      language_id: languageId,
      stdin: input || '',
      cpu_time_limit: Math.min(Math.ceil(timeout / 1000), 10), // Max 10 seconds for free API
      memory_limit: 128000, // 128MB in KB
      wall_time_limit: Math.min(Math.ceil(timeout / 1000) + 2, 12) // Add buffer, max 12 seconds
    };

    let lastError = null;

    // Try each API configuration
    for (const config of apiConfigs) {
      try {
        console.log(`[CodeRunner] Trying Judge0 ${config.name}...`);
        
        // Rate limiting: wait at least 1 second between API calls for free API
        if (config.name === 'Free API') {
          const timeSinceLastCall = Date.now() - this.lastApiCall;
          if (timeSinceLastCall < 1000) {
            await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastCall));
          }
        }
        
        this.lastApiCall = Date.now();
        
        // Submit code for execution
        const submitResponse = await fetch(`${config.url}/submissions`, {
          method: 'POST',
          headers: config.headers,
          body: JSON.stringify(submission)
        });

        if (!submitResponse.ok) {
          const errorText = await submitResponse.text();
          throw new Error(`${config.name} submission failed: ${submitResponse.status} ${errorText}`);
        }

        const submitResult = await submitResponse.json();
        const submissionId = submitResult.token;

        if (!submissionId) {
          throw new Error(`No submission token received from ${config.name}`);
        }

        // Wait for execution to complete
        console.log(`[CodeRunner] Waiting for ${config.name} result (ID: ${submissionId})...`);
        const result = await this.waitForJudge0Result(submissionId, config.headers, config.url, timeout);

        return {
          success: result.status?.id === 3, // 3 = Accepted
          output: result.stdout || '',
          error: result.stderr || result.compile_output || (result.status?.id !== 3 ? result.status?.description : null),
          timedOut: result.status?.id === 5, // 5 = Time Limit Exceeded
          exitCode: result.exit_code,
          executionTime: result.time ? parseFloat(result.time) * 1000 : 0, // Convert to ms
          apiUsed: config.name
        };

      } catch (error) {
        console.warn(`[CodeRunner] ${config.name} failed: ${error.message}`);
        lastError = error;
        
        // If rate limited, try next API immediately
        if (error.message.includes('Too Many Requests') || error.message.includes('429')) {
          continue;
        }
        
        // For other errors, also try the next API
        continue;
      }
    }

    // If all APIs failed, throw the last error
    throw new Error(`All Judge0 APIs failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Wait for Judge0 execution result with polling
   */
  async waitForJudge0Result(submissionId, headers, apiUrl, timeout) {
    const maxAttempts = Math.ceil(timeout / 500); // Poll every 500ms
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`${apiUrl}/submissions/${submissionId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to get Judge0 result: ${response.status}`);
      }

      const result = await response.json();
      
      // Check if processing is complete
      // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4=Wrong Answer, 5=Time Limit Exceeded, etc.
      if (result.status && result.status.id > 2) {
        return result;
      }

      // Wait before next poll (shorter intervals for faster response)
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    throw new Error('Judge0 execution timeout - result not ready');
  }

  /**
   * Legacy Docker execution (renamed from original)
   */
  async executeInDockerLegacy(code, language, timeout, input, executionId, startTime) {
    try {
      // Create temporary file
      const filename = `code_${executionId}.${FILE_EXTENSIONS[language]}`;
      const filepath = path.join(this.tempDir, filename);
      
      // Handle Java class name extraction
      let codeToWrite = code;
      let actualFilename = filename;
      
      if (language === 'java') {
        // Extract class name from code or use default
        const classMatch = code.match(/public\s+class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : 'Solution';
        
        // Ensure filename matches class name
        actualFilename = `${className}.java`;
        const javaFilepath = path.join(this.tempDir, actualFilename);
        
        await fs.writeFile(javaFilepath, code, 'utf8');
        
        return await this.runInDocker(
          language,
          actualFilename,
          timeout,
          input,
          executionId,
          startTime
        );
      }

      // Write code to temporary file
      await fs.writeFile(filepath, codeToWrite, 'utf8');

      // Execute in Docker
      const result = await this.runInDocker(
        language,
        actualFilename,
        timeout,
        input,
        executionId,
        startTime
      );

      // Cleanup
      await this.cleanup(filepath);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime,
        timedOut: false
      };
    }
  }

  /**
   * Legacy local execution (renamed from original)
   */
  async executeLocallyLegacy(code, language, timeout, input, executionId, startTime) {
    try {
      // Create temporary file
      const filename = `code_${executionId}.${FILE_EXTENSIONS[language]}`;
      const filepath = path.join(this.tempDir, filename);
      
      // Handle Java class name extraction
      let codeToWrite = code;
      let actualFilename = filename;
      
      if (language === 'java') {
        // Extract class name from code or use default
        const classMatch = code.match(/public\s+class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : 'Solution';
        
        // Ensure filename matches class name
        actualFilename = `${className}.java`;
        const javaFilepath = path.join(this.tempDir, actualFilename);
        
        await fs.writeFile(javaFilepath, code, 'utf8');
        
        return await this.runLocally(
          language,
          actualFilename,
          timeout,
          input,
          executionId,
          startTime
        );
      }

      // Write code to temporary file
      await fs.writeFile(filepath, codeToWrite, 'utf8');

      // Execute locally
      const result = await this.runLocally(
        language,
        actualFilename,
        timeout,
        input,
        executionId,
        startTime
      );

      // Cleanup
      await this.cleanup(filepath);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime,
        timedOut: false
      };
    }
  }

  /**
   * Run code in Docker container with resource limits
   */
  async runInDocker(language, filename, timeout, input, executionId, startTime) {
    const image = DOCKER_IMAGES[language];
    const command = EXECUTION_COMMANDS[language](filename);
    const timeoutSeconds = Math.ceil(timeout / 1000);

    // Docker run command with resource limits
    const dockerCommand = [
      'docker', 'run',
      '--rm', // Remove container after execution
      '--network', 'none', // No network access
      '--memory', '128m', // 128MB memory limit
      '--memory-swap', '128m', // No swap
      '--cpus', '0.5', // 0.5 CPU limit
      '--pids-limit', '50', // Limit number of processes
      '--read-only', // Read-only filesystem
      '--tmpfs', '/tmp:rw,noexec,nosuid,size=10m', // Small writable tmp
      '-v', `${this.tempDir}:/code:ro`, // Mount code directory as read-only
      '-w', '/tmp', // Work in tmp directory
      '--user', 'nobody', // Run as unprivileged user
      '--security-opt', 'no-new-privileges', // Security hardening
      image,
      '/bin/sh', '-c',
      `cp /code/${filename} /tmp/ && timeout ${timeoutSeconds}s ${command}`
    ].join(' ');

    try {
      // Execute with timeout
      const { stdout, stderr } = await execAsync(dockerCommand, {
        timeout: timeout + 1000, // Add 1s buffer to Docker timeout
        maxBuffer: 1024 * 1024, // 1MB output limit
        encoding: 'utf8'
      });

      const executionTime = Date.now() - startTime;

      return {
        success: !stderr || stderr.trim().length === 0,
        output: stdout.trim(),
        error: stderr.trim() || null,
        executionTime,
        timedOut: false
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Check if it was a timeout
      const timedOut = error.killed || error.signal === 'SIGTERM' || 
                       error.message.includes('timeout');

      return {
        success: false,
        output: error.stdout ? error.stdout.trim() : '',
        error: timedOut ? 'Execution timed out' : (error.stderr || error.message),
        executionTime,
        timedOut
      };
    }
  }

  /**
   * Cleanup temporary files
   */
  async cleanup(filepath) {
    try {
      await fs.unlink(filepath);
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup warning:', error.message);
    }
  }

  /**
   * Check if Docker is available
   */
  async checkDocker() {
    try {
      await execAsync('docker --version');
      return { available: true, message: 'Docker is available' };
    } catch (error) {
      return { 
        available: false, 
        message: 'Docker is not available. Using local execution.',
        error: error.message
      };
    }
  }

  /**
   * Check if language supports local execution
   */
  async supportsLocalExecution(language) {
    const commands = {
      javascript: 'node --version',
      python: 'python --version',
      java: 'javac -version',
      cpp: 'g++ --version',
      typescript: 'node --version'
    };

    const command = commands[language.toLowerCase()];
    if (!command) return false;

    try {
      await execAsync(command, { timeout: 5000 });
      return true;
    } catch (error) {
      console.warn(`[CodeRunner] ${language} compiler not available:`, error.message);
      return false;
    }
  }

  /**
   * Get required compiler for a language
   */
  getRequiredCompiler(language) {
    const compilers = {
      javascript: 'Node.js (https://nodejs.org)',
      python: 'Python (https://python.org)',
      java: 'Java JDK (https://openjdk.org)',
      cpp: 'GCC/MinGW (https://gcc.gnu.org)',
      typescript: 'Node.js (https://nodejs.org)'
    };
    return compilers[language.toLowerCase()] || `${language} compiler`;
  }

  /**
   * Execute code locally (fallback when Docker is not available)
   */
  async runLocally(language, filename, timeout, input, executionId, startTime) {
    const filepath = path.join(this.tempDir, filename);
    
    try {
      let command;
      
      switch (language) {
        case 'javascript':
          command = `node "${filepath}"`;
          break;
        case 'python':
          command = `python "${filepath}"`;
          break;
        case 'java':
          const className = path.basename(filename, '.java');
          const classDir = path.dirname(filepath);
          command = `cd "${classDir}" && javac "${filename}" && java ${className}`;
          break;
        case 'cpp':
          const executableName = path.basename(filename, '.cpp');
          const executablePath = path.join(this.tempDir, executableName + '.exe');
          command = `g++ "${filepath}" -o "${executablePath}" && "${executablePath}"`;
          break;
        case 'typescript':
          command = `npx ts-node "${filepath}"`;
          break;
        default:
          throw new Error(`Local execution not supported for ${language}`);
      }

      console.log(`[CodeRunner] Executing locally: ${command}`);
      console.log(`[CodeRunner] Working directory: ${this.tempDir}`);
      console.log(`[CodeRunner] File path: ${filepath}`);

      // Execute with timeout
      const { stdout, stderr } = await execAsync(command, {
        timeout: timeout,
        maxBuffer: 1024 * 1024, // 1MB output limit
        encoding: 'utf8',
        cwd: this.tempDir
      });

      const executionTime = Date.now() - startTime;

      console.log(`[CodeRunner] Execution completed - stdout: ${stdout.substring(0, 200)}, stderr: ${stderr.substring(0, 200)}`);

      return {
        success: !stderr || stderr.trim().length === 0,
        output: stdout.trim(),
        error: stderr.trim() || null,
        executionTime,
        timedOut: false
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Check if it was a timeout
      const timedOut = error.killed || error.signal === 'SIGTERM' || 
                       error.message.includes('timeout');

      return {
        success: false,
        output: error.stdout ? error.stdout.trim() : '',
        error: timedOut ? 'Execution timed out' : (error.stderr || error.message),
        executionTime,
        timedOut
      };
    }
  }

  /**
   * Execute test cases against user code
   * @param {string} userCode - User's solution code
   * @param {Object} question - Question object with test cases
   * @param {string} language - Programming language
   * @returns {Promise<Object>} Test results
   */
  async executeTestCases(userCode, question, language) {
    const startTime = Date.now();
    const results = {
      sampleTests: [],
      hiddenTests: [],
      allPassed: false,
      totalTests: 0,
      passedTests: 0,
      executionTime: 0
    };

    try {
      // Get appropriate signature for language
      const signature = question.signatures && question.signatures[language] 
        ? question.signatures[language] 
        : question.signature || '';

      // Run sample tests (visible to user)
      if (question.sampleTests && Array.isArray(question.sampleTests)) {
        for (const test of question.sampleTests) {
          const testResult = await this.runSingleTest(
            userCode, 
            test, 
            question.functionName, 
            language, 
            signature
          );
          results.sampleTests.push(testResult);
          results.totalTests++;
          if (testResult.passed) results.passedTests++;
        }
      }

      // Run hidden tests (for final evaluation)
      if (question.hiddenTests && Array.isArray(question.hiddenTests)) {
        for (const test of question.hiddenTests) {
          const testResult = await this.runSingleTest(
            userCode, 
            test, 
            question.functionName, 
            language, 
            signature
          );
          results.hiddenTests.push(testResult);
          results.totalTests++;
          if (testResult.passed) results.passedTests++;
        }
      }

      results.allPassed = results.totalTests > 0 && results.passedTests === results.totalTests;
      results.executionTime = Date.now() - startTime;

      return results;
    } catch (error) {
      results.error = error.message;
      results.executionTime = Date.now() - startTime;
      return results;
    }
  }

  /**
   * Run a single test case
   * @param {string} userCode - User's solution
   * @param {Object} testCase - Single test case
   * @param {string} functionName - Function to call
   * @param {string} language - Programming language
   * @param {string} signature - Function signature
   * @returns {Promise<Object>} Test result
   */
  async runSingleTest(userCode, testCase, functionName, language, signature) {
    try {
      // Create test wrapper code based on language
      const testCode = this.createTestWrapper(
        userCode, 
        testCase, 
        functionName, 
        language, 
        signature
      );

      console.log(`[CodeRunner] Generated test code for ${language}:`);
      console.log(`[CodeRunner] Input: ${testCase.input}`);
      console.log(`[CodeRunner] Function: ${functionName}`);
      console.log(`[CodeRunner] Test code:\n${testCode}`);

      // Execute the test
      const execution = await this.executeCode(testCode, language, 10000);
      
      if (!execution.success) {
        return {
          passed: false,
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: null,
          error: execution.error,
          description: testCase.description || 'Test case'
        };
      }

      // Parse output and compare with expected
      let actual = execution.output.trim();
      let expected = String(testCase.expectedOutput).trim();

      // Try to parse JSON for complex types
      try {
        actual = JSON.parse(actual);
        expected = JSON.parse(expected);
      } catch {
        // Keep as strings if not valid JSON
      }

      const passed = this.compareOutputs(actual, expected);

      return {
        passed,
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: execution.output.trim(),
        error: null,
        description: testCase.description || 'Test case'
      };

    } catch (error) {
      return {
        passed: false,
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: null,
        error: error.message,
        description: testCase.description || 'Test case'
      };
    }
  }

  /**
   * Create test wrapper code for different languages
   */
  createTestWrapper(userCode, testCase, functionName, language, signature) {
    const input = testCase.input;
    
    switch (language.toLowerCase()) {
      case 'javascript':
        // Parse input to extract arguments properly
        let jsInput = input;
        if (input.startsWith('(') && input.endsWith(')')) {
          // For JavaScript, we can use the input directly since it's valid JS syntax
          jsInput = input;
        }
        
        // Handle both function and class-based JavaScript
        if (userCode.includes('class Solution') || signature.includes('class Solution')) {
          return `
${userCode}

// Test execution
try {
  const solution = new Solution();
  const result = solution.${functionName}${jsInput};
  console.log(JSON.stringify(result));
} catch (error) {
  console.error('Error:', error.message);
}
`;
        } else {
          return `
${userCode}

// Test execution
try {
  const result = ${functionName}${jsInput};
  console.log(JSON.stringify(result));
} catch (error) {
  console.error('Error:', error.message);
}
`;
        }

      case 'python':
        // Parse input to extract arguments properly
        let parsedInput = input;
        if (input.startsWith('(') && input.endsWith(')')) {
          // Remove outer parentheses and use the content directly
          parsedInput = input.slice(1, -1);
        }
        
        // Handle both function and class-based Python
        if (userCode.includes('class Solution') || signature.includes('class Solution')) {
          return `
import json
import sys

${userCode}

# Test execution
try:
    solution = Solution()
    result = solution.${functionName}(${parsedInput})
    print(json.dumps(result))
except Exception as error:
    print(f"Error: {error}", file=sys.stderr)
`;
        } else {
          return `
import json
import sys

${userCode}

# Test execution
try:
    result = ${functionName}(${parsedInput})
    print(json.dumps(result))
except Exception as error:
    print(f"Error: {error}", file=sys.stderr)
`;
        }

      case 'java':
        // Extract class name from user code
        const classMatch = userCode.match(/class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : 'Solution';
        
        return `
import java.util.*;

${userCode}

public class TestRunner {
    public static void main(String[] args) {
        try {
            ${className} solution = new ${className}();
            Object result = solution.${functionName}${input};
            System.out.println(result);
        } catch (Exception error) {
            System.err.println("Error: " + error.getMessage());
        }
    }
}
`;

      case 'cpp':
        return `
#include <iostream>
#include <vector>
#include <string>
using namespace std;

${userCode}

int main() {
    try {
        Solution solution;
        auto result = solution.${functionName}${input};
        cout << result << endl;
    } catch (const exception& error) {
        cerr << "Error: " << error.what() << endl;
    }
    return 0;
}
`;

      default:
        throw new Error(`Test wrapper not implemented for language: ${language}`);
    }
  }

  /**
   * Compare expected vs actual outputs
   */
  compareOutputs(actual, expected) {
    // Handle different types of comparison
    if (typeof actual === typeof expected) {
      if (Array.isArray(actual) && Array.isArray(expected)) {
        return JSON.stringify(actual.sort()) === JSON.stringify(expected.sort());
      }
      return actual === expected;
    }
    
    // Try string comparison as fallback
    return String(actual).trim() === String(expected).trim();
  }

  /**
   * Get language-specific function signature
   * @param {Object} question - Question with signatures
   * @param {string} language - Target language
   * @returns {string} Function signature
   */
  getSignatureForLanguage(question, language) {
    if (question.signatures && question.signatures[language]) {
      return question.signatures[language];
    }
    
    // Fallback to single signature or generate basic one
    if (question.signature) {
      return question.signature;
    }
    
    // Generate basic signature
    const functionName = question.functionName || 'solution';
    switch (language.toLowerCase()) {
      case 'javascript':
        return `function ${functionName}() {\n    // Your code here\n}`;
      case 'python':
        return `class Solution:\n    def ${functionName}(self):\n        # Your code here\n        pass`;
      case 'java':
        return `class Solution {\n    public Object ${functionName}() {\n        // Your code here\n        return null;\n    }\n}`;
      case 'cpp':
        return `class Solution {\npublic:\n    auto ${functionName}() {\n        // Your code here\n        return nullptr;\n    }\n};`;
      default:
        return `// ${language} signature for ${functionName}`;
    }
  }

  /**
   * Pull required Docker images
   */
  async pullImages() {
    const results = {};
    
    for (const [language, image] of Object.entries(DOCKER_IMAGES)) {
      try {
        console.log(`Pulling ${image} for ${language}...`);
        await execAsync(`docker pull ${image}`);
        results[language] = { success: true, image };
      } catch (error) {
        results[language] = { success: false, image, error: error.message };
      }
    }
    
    return results;
  }
}

// Singleton instance
const codeRunner = new CodeRunner();

module.exports = codeRunner;
