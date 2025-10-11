'use client';

import { AlertCircle, CheckCircle, Clock, Code, Timer, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { apiService } from '../lib/api';
import CodeEditor from './CodeEditor';

export default function AITestInterface() {
  const [testState, setTestState] = useState('setup'); // setup, active, completed
  const [sessionId, setSessionId] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
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
  
  const timerRef = useRef(null);
  const questionStartTimeRef = useRef(null);

  // Helper function to get default code template
  const getDefaultTemplate = (lang) => {
    const templates = {
      javascript: '// Write your JavaScript solution here\nfunction solutionName() {\n  // Your code here\n}',
      python: '# Write your Python solution here\ndef solution_name():\n    # Your code here\n    pass',
      java: '// Write your Java solution here\n// All necessary imports are already available\npublic class Solution {\n    public static void solutionName() {\n        // Your code here\n    }\n}',
      cpp: '// Write your C++ solution here\n// All necessary headers are already included\nvoid solutionName() {\n    // Your code here\n}',
      typescript: '// Write your TypeScript solution here\nfunction solutionName(): void {\n  // Your code here\n}'
    };
    return templates[lang] || templates.javascript;
  };

  // Timer effect
  useEffect(() => {
    if (isTimerActive && timeLeft > 0 && testState === 'active') {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
        setTimeSpent(prev => prev + 1);
      }, 1000);
    } else if (timeLeft === 0 && !autoSubmitted) {
      handleTimeOut();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, isTimerActive, testState, autoSubmitted]);

  // Start test session
  const handleStartTest = async () => {
    if (!candidateName.trim()) {
      alert('Please enter your name to start the test');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.startTestSession(candidateName, difficulty, language);
      
      setSessionId(response.sessionId);
      setCurrentQuestion(response.question);
      setQuestionNumber(response.questionNumber);
      setTotalQuestions(response.totalQuestions);
      setTestState('active');
      
      // Initialize timer
      setTimeLeft(300); // 5 minutes
      setTimeSpent(0);
      setIsTimerActive(true);
      questionStartTimeRef.current = Date.now();
      
      // Set initial code template
      setCode(response.question.signature || getDefaultTemplate(language));
      
    } catch (error) {
      console.error('Failed to start test:', error);
      alert('Failed to start test. Please try again.');
    }
    setLoading(false);
  };

  // Handle code testing with sample cases
  const handleRunCode = async () => {
    if (!code.trim()) {
      setSampleTestResults({ error: 'Please write some code before running.' });
      setShowingSampleResults(true);
      return;
    }

    setRunLoading(true);
    setShowingSampleResults(false);
    try {
      // Test code with sample test cases only
      const response = await apiService.testCode(sessionId, code, questionNumber);
      
      setSampleTestResults(response);
      setShowingSampleResults(true);
      
    } catch (error) {
      console.error('Failed to test code:', error);
      setSampleTestResults({ error: 'Failed to test code. Please try again.' });
      setShowingSampleResults(true);
    }
    setRunLoading(false);
  };

  // Handle code submission and analysis
  const handleSubmitCode = async () => {
    if (!code.trim()) {
      setFeedback('Please write some code before submitting.');
      return;
    }

    setSubmitLoading(true);
    try {
      // Submit code for full analysis
      const currentTimeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
      const response = await apiService.submitCode(sessionId, code, questionNumber, currentTimeSpent);
      
      setAnalysis(response.analysis);
      setShowingResult(true);
      setShowingSampleResults(false); // Hide sample results when submitting
      
      // Auto-correct if needed
      if (response.analysis.status === 'incorrect' && response.analysis.correctedCode) {
        setFeedback(`Your code has issues. Here's the corrected version: ${response.analysis.feedback}`);
      } else if (response.analysis.status === 'correct') {
        setFeedback('Excellent! Your solution is correct.');
      } else {
        setFeedback(response.analysis.feedback || 'Code analyzed.');
      }
      
      // Auto-move to next question after 3 seconds if correct or show correction
      setTimeout(() => {
        if (response.nextQuestion) {
          moveToNextQuestion(response.nextQuestion, response.questionNumber);
        } else if (response.testComplete) {
          completeTest();
        }
      }, 3000);
      
    } catch (error) {
      console.error('Failed to submit code:', error);
      setFeedback('Failed to submit code. Please try again.');
    }
    setSubmitLoading(false);
  };

  // Handle timeout
  const handleTimeOut = async () => {
    setAutoSubmitted(true);
    setIsTimerActive(false);
    setSubmitLoading(true);
    
    try {
      const response = await apiService.timeoutQuestion(sessionId, questionNumber);
      
      setFeedback('Time expired for this question! Moving to the next question...');
      setShowingResult(true);
      setShowingSampleResults(false);
      
      setTimeout(() => {
        if (response.nextQuestion) {
          moveToNextQuestion(response.nextQuestion, response.questionNumber);
        } else if (response.testComplete) {
          completeTest();
        }
      }, 2000);
      
    } catch (error) {
      console.error('Failed to handle timeout:', error);
    }
    setSubmitLoading(false);
  };

  // Move to next question
  const moveToNextQuestion = (nextQuestion, nextQuestionNumber) => {
    setCurrentQuestion(nextQuestion);
    setQuestionNumber(nextQuestionNumber);
    setCode(nextQuestion.signature || getDefaultTemplate(language));
    
    // Reset timer for new question
    setTimeLeft(300);
    setTimeSpent(0);
    setIsTimerActive(true);
    setAutoSubmitted(false);
    setShowingResult(false);
    setShowingSampleResults(false);
    setSampleTestResults(null);
    setFeedback('');
    setAnalysis(null);
    
    questionStartTimeRef.current = Date.now();
  };

  // Complete test
  const completeTest = async () => {
    setTestState('completed');
    setIsTimerActive(false);
    
    try {
      const results = await apiService.getTestResults(sessionId);
      setTestResults(results);
    } catch (error) {
      console.error('Failed to get results:', error);
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup screen
  if (testState === 'setup') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Coding Test</h1>
            <p className="text-gray-600">Complete 2 coding challenges - 5 minutes per question</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Programming Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="typescript">TypeScript</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'javascript' 
                  ? 'Full code execution available' 
                  : 'AI-powered code simulation and analysis'}
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">LeetCode-Style Coding Test:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>5 minutes per question</strong> (2 questions total)</li>
                <li>• <strong>Run Code:</strong> Test with sample cases (visible inputs/outputs)</li>
                <li>• <strong>Submit Code:</strong> Final evaluation with hidden test cases</li>
                <li>• <strong>Sample tests:</strong> Help you debug and validate your logic</li>
                <li>• <strong>Hidden tests:</strong> Cover edge cases for final scoring</li>
                <li>• All imports/libraries are pre-available (no imports needed)</li>
                <li>• Auto-advance if time expires on a question</li>
              </ul>
              <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
                <strong>💡 Tip:</strong> Use "Run Code" frequently to test your solution with sample cases, 
                then "Submit Code" when you're confident it handles all scenarios.
              </div>
            </div>
            
            <button
              onClick={handleStartTest}
              disabled={loading || !candidateName.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Starting Test...' : 'Start Test'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active test screen
  if (testState === 'active') {
    return (
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-900">{candidateName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-gray-500" />
                <span className="text-gray-600">Question {questionNumber} of {totalQuestions}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                timeLeft <= 60 ? 'bg-red-100 text-red-800' : 
                timeLeft <= 120 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-green-100 text-green-800'
              }`}>
                <Timer className="h-4 w-4" />
                <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
                <span className="text-xs opacity-75">this question</span>
              </div>
              
              <button
                onClick={handleRunCode}
                disabled={runLoading || !code.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {runLoading ? 'Testing...' : 'Run Code'}
              </button>
              
              <button
                onClick={handleSubmitCode}
                disabled={submitLoading || !code.trim() || showingResult}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitLoading ? 'Submitting...' : 'Submit Code'}
              </button>
            </div>
          </div>
        </div>

        {/* Question and Code Editor */}
        <div className="flex-1 flex">
          {/* Question Panel */}
          <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto">
            {currentQuestion && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">{currentQuestion.title}</h2>
                
                <div className="prose prose-sm">
                  <p className="text-gray-700">{currentQuestion.description}</p>
                </div>
                
                {currentQuestion.examples && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Examples:</h3>
                    <div className="space-y-3">
                      {Array.isArray(currentQuestion.examples) ? currentQuestion.examples.map((example, index) => (
                        <div key={index} className="bg-white p-4 rounded border relative">
                          <div className="absolute top-2 right-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                            Example {index + 1}
                          </div>
                          {typeof example === 'object' && example.input ? (
                            <div className="space-y-2 pr-16">
                              <div className="text-sm">
                                <span className="font-semibold text-blue-700">Input:</span>
                                <span className="ml-2 font-mono bg-blue-50 px-2 py-1 rounded text-blue-800">{example.input}</span>
                              </div>
                              <div className="text-sm">
                                <span className="font-semibold text-green-700">Output:</span>
                                <span className="ml-2 font-mono bg-green-50 px-2 py-1 rounded text-green-800">{example.output}</span>
                              </div>
                              {example.explanation && (
                                <div className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded">
                                  <span className="font-medium">Explanation:</span> {example.explanation}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm font-mono pr-16">{typeof example === 'string' ? example : JSON.stringify(example)}</div>
                          )}
                        </div>
                      )) : (
                        <div className="bg-white p-3 rounded border text-sm font-mono">
                          {currentQuestion.examples}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentQuestion.constraints && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Constraints:</h3>
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                      <p className="text-sm text-yellow-800">{currentQuestion.constraints}</p>
                    </div>
                  </div>
                )}

                {currentQuestion.complexity && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Expected Complexity:</h3>
                    <div className="bg-purple-50 border border-purple-200 p-2 rounded">
                      <p className="text-sm text-purple-800 font-mono">{currentQuestion.complexity}</p>
                    </div>
                  </div>
                )}
                
                {/* Sample Test Results */}
                {showingSampleResults && sampleTestResults && (
                  <div className="mt-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Code className="h-4 w-4 mr-2" />
                        Sample Test Results
                      </h4>
                      
                      {sampleTestResults.error ? (
                        <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 text-sm">
                          <AlertCircle className="h-4 w-4 inline mr-2" />
                          {sampleTestResults.error}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sampleTestResults.output && (
                            <div className="bg-gray-50 p-3 rounded">
                              <p className="text-sm font-medium text-gray-700 mb-1">Output:</p>
                              <pre className="text-sm text-gray-900 font-mono whitespace-pre-wrap">
                                {sampleTestResults.output}
                              </pre>
                            </div>
                          )}
                          
                          {sampleTestResults.sampleTests && sampleTestResults.sampleTests.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-gray-700">
                                  Sample Test Cases
                                </p>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    sampleTestResults.sampleTests.every(t => t.passed) 
                                      ? 'bg-green-100 text-green-800' 
                                      : sampleTestResults.sampleTests.some(t => t.passed)
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {sampleTestResults.sampleTests.filter(t => t.passed).length}/{sampleTestResults.sampleTests.length} passed
                                  </span>
                                  {sampleTestResults.sampleTests.some(t => t.simulated) && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                      AI Simulated
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-3">
                                {sampleTestResults.sampleTests.map((test, idx) => (
                                  <div key={idx} className="border rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                      <span className="text-xs font-medium text-gray-500">
                                        Test Case {idx + 1}
                                      </span>
                                      <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                                        test.passed 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        {test.passed ? (
                                          <CheckCircle className="h-3 w-3" />
                                        ) : (
                                          <AlertCircle className="h-3 w-3" />
                                        )}
                                        <span>{test.passed ? 'PASS' : 'FAIL'}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="font-medium text-gray-600">Input:</span>
                                        <div className="font-mono bg-gray-50 p-2 rounded mt-1 text-gray-800">
                                          {test.input}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <span className="font-medium text-gray-600">Expected:</span>
                                        <div className="font-mono bg-green-50 p-2 rounded mt-1 text-green-800">
                                          {test.expected}
                                        </div>
                                      </div>
                                      
                                      {!test.passed && test.actual && (
                                        <div>
                                          <span className="font-medium text-gray-600">Your Output:</span>
                                          <div className="font-mono bg-red-50 p-2 rounded mt-1 text-red-800">
                                            {test.actual}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {test.description && (
                                        <div className="text-xs text-gray-500 italic">
                                          {test.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
                                <p className="font-medium text-blue-900 mb-1">About Test Cases</p>
                                <p className="text-blue-800">
                                  These are <strong>sample test cases</strong> to help you debug your solution. 
                                  When you submit, your code will be tested against additional hidden test cases 
                                  that cover edge cases and various scenarios.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Simple Feedback Section - No detailed analysis during test */}
                {showingResult && (
                  <div className="mt-6">
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
                            {analysis?.status === 'correct' ? 'Great job!' : 'Code submitted'}
                          </p>
                          <p className="text-sm text-gray-700">
                            {analysis?.status === 'correct' 
                              ? 'Your solution is working correctly!' 
                              : 'Moving to the next question...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Code Editor Panel */}
          <div className="w-1/2 bg-white">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              height="100%"
            />
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h3>
                <div className="space-y-6">
                  {testResults.results.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">
                          Question {result.questionNumber}
                        </h4>
                        <div className="flex items-center space-x-3">
                          {result.analysis?.status === 'correct' ? (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-medium">Correct</span>
                            </div>
                          ) : result.analysis?.status === 'timeout' ? (
                            <div className="flex items-center space-x-1 text-gray-500">
                              <Clock className="h-5 w-5" />
                              <span className="font-medium">Timeout</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-red-600">
                              <AlertCircle className="h-5 w-5" />
                              <span className="font-medium">Needs Improvement</span>
                            </div>
                          )}
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            (result.analysis?.score || 0) >= 80 ? 'bg-green-100 text-green-800' :
                            (result.analysis?.score || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {result.analysis?.score || 0}/100
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-3 rounded border">
                          <p className="text-sm font-medium text-gray-700 mb-1">Time Complexity</p>
                          <p className="text-sm text-gray-900 font-mono">
                            {result.analysis?.complexity || 'Not analyzed'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <p className="text-sm font-medium text-gray-700 mb-1">Time Spent</p>
                          <p className="text-sm text-gray-900">
                            {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')} minutes
                          </p>
                        </div>
                      </div>

                      {result.analysis?.feedback && (
                        <div className="bg-white p-4 rounded border mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Feedback</h5>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {result.analysis.feedback}
                          </p>
                        </div>
                      )}

                      {result.analysis?.strengths && result.analysis.strengths.length > 0 && (
                        <div className="bg-green-50 p-4 rounded border border-green-200 mb-4">
                          <h5 className="font-medium text-green-900 mb-2 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Strengths
                          </h5>
                          <ul className="text-sm text-green-800 space-y-1">
                            {result.analysis.strengths.map((strength, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-green-600 mr-1">•</span>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.analysis?.improvements && result.analysis.improvements.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-4">
                          <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Areas for Improvement
                          </h5>
                          <ul className="text-sm text-blue-800 space-y-1">
                            {result.analysis.improvements.map((improvement, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-blue-600 mr-1">•</span>
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.analysis?.testResults && result.analysis.testResults.length > 0 && (
                        <div className="bg-white p-4 rounded border">
                          <h5 className="font-medium text-gray-900 mb-3 flex items-center justify-between">
                            <span>Test Cases</span>
                            <span className="text-sm text-gray-600">
                              {result.analysis.testResults.filter(t => {
                                // Handle both object format (t.passed) and string format (t.includes('pass'))
                                return typeof t === 'object' ? t.passed : t.includes('pass');
                              }).length}/{result.analysis.testResults.length} passed
                            </span>
                          </h5>
                          <div className="space-y-2">
                            {result.analysis.testResults.map((test, idx) => {
                              // Handle both object and string formats
                              const passed = typeof test === 'object' ? test.passed : test.includes('pass');
                              
                              return (
                                <div key={idx} className={`flex items-center space-x-2 p-2 rounded text-sm ${
                                  passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                  {passed ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4" />
                                  )}
                                  
                                  {typeof test === 'object' ? (
                                    // Object format - show detailed test info
                                    <>
                                      <span className="font-mono">Input: {test.input}</span>
                                      <span>→</span>
                                      <span className="font-mono">Expected: {test.expectedOutput}</span>
                                      {!passed && test.actualOutput && (
                                        <>
                                          <span>→</span>
                                          <span className="font-mono">Got: {test.actualOutput}</span>
                                        </>
                                      )}
                                    </>
                                  ) : (
                                    // String format - show as is
                                    <span className="font-mono">{test}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
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