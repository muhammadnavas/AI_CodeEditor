'use client';

import ChatInterface from '@/components/ChatInterface';
import CodeEditor from '@/components/CodeEditor';
import { apiService } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function MainEditor() {
  const [code, setCode] = useState('');
  
  const [language, setLanguage] = useState('javascript');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [output, setOutput] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Language-specific example codes
  const getExampleCode = (lang) => {
    const examples = {
      javascript: `// Welcome to AI Code Editor!
// Write your JavaScript code here and click "Run Code" to execute it

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Test the function
console.log("Fibonacci sequence:");
for (let i = 0; i <= 10; i++) {
  console.log(\`fibonacci(\${i}) = \${fibonacci(i)}\`);
}`,
      python: `# Welcome to AI Code Editor!
# Write your Python code here and click "Run Code" to simulate execution

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Test the function
print("Fibonacci sequence:")
for i in range(11):
    print(f"fibonacci({i}) = {fibonacci(i)}")`,
      java: `// Welcome to AI Code Editor!
// Write your Java code here and click "Run Code" to simulate execution

public class Main {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    public static void main(String[] args) {
        System.out.println("Fibonacci sequence:");
        for (int i = 0; i <= 10; i++) {
            System.out.println("fibonacci(" + i + ") = " + fibonacci(i));
        }
    }
}`,
      cpp: `// Welcome to AI Code Editor!
// Write your C++ code here and click "Run Code" to simulate execution

#include <iostream>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    cout << "Fibonacci sequence:" << endl;
    for (int i = 0; i <= 10; i++) {
        cout << "fibonacci(" << i << ") = " << fibonacci(i) << endl;
    }
    return 0;
}`,
      typescript: `// Welcome to AI Code Editor!
// Write your TypeScript code here and click "Run Code" to simulate execution

function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Test the function
console.log("Fibonacci sequence:");
for (let i: number = 0; i <= 10; i++) {
  console.log(\`fibonacci(\${i}) = \${fibonacci(i)}\`);
}`
    };
    return examples[lang] || examples.javascript;
  };

  // Initialize with JavaScript example
  useEffect(() => {
    setCode(getExampleCode('javascript'));
  }, []);

  // Update code when language changes
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCode(getExampleCode(newLanguage));
    setAnalysis(null);
    setOutput(null);
  };

  const handleCodeChange = async (newCode, action) => {
    setCode(newCode);
    
    if (action === 'execute') {
      await analyzeCode(newCode);
    }
  };

  const analyzeCode = async (codeToAnalyze = code) => {
    if (!codeToAnalyze.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await apiService.analyzeCode(codeToAnalyze, language);
      setAnalysis(result);
    } catch (error) {
      console.error('Failed to analyze code:', error);
      setAnalysis({
        summary: 'Failed to analyze code. Please check your API configuration.',
        rating: 0
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fixCode = async () => {
    if (!code.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await apiService.fixCode(code, language);
      // Extract code from the response (remove markdown formatting if present)
      const fixedCode = result.fixedCode.replace(/```[\w]*\n?/g, '').trim();
      setCode(fixedCode);
    } catch (error) {
      console.error('Failed to fix code:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const completeCode = async () => {
    if (!code.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await apiService.completeCode(code, language);
      setCode(code + result.completion);
    } catch (error) {
      console.error('Failed to complete code:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runCode = async () => {
    if (!code.trim()) return;

    setIsExecuting(true);
    setOutput(null);
    try {
      const result = await apiService.executeCode(code, language);
      setOutput(result);
    } catch (error) {
      console.error('Failed to execute code:', error);
      setOutput({
        output: 'Failed to execute code. Please check your connection.',
        error: error.message,
        executionTime: 0
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">AI Code Editor</h1>
            <a
              href="/test"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium text-sm"
            >
              🧠 Start AI Coding Test
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="typescript">TypeScript</option>
            </select>
            {language !== 'javascript' && (
              <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                🤖 AI Simulation
              </span>
            )}
            <button
              onClick={() => analyzeCode()}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
            </button>
            <button
              onClick={completeCode}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              Complete
            </button>
            <button
              onClick={runCode}
              disabled={isExecuting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              title={language === 'javascript' ? 'Execute code directly' : 'Simulate code execution with AI'}
            >
              {isExecuting ? 'Running...' : (language === 'javascript' ? 'Run Code' : 'Simulate Code')}
            </button>
            <button
              onClick={fixCode}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              Fix Code
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor Panel */}
        <div className="flex-1 flex flex-col p-4">
          <div className="flex-1 mb-4" style={{ minHeight: '400px' }}>
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              language={language}
              height="400px"
            />
          </div>
          
          {/* Output and Analysis Panel */}
          {(output || analysis) && (
            <div className="h-48 flex space-x-4">
              {/* Code Output Panel */}
              {output && (
                <div className="flex-1 bg-white border rounded-lg p-4 overflow-y-auto">
                  <h3 className="font-semibold mb-2 flex items-center">
                    Code Output
                    {output.executionTime !== undefined && (
                      <span className="ml-2 px-2 py-1 text-sm bg-green-100 text-green-800 rounded">
                        {output.executionTime}ms
                      </span>
                    )}
                  </h3>
                  <div className={`text-sm font-mono whitespace-pre-wrap ${output.error ? 'text-red-600' : 'text-gray-800'}`}>
                    {output.output || 'No output'}
                  </div>
                </div>
              )}

              {/* Analysis Panel */}
              {analysis && (
                <div className="flex-1 bg-white border rounded-lg p-4 overflow-y-auto">
                  <h3 className="font-semibold mb-2 flex items-center">
                    Code Analysis
                    {analysis.rating && (
                      <span className="ml-2 px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                        Rating: {analysis.rating}/10
                      </span>
                    )}
                  </h3>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {analysis.summary || analysis.quality || 'Analysis completed'}
                  </div>
                  {analysis.issues && analysis.issues.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-red-600">Issues:</strong>
                      <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                        {analysis.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-green-600">Suggestions:</strong>
                      <ul className="list-disc list-inside text-sm text-green-600 mt-1">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="w-96 p-4">
          <ChatInterface codeContext={code} />
        </div>
      </div>
    </div>
  );
}