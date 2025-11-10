/**
 * Secure Code Execution Service
 * 
 * Executes code in isolated Docker containers with resource limits
 * Supports: JavaScript, Python, Java, C++, TypeScript
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Docker images for each language
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
      // Validate language
      if (!DOCKER_IMAGES[language]) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Create temporary file
      const filename = `code_${executionId}.${FILE_EXTENSIONS[language]}`;
      const filepath = path.join(this.tempDir, filename);
      
      // Handle Java class name extraction
      let codeToWrite = code;
      if (language === 'java') {
        // Extract class name from code or use default
        const classMatch = code.match(/public\s+class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : 'Solution';
        
        // Ensure filename matches class name
        const javaFilename = `${className}.java`;
        const javaFilepath = path.join(this.tempDir, javaFilename);
        
        await fs.writeFile(javaFilepath, code, 'utf8');
        
        return await this.runInDocker(
          language,
          javaFilename,
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
        filename,
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
        message: 'Docker is not available. Please install Docker to enable code execution.',
        error: error.message
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
        return `
${userCode}

// Test execution
try {
  const result = ${functionName}${input};
  console.log(JSON.stringify(result));
} catch (error) {
  console.error('Error:', error.message);
}
`;

      case 'python':
        return `
import json
import sys

${userCode}

# Test execution
try:
    solution = Solution()
    result = solution.${functionName}${input}
    print(json.dumps(result))
except Exception as error:
    print(f"Error: {error}", file=sys.stderr)
`;

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
