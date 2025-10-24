const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : ''
);

class ApiService {
  async request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Chat API
  async sendMessage(message, context = [], codeContext) {
    return this.request('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        message,
        context: context.map(msg => ({ role: msg.role, content: msg.content })),
        codeContext,
      }),
    });
  }

  async generateQuestion(difficulty, topic, language) {
    return this.request('/api/chat/generate-question', {
      method: 'POST',
      body: JSON.stringify({ difficulty, topic, language }),
    });
  }

  // Code API
  async analyzeCode(code, language) {
    return this.request('/api/code/analyze', {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
  }

  async completeCode(code, language, context) {
    return this.request('/api/code/complete', {
      method: 'POST',
      body: JSON.stringify({ code, language, context }),
    });
  }

  async fixCode(code, language, issue) {
    return this.request('/api/code/fix', {
      method: 'POST',
      body: JSON.stringify({ code, language, issue }),
    });
  }

  async executeCode(code, language) {
    return this.request('/api/code/execute', {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
  }

  // Test API
  async startTestSession(candidateName, difficulty = 'easy', language = 'javascript') {
    return this.request('/api/test/start-session', {
      method: 'POST',
      body: JSON.stringify({ candidateName, difficulty, language }),
    });
  }

  async generateQuestion(difficulty, language, questionIndex) {
    return this.request('/api/test/generate-question', {
      method: 'POST',
      body: JSON.stringify({ difficulty, language, questionIndex }),
    });
  }

  async testCode(sessionId, code, questionNumber) {
    return this.request('/api/test/test-code', {
      method: 'POST',
      body: JSON.stringify({ sessionId, code, questionNumber }),
    });
  }

  async submitCode(sessionId, code, questionNumber, timeSpent) {
    return this.request('/api/test/submit-code', {
      method: 'POST',
      body: JSON.stringify({ sessionId, code, questionNumber, timeSpent }),
    });
  }

  async timeoutQuestion(sessionId, questionNumber) {
    return this.request('/api/test/timeout-question', {
      method: 'POST',
      body: JSON.stringify({ sessionId, questionNumber }),
    });
  }

  async getTestResults(sessionId) {
    return this.request(`/api/test/results/${sessionId}`);
  }
}

export const apiService = new ApiService();