# Multi-Language Code Editor System - Enhanced Setup Guide

## 🎯 System Overview

Your AI Code Editor now supports **multi-language programming** with enhanced question formats, real-time test execution, and comprehensive candidate assessment capabilities.

### ✨ New Features Added

1. **Multi-Language Support**: JavaScript, Python, Java, C++
2. **Language-Specific Signatures**: Automatic code templates for each language
3. **Enhanced Test Cases**: Sample tests, hidden tests, and comprehensive validation
4. **Real-Time Language Switching**: Switch between languages during coding
5. **Docker-Based Code Execution**: Secure, isolated code execution environment
6. **Enhanced Database Structure**: Support for complex question formats with multi-language signatures

## 🚀 Quick Start Guide

### Step 1: Update Your Database
```bash
# Run the database enhancement script
node enhance_candidate_document.js
```

### Step 2: Start Backend Services
```bash
cd backend
npm install
npm run dev
# Backend will run on http://localhost:5000
```

### Step 3: Start Frontend Services  
```bash
cd frontend
npm install
npm run dev
# Frontend will run on http://localhost:3000
```

### Step 4: Test Your System
```bash
# Run comprehensive system test
node test_complete_system.js
```

### Step 5: Access Your Enhanced Editor
Open: `http://localhost:3000/?candidateId=68f909508b0f083d6bf39efd`

## 📋 Enhanced Question Format

Your questions now support this comprehensive structure:

```json
{
  "id": "two-sum",
  "title": "Two Sum",
  "description": "Problem description...",
  "signatures": {
    "javascript": "function twoSum(nums, target) { /* code */ }",
    "python": "class Solution:\n    def twoSum(self, nums, target):",
    "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {",
    "cpp": "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {"
  },
  "sampleTests": [
    {
      "input": "([2,7,11,15], 9)",
      "expectedOutput": "[0,1]",
      "description": "Basic test case"
    }
  ],
  "hiddenTests": [
    {
      "input": "([3,3], 6)",
      "expectedOutput": "[0,1]", 
      "description": "Hidden validation"
    }
  ],
  "examples": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
    }
  ]
}
```

## 🛠️ System Architecture

### Frontend Components
- **CodeEditor**: Multi-language Monaco editor with syntax highlighting
- **AITestInterface**: Enhanced test interface with language switching
- **Language Selector**: Real-time language switching during assessment

### Backend Services  
- **Enhanced Code Runner**: Docker-based execution for all supported languages
- **Test Case Engine**: Comprehensive test validation with sample/hidden tests
- **Database Service**: Automatic document normalization for different question formats

### Database Structure
- **Candidates Collection**: Enhanced with `codingAssessment` nested structure
- **Multi-Language Signatures**: Each question supports multiple programming languages
- **Comprehensive Test Cases**: Sample tests (visible) and hidden tests (validation)

## 🌐 Multi-Language Features

### Language Switching
- **Real-Time Switching**: Change languages during active coding session
- **Auto-Template Loading**: Automatic function signatures for each language
- **Language-Specific Validation**: Proper syntax checking per language

### Supported Languages

#### JavaScript
```javascript
/**
 * @param {number[]} nums
 * @param {number} target  
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Your code here
};
```

#### Python
```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Your code here
        pass
```

#### Java
```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[0];
    }
}
```

#### C++
```cpp
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
        return {};
    }
};
```

## 🧪 Testing System

### Sample Tests (Visible to Candidates)
- Shown during "Run Code" operation
- Help candidates understand expected behavior
- Provide immediate feedback

### Hidden Tests (Validation Only)
- Run during final submission
- Comprehensive edge case testing
- Ensure solution robustness

### Test Case Format
```json
{
  "input": "([2,7,11,15], 9)",
  "expectedOutput": "[0,1]", 
  "description": "Test description"
}
```

## 🐳 Docker Integration

### Code Execution Environment
- **Isolated Execution**: Each code run in separate Docker container
- **Resource Limits**: Memory, CPU, and time constraints
- **Security**: No network access, read-only filesystem
- **Multi-Language**: Support for all programming languages

### Docker Setup (Optional)
```bash
# Install Docker (if not already installed)
# Pull required images
docker pull node:18-alpine
docker pull python:3.11-alpine  
docker pull openjdk:17-alpine
docker pull gcc:latest
```

## 📊 System Monitoring

### Performance Metrics
- **Response Time**: API response monitoring
- **Code Execution Time**: Per-language execution tracking
- **Test Case Performance**: Sample vs hidden test execution
- **User Experience**: Language switching and editor performance

### Health Checks
```bash
# Check backend health
curl http://localhost:5000/api/test/debug/db-status

# Check candidate availability
curl http://localhost:5000/api/test/candidates

# Verify Docker status  
curl http://localhost:5000/api/code/docker-status
```

## 🔧 Configuration

### Environment Variables
```bash
# Backend Configuration
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=test
MONGO_CONFIGS_COLLECTION=configs
MONGO_CONFIGS_FALLBACK_COLLECTION=candidates
OPENAI_API_KEY=your_openai_key

# Docker Configuration (Optional)
DOCKER_TIMEOUT=30000
DOCKER_MEMORY_LIMIT=128m
DOCKER_CPU_LIMIT=0.5
```

### Database Configuration
- **Primary Collection**: `candidates` (enhanced structure)
- **Results Collection**: `test_results` (assessment results)
- **Configs Collection**: `configs` (system configurations)

## 🚨 Troubleshooting

### Common Issues

#### 1. Candidate Not Found
```bash
# Check database connection
node test_complete_system.js

# Verify candidate exists  
mongo your_database
db.candidates.findOne({candidateId: "68f909508b0f083d6bf39efd"})
```

#### 2. Language Switching Not Working
- Ensure question has `signatures` object with multiple languages
- Check browser console for JavaScript errors
- Verify backend returns proper question structure

#### 3. Code Execution Fails
- Check Docker availability: `docker --version`
- Verify Docker images are pulled
- Check backend logs for execution errors

#### 4. Test Cases Not Running
- Verify question has `sampleTests` and/or `hiddenTests` arrays
- Check test case format matches expected structure
- Review backend logs for test execution errors

### Debug Commands
```bash
# Test database structure
node -e "require('./enhance_candidate_document.js').verifyEnhancedStructure()"

# Test backend APIs
curl -X POST http://localhost:5000/api/test/start-session-by-candidate \
  -H "Content-Type: application/json" \
  -d '{"candidateId": "68f909508b0f083d6bf39efd"}'

# Full system test
node test_complete_system.js
```

## 📈 Advanced Features

### Custom Question Creation
Use the enhanced format to create questions with:
- Multi-language support
- Comprehensive test suites
- Real-world problem scenarios
- Progressive difficulty levels

### Assessment Analytics
- **Language Preferences**: Track candidate language choices
- **Code Quality Metrics**: Analyze solution approaches
- **Performance Analysis**: Execution time and efficiency tracking
- **Test Coverage**: Sample vs hidden test success rates

## 🎯 Next Steps

1. **✅ System Ready**: All components enhanced and tested
2. **🧪 Create More Questions**: Use the enhanced format for additional challenges
3. **📊 Analytics Dashboard**: Consider adding assessment analytics
4. **🔒 Security Hardening**: Implement additional security measures for production
5. **🚀 Scale Deployment**: Deploy to cloud infrastructure for broader usage

## 📞 Support

If you encounter any issues:
1. Run the comprehensive test: `node test_complete_system.js`
2. Check the troubleshooting section above
3. Review system logs for specific error messages
4. Verify all dependencies are properly installed

---

## 🎉 Congratulations!

Your AI Code Editor is now a comprehensive multi-language assessment platform ready for professional technical interviews and coding assessments!