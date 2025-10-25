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
    const fnName = q.functionName || null;
    const initialTemplate = (q.signature && q.language && q.language.toLowerCase() === (lang || language).toLowerCase())
      ? q.signature
      : (fnName ? buildTemplateWithFunction(fnName, lang || language) : getDefaultTemplate(lang || language));
    setCode(initialTemplate);
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

  // Auto-start when server injects globals like window.__CANDIDATE_ID__ or window.__CONFIG_ID__
  useEffect(() => {
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
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-lg font-medium text-gray-900">Waiting to start test</h2>
          <p className="text-sm text-gray-600 mt-2">This interface will start automatically when your system injects <code>window.__CANDIDATE_ID__</code> or calls <code>window.startCodingTest()</code>.</p>
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
                    setLanguage(newLang);
                    // Update code template to match the selected language and keep function name if available
                    const fn = currentQuestion?.functionName || null;
                    const newTemplate = fn ? buildTemplateWithFunction(fn, newLang) : getDefaultTemplate(newLang);
                    setCode(newTemplate);
                  }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              
              <button
                onClick={handleRunCode}
                disabled={runLoading || !code.trim()}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm transition-colors"
              >
                {runLoading ? 'Testing...' : 'Run Code'}
              </button>
              
              <button
                onClick={handleSubmitCode}
                disabled={submitLoading || !code.trim() || showingResult}
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

                  {currentQuestion.complexity && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Expected Complexity:</h4>
                      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg shadow-sm">
                        <p className="text-purple-800 font-mono">{currentQuestion.complexity}</p>
                      </div>
                    </div>
                  )}
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