// Language configurations for the AI Code Editor
const SUPPORTED_LANGUAGES = {
  javascript: {
    name: 'JavaScript',
    fileExtension: 'js',
    monacoId: 'javascript',
    executable: true,
    template: `// Write your JavaScript solution here
function solutionName() {
  // Your code here
}`,
    example: `// Welcome to AI Code Editor!
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
    syntax: 'JavaScript ES6+',
    conventions: 'camelCase',
    dataTypes: 'dynamic'
  },
  
  python: {
    name: 'Python',
    fileExtension: 'py',
    monacoId: 'python',
    executable: false,
    template: `# Write your Python solution here
def solution_name():
    # Your code here
    pass`,
    example: `# Welcome to AI Code Editor!
# Write your Python code here and click "Run Code" to simulate execution

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Test the function
print("Fibonacci sequence:")
for i in range(11):
    print(f"fibonacci({i}) = {fibonacci(i)}")`,
    syntax: 'Python 3',
    conventions: 'snake_case',
    dataTypes: 'dynamic with type hints'
  },
  
  java: {
    name: 'Java',
    fileExtension: 'java',
    monacoId: 'java',
    executable: false,
    template: `// Write your Java solution here
public class Solution {
    public static void solutionName() {
        // Your code here
    }
}`,
    example: `// Welcome to AI Code Editor!
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
    syntax: 'Java',
    conventions: 'camelCase with PascalCase classes',
    dataTypes: 'static typing'
  },
  
  cpp: {
    name: 'C++',
    fileExtension: 'cpp',
    monacoId: 'cpp',
    executable: false,
    template: `// Write your C++ solution here
#include <iostream>
#include <vector>
using namespace std;

void solutionName() {
    // Your code here
}`,
    example: `// Welcome to AI Code Editor!
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
    syntax: 'Modern C++',
    conventions: 'snake_case or camelCase',
    dataTypes: 'static typing with STL'
  },
  
  typescript: {
    name: 'TypeScript',
    fileExtension: 'ts',
    monacoId: 'typescript',
    executable: false,
    template: `// Write your TypeScript solution here
function solutionName(): void {
  // Your code here
}`,
    example: `// Welcome to AI Code Editor!
// Write your TypeScript code here and click "Run Code" to simulate execution

function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Test the function
console.log("Fibonacci sequence:");
for (let i: number = 0; i <= 10; i++) {
  console.log(\`fibonacci(\${i}) = \${fibonacci(i)}\`);
}`,
    syntax: 'TypeScript',
    conventions: 'camelCase with type annotations',
    dataTypes: 'static typing'
  }
};

// Export for frontend use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPPORTED_LANGUAGES };
}

// Export for frontend use (browser)
if (typeof window !== 'undefined') {
  window.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
}