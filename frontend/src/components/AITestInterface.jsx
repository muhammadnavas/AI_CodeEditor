'use client';

import { AlertCircle, CheckCircle, Clock, Code, Timer, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { apiService } from '../lib/api';
import CodeEditor from './CodeEditor';

export default function AITestInterface() {
  const [testState, setTestState] = useState('setup'); // setup, active, completed
  const [sessionId, setSessionId] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  // testConfig will hold the JSON payload uploaded by the operator
  const [testConfig, setTestConfig] = useState(null);
  const [configIdInput, setConfigIdInput] = useState('');
  const [candidateIdInput, setCandidateIdInput] = useState('');
  // language can be changed by the candidate inside the code editor while taking the test
  const [language, setLanguage] = useState('javascript');
  const [availableLanguages, setAvailableLanguages] = useState(['javascript', 'python', 'java', 'cpp']);
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(2);
  const [code, setCode] = useState('');
  
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  
  const [analysis, setAnalysis] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [showingResult, setShowingResult] = useState(false);
  const [sampleTestResults, setSampleTestResults] = useState(null);
  const [showingSampleResults, setShowingSampleResults] = useState(false);
  
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Test results panel state
  const [isResultsPanelExpanded, setIsResultsPanelExpanded] = useState(false);
  const [allQuestionResults, setAllQuestionResults] = useState([]); // Store results from all questions
  
  const timerRef = useRef(null);
  const questionStartTimeRef = useRef(null);

  // Utility: format seconds into MM:SS
  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss.toString().padStart(2, '0')}`;
  }

  // Minimal code templates used when question signature is not provided
  function getDefaultTemplate(lang) {
    switch ((lang || 'javascript').toLowerCase()) {
      case 'python':
        return "def solution():\n    # write your code here\n    pass";
      case 'java':
        return "public class Solution {\n    public static void main(String[] args) {\n        // write your code here\n    }\n}";
      case 'cpp':
        return "#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // write your code here\n    return 0;\n}";
      case 'typescript':
        return "function solutionName(): void {\n  // your code here\n}";
      case 'javascript':
      default:
        return "function solutionName() {\n  // your code here\n}";
    }
  }

  function buildTemplateWithFunction(fnName, lang) {
    const l = (lang || 'javascript').toLowerCase();
    switch (l) {
      case 'python':
        return `def ${fnName}(*args):\n    # your code here\n    pass`;
      case 'java':
        return `public class Solution {\n    public static Object ${fnName}() {\n        // your code here\n        return null;\n    }\n}`;
      case 'cpp':
        return `// ${fnName} implementation\nvoid ${fnName}() {\n    // your code here\n}`;
      case 'typescript':
        return `function ${fnName}(): any {\n  // your code here\n}`;
      case 'javascript':
      default:
        return `function ${fnName}() {\n  // your code here\n}`;
    }
  }

  // Helper function to clean up test input display
  const cleanTestInput = (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove outer parentheses if they wrap the entire input
    const trimmed = input.trim();
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      // Check if these are the outer wrapping parentheses
      let depth = 0;
      for (let i = 1; i < trimmed.length - 1; i++) {
        if (trimmed[i] === '(') depth++;
        if (trimmed[i] === ')') depth--;
        if (depth < 0) return input; // Not outer wrapping parentheses
      }
      if (depth === 0) {
        return trimmed.slice(1, -1);
      }
    }
    return input;
  };

  // Handle language switching during active session
  const handleLanguageChange = (newLanguage, signature) => {
    console.log('Language changed to:', newLanguage);
    setLanguage(newLanguage);
    
    // Update code with signature for new language if available
    if (signature) {
      setCode(signature);
    } else if (currentQuestion && currentQuestion.signatures && currentQuestion.signatures[newLanguage]) {
      setCode(currentQuestion.signatures[newLanguage]);
    } else if (currentQuestion && currentQuestion.functionName) {
      const newTemplate = buildTemplateWithFunction(currentQuestion.functionName, newLanguage);
      setCode(newTemplate);
    } else {
      setCode(getDefaultTemplate(newLanguage));
    }
  };

  // Handler: run code against sample tests (calls backend /test-code)
  const handleRunCode = async () => {
    if (!sessionId || !currentQuestion) {
      console.debug('[AITestInterface] handleRunCode called without active session or question', { sessionId, currentQuestion });
      alert('No active test session. Please start the test first.');
      return;
    }
    setRunLoading(true);
    try {
      const resp = await apiService.testCode(sessionId, code, questionNumber);
      // Debug log the raw response to aid troubleshooting
      console.debug('[AITestInterface] testCode response:', resp);

      // Backend should return an object { output, error, sampleTests, message }
      // Normalize in case older backend returns an array of tests directly
      let normalized = resp;
      if (Array.isArray(resp)) {
        normalized = { sampleTests: resp };
      } else if (resp && resp.sampleTests && !Array.isArray(resp.sampleTests)) {
        // defensive: ensure sampleTests is an array
        normalized = { ...resp, sampleTests: Array.isArray(resp.sampleTests) ? resp.sampleTests : [resp.sampleTests] };
      }

      setSampleTestResults(normalized);
      setShowingSampleResults(true);
      // auto-expand panel so results are visible
      setIsResultsPanelExpanded(true);
    } catch (err) {
      console.error('Run code error', err);
      alert('Failed to run code: ' + (err.message || err));
    }
    setRunLoading(false);
  };

  // Handler: submit code for full analysis and move to next question
  const handleSubmitCode = async () => {
    if (!sessionId || !currentQuestion) return;
    setSubmitLoading(true);
    try {
      // calculate time spent
      const now = Date.now();
      const elapsed = questionStartTimeRef.current ? Math.floor((now - questionStartTimeRef.current) / 1000) : timeSpent;
      const resp = await apiService.submitCode(sessionId, code, questionNumber, elapsed);
      // resp: { analysis, nextQuestion, testComplete, questionNumber, totalQuestions }
      if (resp.analysis) setAnalysis(resp.analysis);
      setShowingResult(true);

      if (resp.testComplete) {
        // finish
        setTestResults(await apiService.getTestResults(sessionId));
        setTestState('completed');
      } else if (resp.nextQuestion) {
        // move to next question
        setCurrentQuestion(resp.nextQuestion);
        setQuestionNumber(resp.questionNumber || (questionNumber + 1));
        setTotalQuestions(resp.totalQuestions || totalQuestions);
        // reset timer
        setTimeLeft(resp.nextQuestion.timeLimit || 300);
        setTimeSpent(0);
        setIsTimerActive(true);
        questionStartTimeRef.current = Date.now();
        
        // Update available languages for new question - always keep all supported languages
        const supportedLanguages = ['javascript', 'python', 'java', 'cpp'];
        if (resp.nextQuestion.signatures && typeof resp.nextQuestion.signatures === 'object') {
          const questionLanguages = Object.keys(resp.nextQuestion.signatures);
          setAvailableLanguages([...new Set([...supportedLanguages, ...questionLanguages])]);
        } else {
          setAvailableLanguages(supportedLanguages);
        }
        
        // Set code template for next question with language priority
        let newTemplate = '';
        if (resp.nextQuestion.signatures && resp.nextQuestion.signatures[language]) {
          newTemplate = resp.nextQuestion.signatures[language];
        } else if (resp.nextQuestion.signature && resp.nextQuestion.language && resp.nextQuestion.language.toLowerCase() === language.toLowerCase()) {
          newTemplate = resp.nextQuestion.signature;
        } else if (resp.nextQuestion.functionName) {
          newTemplate = buildTemplateWithFunction(resp.nextQuestion.functionName, language);
        } else {
          newTemplate = getDefaultTemplate(language);
        }
        
        setCode(newTemplate);
        // clear previous result panels so candidate can continue
        setShowingResult(false);
        setShowingSampleResults(false);
        setIsResultsPanelExpanded(false);
      }
    } catch (err) {
      console.error('Submit code error', err);
      alert('Failed to submit code: ' + (err.message || err));
    }
    setSubmitLoading(false);
  };

  // Helper to initialize session state from start-session response
  const initializeSessionFromResponse = (response, lang) => {
    setSessionId(response.sessionId);
    setCandidateName(response.candidateName || testConfig?.candidateName || '');
    setCurrentQuestion(response.question);
    setQuestionNumber(response.questionNumber || 1);
    setTotalQuestions(response.totalQuestions || (response.questions && response.questions.length) || 0);
    setTestState('active');
    setTimeLeft(response.question && response.question.timeLimit ? response.question.timeLimit : 300);
    setTimeSpent(0);
    setIsTimerActive(true);
    questionStartTimeRef.current = Date.now();

    const q = response.question || {};
    const currentLang = lang || language;
    
    // Extract available languages from question signatures, but always include all supported languages
    const supportedLanguages = ['javascript', 'python', 'java', 'cpp'];
    if (q.signatures && typeof q.signatures === 'object') {
      // Use question signatures but ensure all supported languages are available
      const questionLanguages = Object.keys(q.signatures);
      setAvailableLanguages([...new Set([...supportedLanguages, ...questionLanguages])]);
    } else {
      setAvailableLanguages(supportedLanguages);
    }
    
    // Set initial code based on language and available signatures
    let initialTemplate = '';
    if (q.signatures && q.signatures[currentLang]) {
      initialTemplate = q.signatures[currentLang];
    } else if (q.signature && q.language && q.language.toLowerCase() === currentLang.toLowerCase()) {
      initialTemplate = q.signature;
    } else if (q.functionName) {
      initialTemplate = buildTemplateWithFunction(q.functionName, currentLang);
    } else {
      initialTemplate = getDefaultTemplate(currentLang);
    }
    
    setCode(initialTemplate);
    setLanguage(currentLang);
  };

  // Start a session by configId helper (reusable)
  const startByConfigId = async (configIdParam, langParam) => {
    if (!configIdParam) return;
    setLoading(true);
    try {
      const payload = { configId: configIdParam, language: langParam || language };
      const response = await apiService.startTestSession(payload);
      initializeSessionFromResponse(response, langParam || language);
    } catch (err) {
      console.error('Failed to start by configId:', err);
      alert('Failed to start test with provided configId.');
    }
    setLoading(false);
  };
  
  // Start a session by candidateId helper
  const startByCandidateId = async (candidateIdParam, langParam) => {
    if (!candidateIdParam) {
      alert('Please provide a candidate ID');
      return;
    }
    
    const trimmedCandidateId = candidateIdParam.trim();
    console.debug('[AITestInterface] Starting test for candidateId:', trimmedCandidateId);
    setLoading(true);
    
    try {
      // First check if candidate exists and has questions
      console.debug('[AITestInterface] Checking candidate availability...');
      const candidateCheck = await apiService.request(`/api/test/candidate/${trimmedCandidateId}`);
      console.debug('[AITestInterface] Candidate check result:', candidateCheck);
      
      if (!candidateCheck.found) {
        alert(`❌ Candidate Not Found\n\nCandidate ID "${trimmedCandidateId}" was not found in the system.\n\nPlease:\n• Check that you entered the ID correctly\n• Verify the ID with your test administrator\n• Make sure the candidate has been set up in the system`);
        setLoading(false);
        return;
      }
      
      if (!candidateCheck.ready) {
        alert(`⚠️ Test Not Ready\n\nCandidate "${candidateCheck.candidateName || trimmedCandidateId}" was found but has no test questions configured.\n\nQuestion count: ${candidateCheck.questionCount || 0}\n\nPlease contact your test administrator to set up the questions.`);
        setLoading(false);
        return;
      }

      console.debug('[AITestInterface] Candidate validated, starting session...', {
        candidateName: candidateCheck.candidateName,
        questionCount: candidateCheck.questionCount,
        difficulty: candidateCheck.difficulty
      });

      // Candidate exists and has questions, start the session using the enhanced endpoint
      const response = await apiService.request(`/api/test/start-session-by-candidate/${trimmedCandidateId}`, {
        method: 'POST',
        body: JSON.stringify({ language: langParam || language })
      });
      
      console.debug('[AITestInterface] Session started successfully:', response);
      
      // Show success message briefly
      const successMessage = `✅ Test Started Successfully!\n\nWelcome ${response.candidateName || candidateCheck.candidateName || 'Candidate'}\nQuestions: ${response.totalQuestions}\nTime per question: ${Math.floor((response.timeLimit || 300) / 60)} minutes`;
      
      // Don't block the UI with alert, just log it
      console.info(successMessage);
      
      initializeSessionFromResponse(response, langParam || language);
      
    } catch (err) {
      console.error('Failed to start by candidateId:', err);
      
      // Provide specific error messages based on the error
      let errorMessage = `❌ Failed to Start Test\n\n`;
      
      if (err.message && err.message.includes('404')) {
        errorMessage += `Candidate ID "${trimmedCandidateId}" not found in the system.\n\nPlease check the candidate ID and try again.`;
      } else if (err.message && err.message.includes('400')) {
        errorMessage += `Candidate "${trimmedCandidateId}" exists but has configuration issues.\n\nPlease contact your administrator.`;
      } else if (err.message && (err.message.includes('500') || err.message.includes('Internal'))) {
        errorMessage += `System error occurred while starting the test.\n\nError: ${err.message}\n\nPlease try again or contact support.`;
      } else {
        errorMessage += `Unexpected error: ${err.message || 'Unknown error'}\n\nPlease try again or contact your administrator.`;
      }
      
      alert(errorMessage);
    }
    setLoading(false);
  };
  // Simplified setup: wait for server to inject candidate/config id or for the embedding to call window.startCodingTest
  // Expose a global function so external systems can start the test programmatically.
  useEffect(() => {
    try {
      // attach a simple starter on window
      window.startCodingTest = async (arg) => {
        if (!arg) return;
        if (typeof arg === 'string') {
          await startByCandidateId(arg, undefined);
          return;
        }
        if (typeof arg === 'object') {
          if (arg.candidateId) {
            await startByCandidateId(arg.candidateId, arg.language);
            return;
          }
          if (arg.configId) {
            await startByConfigId(arg.configId, arg.language);
            return;
          }
        }
      };
    } catch (e) {
      // ignore
    }
    return () => {
      try { delete window.startCodingTest; } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for postMessage from embedding parent/other apps so they can start the test
  // Examples accepted:
  // { type: 'startTest', candidateId: 'cand_123', language: 'javascript' }
  // { candidateId: 'cand_123' }
  // { configId: 'cfg_abc' }
  useEffect(() => {
    const onMessage = (event) => {
      try {
        let msg = event?.data;
        if (!msg) return;
        // If sender sent a JSON string, try parse it
        if (typeof msg === 'string') {
          try {
            msg = JSON.parse(msg);
          } catch (e) {
            // not JSON, ignore
            return;
          }
        }

        if (typeof msg !== 'object') return;

        // Accept multiple shapes / key names for compatibility
        const candidateId = msg.candidateId || msg.candidate_id || msg.candId || msg.candidate || null;
        const configId = msg.configId || msg.config_id || msg.cfg || null;
        const lang = msg.language || msg.lang || msg.languageCode || null;

        if (msg.type && String(msg.type).toLowerCase().includes('start')) {
          if (configId) {
            console.debug('[AITestInterface] postMessage start -> configId', configId, 'lang', lang);
            startByConfigId(configId, lang);
            return;
          }
          if (candidateId) {
            console.debug('[AITestInterface] postMessage start -> candidateId', candidateId, 'lang', lang);
            startByCandidateId(candidateId, lang);
            return;
          }
        }

        // Backwards compatibility: callers may just post { candidateId } or { configId }
        if (configId) {
          console.debug('[AITestInterface] postMessage configId', configId, 'lang', lang);
          startByConfigId(configId, lang);
          return;
        }
        if (candidateId) {
          console.debug('[AITestInterface] postMessage candidateId', candidateId, 'lang', lang);
          startByCandidateId(candidateId, lang);
          return;
        }
      } catch (e) {
        // ignore malformed messages
      }
    };

    window.addEventListener('message', onMessage, false);
    return () => window.removeEventListener('message', onMessage, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-start when URL parameters, server injects globals, or other triggers are detected
  useEffect(() => {
    // Check URL parameters first (highest priority)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCandidateId = urlParams.get('candidateId') || urlParams.get('candidate_id') || urlParams.get('cid');
      const urlConfigId = urlParams.get('configId') || urlParams.get('config_id') || urlParams.get('cfg');
      const urlLanguage = urlParams.get('language') || urlParams.get('lang');
      
      if (urlCandidateId) {
        console.debug('[AITestInterface] Auto-starting from URL candidateId:', urlCandidateId);
        startByCandidateId(urlCandidateId, urlLanguage || undefined);
        return;
      }
      
      if (urlConfigId) {
        console.debug('[AITestInterface] Auto-starting from URL configId:', urlConfigId);
        startByConfigId(urlConfigId, urlLanguage || undefined);
        return;
      }
    }

    // Poll for server-injected globals for a short period (useful when injection happens after client load)
    let attempts = 0;
    const maxAttempts = 60; // ~30 seconds at 500ms interval
    const interval = setInterval(() => {
      try {
        attempts += 1;
        const cand = typeof window !== 'undefined' ? (window.__CANDIDATE_ID__ || window.__CANDIDATEId || window.__candidate_id) : null;
        const cfg = typeof window !== 'undefined' ? (window.__CONFIG_ID__ || window.__CONFIGId || window.__config_id) : null;
        const lang = typeof window !== 'undefined' ? (window.__CANDIDATE_LANGUAGE__ || window.__CANDIDATE_LANG__ || window.__CANDIDATE_lang__) : null;
        if (cfg) {
          console.debug('[AITestInterface] Detected server-injected configId:', cfg, 'lang:', lang);
          startByConfigId(cfg, lang || undefined);
          clearInterval(interval);
          return;
        }
        if (cand) {
          console.debug('[AITestInterface] Detected server-injected candidateId:', cand, 'lang:', lang);
          startByCandidateId(cand, lang || undefined);
          clearInterval(interval);
          return;
        }
        if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      } catch (e) {
        // ignore
        if (attempts >= maxAttempts) clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (testState === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Coding Assessment</h2>
              <p className="text-gray-600 mt-2">Enter your candidate ID to begin the test</p>
            </div>

            {/* Candidate ID Input - Primary Method */}
            <div className="space-y-4">
              <div>
                <label htmlFor="candidateId" className="block text-sm font-medium text-gray-700 mb-2">
                  Candidate ID
                </label>
                <input
                  id="candidateId"
                  type="text"
                  value={candidateIdInput}
                  onChange={(e) => setCandidateIdInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && candidateIdInput.trim() && !loading) {
                      startByCandidateId(candidateIdInput);
                    }
                  }}
                  placeholder="Enter your candidate ID (e.g., CAND_123)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  disabled={loading}
                />
              </div>
              
              <button
                onClick={() => startByCandidateId(candidateIdInput)}
                disabled={loading || !candidateIdInput.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Starting Test...
                  </>
                ) : (
                  'Start Coding Test'
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="my-8 flex items-center">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-4 text-sm text-gray-500">Or use alternative method</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* Alternative Methods - Collapsible */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 flex items-center justify-between py-2">
                <span>Advanced Options</span>
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              
              <div className="mt-4 space-y-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Config ID</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={configIdInput}
                      onChange={(e) => setConfigIdInput(e.target.value)}
                      placeholder="cfg_..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={loading}
                    />
                    <button
                      onClick={() => startByConfigId(configIdInput)}
                      disabled={loading || !configIdInput.trim()}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      Start
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  <p>• URL Parameters: Add ?candidateId=YOUR_ID to the URL</p>
                  <p>• Programmatic: Use window.startCodingTest('YOUR_ID')</p>
                </div>
              </div>
            </details>
          </div>
          
          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Need help? Contact your test administrator if you don't have a candidate ID.</p>
          </div>
        </div>
      </div>
    );
  }

  // Active test screen
  if (testState === 'active') {
    return (
      <div className="h-screen overflow-hidden">
        {/* Absolutely Fixed Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="font-semibold text-gray-900">{candidateName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700 font-medium">Question {questionNumber} of {totalQuestions}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                timeLeft <= 60 ? 'bg-red-100 text-red-800 border border-red-200' : 
                timeLeft <= 120 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 
                'bg-green-100 text-green-800 border border-green-200'
              }`}>
                <Timer className="h-4 w-4" />
                <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
                <span className="text-xs font-medium opacity-75">this question</span>
              </div>
              {/* In-test language selector - updates code template when changed */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Language:</label>
                <select
                  value={language}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    handleLanguageChange(newLang);
                  }}
                  className="border rounded px-2 py-1 text-sm bg-white"
                >
                  {availableLanguages.map(lang => {
                    const languageNames = {
                      javascript: 'JavaScript',
                      python: 'Python', 
                      java: 'Java',
                      cpp: 'C++',
                      typescript: 'TypeScript'
                    };
                    return (
                      <option key={lang} value={lang}>
                        {languageNames[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <button
                onClick={handleRunCode}
                disabled={runLoading || !code.trim() || !sessionId || !currentQuestion}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm transition-colors"
              >
                {runLoading ? 'Testing...' : 'Run Code'}
              </button>
              
              <button
                onClick={handleSubmitCode}
                disabled={submitLoading || !code.trim()}
                className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm transition-colors"
              >
                {submitLoading ? 'Submitting...' : 'Submit Code'}
              </button>
            </div>
          </div>
        </div>

        {/* Main content area - with top padding for fixed header */}
        <div className="pt-24 h-screen flex">
          {/* Left Panel - Problem Statement */}
          <div className="w-2/5 bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Problem Statement</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {currentQuestion && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{currentQuestion.title}</h3>
                    <div className="text-gray-700 leading-relaxed">
                      <p className="mb-4">{currentQuestion.description}</p>
                    </div>
                  </div>
                  
                  {currentQuestion.examples && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Sample Input/Output:</h4>
                      <div className="space-y-4">
                        {Array.isArray(currentQuestion.examples) ? currentQuestion.examples.map((example, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg border shadow-sm">
                            {typeof example === 'object' && example.input ? (
                              <div className="space-y-3">
                                <div>
                                  <div className="font-semibold text-gray-700 mb-2">Sample Input {index + 1}:</div>
                                  <div className="font-mono bg-gray-50 p-3 rounded border text-gray-800 text-sm">{example.input}</div>
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-700 mb-2">Sample Output {index + 1}:</div>
                                  <div className="font-mono bg-gray-50 p-3 rounded border text-gray-800 text-sm">{example.output}</div>
                                </div>
                                {example.explanation && (
                                  <div className="text-sm text-gray-600 italic bg-blue-50 p-3 rounded border-l-4 border-blue-200">
                                    <strong>Explanation:</strong> {example.explanation}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm font-mono bg-gray-50 p-3 rounded border">
                                {typeof example === 'string' ? example : JSON.stringify(example)}
                              </div>
                            )}
                          </div>
                        )) : (
                          <div className="bg-white p-4 rounded-lg border shadow-sm">
                            <div className="text-sm font-mono bg-gray-50 p-3 rounded border">
                              {currentQuestion.examples}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentQuestion.constraints && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Constraints:</h4>
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg shadow-sm">
                        <p className="text-yellow-800 font-mono text-sm leading-relaxed">{currentQuestion.constraints}</p>
                      </div>
                    </div>
                  )}

                  {(currentQuestion.expectedComplexity || currentQuestion.complexity) && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Expected Complexity:</h4>
                      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg shadow-sm">
                        <p className="text-purple-800 font-mono">{currentQuestion.expectedComplexity || currentQuestion.complexity}</p>
                      </div>
                    </div>
                  )}

                  {/* Sample Tests Section */}
                  {currentQuestion.sampleTests && currentQuestion.sampleTests.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Sample Test Cases:</h4>
                      <div className="space-y-3">
                        {currentQuestion.sampleTests.map((test, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg border shadow-sm">
                            <div className="space-y-2">
                              <div>
                                <div className="font-semibold text-gray-700 text-sm">Input:</div>
                                <div className="font-mono bg-gray-50 p-2 rounded border text-sm">{cleanTestInput(test.input)}</div>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-700 text-sm">Expected Output:</div>
                                <div className="font-mono bg-gray-50 p-2 rounded border text-sm">{test.expectedOutput}</div>
                              </div>
                              {test.description && (
                                <div className="text-xs text-gray-600 italic">{test.description}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Difficulty and Time Limit */}
                  <div className="flex items-center space-x-4 text-sm">
                    {currentQuestion.difficulty && (
                      <div className={`px-3 py-1 rounded-full font-medium ${
                        currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Difficulty: {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                      </div>
                    )}
                    {currentQuestion.timeLimit && (
                      <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                        Time Limit: {Math.floor(currentQuestion.timeLimit / 60)}:{(currentQuestion.timeLimit % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Code Editor with Results Panel */}
          <div className="w-3/5 flex flex-col">
            {/* Code Editor */}
            <div className={`transition-all duration-300 bg-white ${
              isResultsPanelExpanded && (showingSampleResults || showingResult) 
                ? 'flex-1 min-h-0' 
                : 'h-full'
            }`}>
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                onLanguageChange={handleLanguageChange}
                signatures={currentQuestion?.signatures || {}}
                showLanguageSelector={false}
                height="100%"
              />
            </div>

            {/* HackerEarth Style Test Results Panel */}
            {(showingSampleResults || showingResult) && (
              <div className={`flex flex-col bg-white border-t border-gray-200 shadow-lg transition-all duration-300 ${
                isResultsPanelExpanded 
                  ? 'flex-1 min-h-0 max-h-96' 
                  : 'h-12 flex-shrink-0'
              }`}>
                {/* Results Header */}
                <div 
                  className="flex items-center justify-between p-3 bg-gray-50 border-b cursor-pointer hover:bg-gray-100"
                  onClick={() => setIsResultsPanelExpanded(!isResultsPanelExpanded)}
                >
                  <div className="flex items-center space-x-3">
                    <Code className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-800">Test Results</span>
                    {sampleTestResults?.sampleTests && (
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          sampleTestResults.sampleTests.every(t => t.passed) 
                            ? 'bg-green-100 text-green-800' 
                            : sampleTestResults.sampleTests.some(t => t.passed)
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {sampleTestResults.sampleTests.filter(t => t.passed).length}/{sampleTestResults.sampleTests.length} Passed
                        </span>
                        {sampleTestResults.sampleTests.some(t => t.simulated) && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            AI Simulated
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {isResultsPanelExpanded ? 'Click to collapse' : 'Click to expand'}
                    </span>
                    <div className={`transform transition-transform ${isResultsPanelExpanded ? 'rotate-180' : ''}`}>
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Results Content */}
                {isResultsPanelExpanded && (
                  <div className="flex-1 overflow-y-auto p-3 min-h-0">
                    {/* Sample Test Results */}
                    {showingSampleResults && sampleTestResults && (
                      <>
                        {sampleTestResults.error ? (
                          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                            <div className="flex items-center space-x-2 text-red-700 mb-3">
                              <AlertCircle className="h-5 w-5" />
                              <span className="font-medium text-base">Syntax Error</span>
                            </div>
                            <div className="bg-red-100 border border-red-300 p-3 rounded">
                              <div className="text-sm font-medium text-red-800 mb-2">
                                {sampleTestResults.error.includes('SyntaxError') ? 'Invalid Python syntax detected' :
                                 sampleTestResults.error.includes('IndentationError') ? 'Incorrect indentation' :
                                 sampleTestResults.error.includes('NameError') ? 'Undefined variable or function' :
                                 sampleTestResults.error.includes('TypeError') ? 'Type mismatch error' :
                                 'Code compilation failed'}
                              </div>
                              <div className="text-xs text-red-700 font-mono bg-red-50 p-2 rounded border max-h-32 overflow-y-auto">
                                {(() => {
                                  // Extract meaningful error message
                                  const error = sampleTestResults.error;
                                  if (error.includes('SyntaxError:')) {
                                    const match = error.match(/SyntaxError: (.+?)(?:\n|$)/);
                                    return match ? match[1] : 'Syntax error in code';
                                  }
                                  if (error.includes('IndentationError:')) {
                                    return 'Check your code indentation';
                                  }
                                  if (error.includes('NameError:')) {
                                    const match = error.match(/NameError: (.+?)(?:\n|$)/);
                                    return match ? match[1] : 'Undefined variable or function';
                                  }
                                  // Show first meaningful line of error
                                  const lines = error.split('\n').filter(line => 
                                    !line.includes('temp_') && 
                                    !line.includes('Command failed:') &&
                                    line.trim().length > 0
                                  );
                                  return lines[0] || error;
                                })()}
                              </div>
                              <div className="mt-2 text-xs text-red-600">
                                💡 <strong>Tip:</strong> Check for missing colons (:), incorrect indentation, or typos in your code.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Test Cases - Scrollable Layout */}
                            {sampleTestResults.sampleTests && sampleTestResults.sampleTests.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-800 mb-2 text-sm">Test Cases:</h4>
                                <div className="space-y-2">
                                  {sampleTestResults.sampleTests.map((test, idx) => (
                                    <div key={idx} className={`border rounded p-2 ${
                                      test.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                    }`}>
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-700 text-xs">Test Case {idx + 1}</span>
                                        <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                          test.passed 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {test.passed ? (
                                            <CheckCircle className="h-3 w-3" />
                                          ) : (
                                            <AlertCircle className="h-3 w-3" />
                                          )}
                                          <span>{test.passed ? 'PASS' : 'FAIL'}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-3 gap-2">
                                        <div className="min-w-0">
                                          <div className="font-medium text-gray-600 mb-1 text-xs">Input:</div>
                                          <div className="font-mono bg-white p-1.5 rounded border text-gray-800 text-xs break-all max-h-12 overflow-y-auto">
                                            {test.input}
                                          </div>
                                        </div>
                                        
                                        <div className="min-w-0">
                                          <div className="font-medium text-gray-600 mb-1 text-xs">Expected:</div>
                                          <div className="font-mono bg-white p-1.5 rounded border text-gray-800 text-xs break-all max-h-12 overflow-y-auto">
                                            {test.expected}
                                          </div>
                                        </div>
                                        
                                        <div className="min-w-0">
                                          <div className="font-medium text-gray-600 mb-1 text-xs">Your Output:</div>
                                          <div className={`font-mono bg-white p-1.5 rounded border text-xs break-all max-h-12 overflow-y-auto ${
                                            test.passed ? 'text-gray-800' : 'text-red-600'
                                          }`}>
                                            {test.actual || 'No output'}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {test.description && (
                                        <div className="mt-1 text-xs text-gray-600 italic">
                                          {test.description}
                                        </div>
                                      )}
                                      
                                      {test.error && (
                                        <div className="mt-1 text-xs text-red-600 bg-red-100 p-1 rounded">
                                          {test.error}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Submission Feedback */}
                    {showingResult && analysis && (
                      <div className="p-4 border-t">
                        <div className={`p-4 rounded-lg ${
                          analysis?.status === 'correct' ? 'bg-green-50 border border-green-200' :
                          'bg-blue-50 border border-blue-200'
                        }`}>
                          <div className="flex items-start space-x-2">
                            {analysis?.status === 'correct' ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            ) : (
                              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900 mb-1">
                                {analysis?.status === 'correct' ? 'Solution Accepted!' : 'Code Submitted'}
                              </p>
                              <p className="text-sm text-gray-700">
                                {analysis?.status === 'correct' 
                                  ? 'Your solution passed all test cases.' 
                                  : 'Moving to the next question...'}
                              </p>
                              {analysis?.score && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Score: {analysis.score}/100
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (testState === 'completed') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Completed!</h1>
            <p className="text-gray-600">Here are your results</p>
          </div>
          
          {testResults && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-blue-600">Questions Attempted</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {testResults.questionsAttempted}/{testResults.totalQuestions}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-green-600">Average Score</p>
                  <p className="text-2xl font-bold text-green-900">
                    {Math.round(testResults.averageScore)}%
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-purple-600">Difficulty</p>
                  <p className="text-2xl font-bold text-purple-900 capitalize">
                    {testResults.difficulty}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-orange-600">Language</p>
                  <p className="text-2xl font-bold text-orange-900 capitalize">
                    {testResults.language}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {testResults.results.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-base font-medium text-gray-900">
                          Question {result.questionNumber}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {result.analysis?.status === 'correct' ? (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-medium text-sm">Correct</span>
                            </div>
                          ) : result.analysis?.status === 'timeout' ? (
                            <div className="flex items-center space-x-1 text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium text-sm">Timeout</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="font-medium text-sm">Needs Work</span>
                            </div>
                          )}
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (result.analysis?.score || 0) >= 80 ? 'bg-green-100 text-green-800' :
                            (result.analysis?.score || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {result.analysis?.score || 0}/100
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-2 rounded border">
                            <p className="text-xs font-medium text-gray-600 mb-1">Time Spent</p>
                            <p className="text-sm text-gray-900 font-medium">
                              {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')} min
                            </p>
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <p className="text-xs font-medium text-gray-600 mb-1">Complexity</p>
                            <p className="text-xs text-gray-900 font-mono">
                              {result.analysis?.complexity || 'Not analyzed'}
                            </p>
                          </div>
                        </div>

                        {result.analysis?.feedback && (
                          <div className="bg-white p-3 rounded border">
                            <h6 className="text-xs font-medium text-gray-700 mb-1">Feedback</h6>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {result.analysis.feedback}
                            </p>
                          </div>
                        )}

                        {result.analysis?.testResults && result.analysis.testResults.length > 0 && (
                          <div className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="text-xs font-medium text-gray-700">Test Cases</h6>
                              <span className="text-xs text-gray-500">
                                {result.analysis.testResults.filter(t => {
                                  return typeof t === 'object' ? t.passed : t.includes('pass');
                                }).length}/{result.analysis.testResults.length} passed
                              </span>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {result.analysis.testResults.map((test, idx) => {
                                const passed = typeof test === 'object' ? test.passed : test.includes('pass');
                                
                                return (
                                  <div key={idx} className={`flex items-center space-x-1 p-1 rounded text-xs ${
                                    passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                  }`}>
                                    {passed ? (
                                      <CheckCircle className="h-3 w-3 flex-shrink-0" />
                                    ) : (
                                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                    )}
                                    <span className="font-mono text-xs">
                                      Test {idx + 1}: {passed ? 'PASS' : 'FAIL'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {(result.analysis?.strengths?.length > 0 || result.analysis?.improvements?.length > 0) && (
                          <div className="grid grid-cols-1 gap-2">
                            {result.analysis?.strengths?.length > 0 && (
                              <div className="bg-green-50 p-2 rounded border border-green-200">
                                <h6 className="text-xs font-medium text-green-800 mb-1 flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Strengths
                                </h6>
                                <ul className="text-xs text-green-700 space-y-0.5 max-h-20 overflow-y-auto">
                                  {result.analysis.strengths.map((strength, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-green-600 mr-1 flex-shrink-0">•</span>
                                      <span className="leading-tight">
                                        {strength}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {result.analysis?.improvements?.length > 0 && (
                              <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                <h6 className="text-xs font-medium text-blue-800 mb-1 flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Improvements
                                </h6>
                                <ul className="text-xs text-blue-700 space-y-0.5 max-h-20 overflow-y-auto">
                                  {result.analysis.improvements.map((improvement, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-blue-600 mr-1 flex-shrink-0">•</span>
                                      <span className="leading-tight">
                                        {improvement}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
                >
                  Take Another Test
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}