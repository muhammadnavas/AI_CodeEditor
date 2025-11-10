# LeetCode-Style Question JSON Format Guide

## Complete Question Structure

### Root Document Structure
```json
{
  "candidateId": "unique_candidate_identifier",
  "candidateName": "Candidate Full Name",
  "position": "Job Title (optional)",
  "experience": "Years of experience (optional)",
  "skills": ["skill1", "skill2"], // optional
  "difficulty": "easy|medium|hard", // overall difficulty
  "language": "javascript|python|java|cpp|typescript", // default language
  "timePerQuestion": 300, // seconds (5 minutes default)
  "questions": [ /* array of question objects */ ]
}
```

### Individual Question Structure
```json
{
  "id": "unique-question-id", // kebab-case identifier
  "title": "Question Title", // display name
  "description": "Full problem description with examples and requirements",
  "difficulty": "easy|medium|hard",
  "language": "javascript|python|java|cpp|typescript",
  "timeLimit": 300, // seconds for this specific question
  "signature": "function template with proper syntax", // starter code
  "functionName": "expectedFunctionName", // function to call for testing
  "examples": [ /* visual examples for candidate */ ],
  "constraints": "Input constraints and limitations",
  "expectedComplexity": "Time and space complexity expectations",
  "sampleTests": [ /* visible test cases */ ],
  "hiddenTests": [ /* hidden test cases */ ],
  "testCases": [ /* all test cases combined */ ]
}
```

## Test Case Formats

### Sample Tests (Visible to Candidate)
```json
"sampleTests": [
  {
    "input": "function_arguments_as_string", // e.g., "[1,2,3], 5"
    "expectedOutput": "expected_result_as_string", // e.g., "true" or "[0,1]"
    "description": "Human readable test description"
  }
]
```

### Hidden Tests (Not Visible to Candidate)
```json
"hiddenTests": [
  {
    "input": "edge_case_input",
    "expectedOutput": "expected_edge_case_output", 
    "description": "Internal description for what this tests"
  }
]
```

### Complete Test Cases (All Tests Combined)
```json
"testCases": [
  // All sampleTests + hiddenTests combined
  // Used for final scoring
]
```

## Input/Output Format Rules

### JavaScript Examples
```json
{
  "input": "[1,2,3], 6", // Multiple args: comma-separated
  "expectedOutput": "[1,2]", // Array as JSON string
}
```

### Python Examples  
```json
{
  "input": "[1,2,3,4,5]", // List input
  "expectedOutput": "[5,4,3,2,1]", // List output
}
```

### String Inputs
```json
{
  "input": "\"hello world\"", // Quoted strings
  "expectedOutput": "\"dlrow olleh\"",
}
```

### Boolean/Number Outputs
```json
{
  "input": "\"()[]{}\"",
  "expectedOutput": "true", // Boolean as string
}
```

## Function Signatures by Language

### JavaScript
```javascript
"signature": "function twoSum(nums, target) {\n    // Your code here\n    return [];\n}"
```

### Python
```python
"signature": "def two_sum(nums, target):\n    # Your code here\n    pass"
```

### Java
```java
"signature": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[]{};\n    }\n}"
```

## Example Categories

### 1. Array Problems
- Two Sum, Three Sum
- Maximum Subarray
- Merge Intervals

### 2. String Problems  
- Valid Parentheses
- Longest Palindrome
- Anagram Detection

### 3. Linked List Problems
- Reverse Linked List
- Merge Two Lists
- Cycle Detection

### 4. Tree Problems
- Binary Tree Traversal
- Maximum Depth
- Validate BST

### 5. Dynamic Programming
- Climbing Stairs
- Coin Change
- Longest Common Subsequence

## Test Case Best Practices

### Sample Tests (2-3 tests)
- Basic happy path case
- One edge case (empty input, single element)
- One typical case from examples

### Hidden Tests (3-7 tests)
- Edge cases (null, empty, single element)
- Boundary conditions (min/max values)
- Performance cases (large inputs)
- Corner cases specific to the problem

### Input Validation
- Always use proper JSON format for complex data
- Quote strings properly
- Arrays as JSON arrays: `[1,2,3]`
- Objects as JSON objects: `{"key": "value"}`

## Common Patterns

### Array Input with Target
```json
{
  "input": "[2,7,11,15], 9",
  "expectedOutput": "[0,1]"
}
```

### String Processing
```json
{
  "input": "\"racecar\"",
  "expectedOutput": "true"
}
```

### Multiple Return Values
```json
{
  "input": "[1,2,3,4,5]",
  "expectedOutput": "[1,5,2,4,3]" // Rearranged array
}
```

## Difficulty Guidelines

### Easy (300-600 seconds)
- Basic array/string manipulation
- Simple algorithms
- Direct implementation

### Medium (600-1200 seconds)  
- Multiple step solutions
- Basic data structures
- Some optimization required

### Hard (1200+ seconds)
- Complex algorithms
- Advanced data structures
- Multiple optimization strategies

## Validation Checklist

✅ **Required Fields**
- id, title, description
- At least 1 sampleTest
- Function signature matches functionName
- Input/output formats are consistent

✅ **Test Coverage**
- Happy path covered
- Edge cases included  
- Invalid inputs handled
- Performance cases tested

✅ **Format Consistency**
- All inputs use same parameter order
- All outputs use same data type format
- JSON syntax is valid

✅ **Difficulty Appropriate**
- Time limits match complexity
- Test cases match difficulty level
- Examples are clear and helpful