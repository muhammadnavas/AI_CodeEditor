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
