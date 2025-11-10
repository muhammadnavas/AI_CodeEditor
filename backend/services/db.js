const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function connectToDB(mongoUri) {
  if (client && db) return { client, db };
  if (!mongoUri) throw new Error('MONGO_URI not provided');

  client = new MongoClient(mongoUri, {
    // useUnifiedTopology is default in newer drivers
  });

  await client.connect();
  // Allow an optional DB name via env (MONGO_DB_NAME), fallback to default
  const dbName = process.env.MONGO_DB_NAME || 'ai_code_editor';
  db = client.db(dbName);
  return { client, db };
}

// Helper: transform queries so searches for normalized.candidateId also match top-level candidateId
function transformQuery(query) {
  if (!query || typeof query !== 'object') return query;
  // If the caller is searching for normalized.candidateId, also check candidateId at top-level
  if (Object.prototype.hasOwnProperty.call(query, 'normalized.candidateId')) {
    const v = query['normalized.candidateId'];
    return { $or: [{ 'normalized.candidateId': v }, { 'candidateId': v }] };
  }
  return query;
}

// Normalize documents coming from different collection shapes into a consistent `normalized` field
function normalizeDoc(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  if (doc.normalized) return doc; // already in expected shape

  // Handle enhanced structure: candidateId, candidateName, codingAssessment with multi-language support
  const candidateId = doc.candidateId || (doc.normalized && doc.normalized.candidateId) || null;
  const candidateName = doc.candidateName || (doc.normalized && doc.normalized.candidateName) || null;
  const codingAssessment = doc.codingAssessment || doc.normalized || {};
  
  // Extract additional candidate info
  const position = doc.position || '';
  const experience = doc.experience || '';
  const skills = doc.skills || [];
  const languages = doc.languages || [];
  const projects = doc.projects || [];

  // Handle multiple question source formats
  let questionsRaw = codingAssessment.questions || doc.questions || doc.codingQuestions || [];

  const questions = Array.isArray(questionsRaw) ? questionsRaw.map((q, idx) => {
    // Handle enhanced question format with multi-language signatures
    const question = {
      id: q.id || q.questionId || `q_${idx}`,
      title: q.title || q.name || q.prompt || `Question ${idx + 1}`,
      description: q.description || q.prompt || '',
      difficulty: q.difficulty || codingAssessment.difficulty || doc.difficulty || 'medium',
      timeLimit: q.timeLimit || codingAssessment.timePerQuestion || doc.timePerQuestion || 300,
      functionName: q.functionName || extractFunctionNameFromTitle(q.title),
      constraints: q.constraints || 'Standard constraints apply',
      expectedComplexity: q.expectedComplexity || q.complexity || 'To be determined',
      examples: q.examples || [],
      sampleTests: q.sampleTests || [],
      hiddenTests: q.hiddenTests || [],
      testCases: q.testCases || [],
      metadata: q.metadata || {}
    };

    // Handle multi-language signatures
    if (q.signatures && typeof q.signatures === 'object') {
      question.signatures = q.signatures;
      question.language = codingAssessment.language || doc.language || 'javascript';
      question.signature = q.signatures[question.language] || q.signatures.javascript || '';
    } else {
      // Single language or legacy format
      question.language = (q.language || codingAssessment.language || doc.language || 'javascript').toLowerCase();
      question.signature = q.signature || q.signatureTemplate || generateSignatureFromTitle(q.title, question.language);
      
      // Create signatures object from single signature
      question.signatures = {
        [question.language]: question.signature
      };
    }

    // Handle codingQuestions format (simpler structure) - generate missing test data
    if (q.id && q.title && q.description && (!q.sampleTests || q.sampleTests.length === 0) && (!q.testCases || q.testCases.length === 0)) {
      const basicTests = generateBasicTestsFromDescription(q.title, q.description, q.example);
      question.sampleTests = basicTests.sampleTests;
      question.hiddenTests = basicTests.hiddenTests;
      question.testCases = basicTests.testCases;
      question.metadata = { 
        originalFormat: 'codingQuestions',
        example: q.example || '',
        ...question.metadata 
      };
    }

    // Normalize test case formats
    question.sampleTests = (question.sampleTests || []).map(st => ({
      input: st.input !== undefined ? st.input : st.inputValues || st.args || null,
      expectedOutput: st.expected !== undefined ? st.expected : (st.expectedOutput !== undefined ? st.expectedOutput : st.output),
      description: st.description || 'Sample test case'
    }));

    question.hiddenTests = (question.hiddenTests || []).map(ht => ({
      input: ht.input !== undefined ? ht.input : ht.inputValues || ht.args || null,
      expectedOutput: ht.expected !== undefined ? ht.expected : (ht.expectedOutput !== undefined ? ht.expectedOutput : ht.output),
      description: ht.description || 'Hidden test case'
    }));

    question.testCases = (question.testCases || []).map(tc => ({
      input: tc.input !== undefined ? tc.input : tc.inputValues || tc.args || null,
      expectedOutput: tc.expected !== undefined ? tc.expected : (tc.expectedOutput !== undefined ? tc.expectedOutput : tc.output),
      description: tc.description || 'Test case'
    }));

    return question;
  }) : [];

  const normalized = {
    candidateId,
    candidateName,
    position,
    experience,
    skills,
    languages,
    projects,
    timePerQuestion: codingAssessment.timePerQuestion || doc.timePerQuestion || 300,
    difficulty: codingAssessment.difficulty || doc.difficulty || 'medium',
    language: codingAssessment.language || doc.language || 'javascript',
    questions
  };

  return Object.assign({}, doc, { normalized });
}

// Helper function to generate basic tests from question description
function generateBasicTestsFromDescription(title, description, example) {
  const tests = {
    sampleTests: [],
    hiddenTests: [],
    testCases: []
  };

  // Parse example if provided
  if (example) {
    try {
      const lines = example.split('\n');
      let input = null, output = null;
      
      for (const line of lines) {
        if (line.toLowerCase().includes('input:')) {
          input = line.split(':').slice(1).join(':').trim();
        } else if (line.toLowerCase().includes('output:')) {
          output = line.split(':').slice(1).join(':').trim();
        }
      }
      
      if (input && output) {
        const testCase = {
          input: input,
          expectedOutput: output,
          description: 'Example from problem description'
        };
        tests.sampleTests.push(testCase);
        tests.testCases.push(testCase);
      }
    } catch (e) {
      console.warn('Failed to parse example:', e.message);
    }
  }

  // Generate some default tests based on common patterns
  if (title.toLowerCase().includes('sum') || title.toLowerCase().includes('two sum')) {
    tests.sampleTests.push({
      input: '[2, 7, 11, 15], 9',
      expectedOutput: '[0, 1]',
      description: 'Basic two sum test'
    });
    tests.hiddenTests.push({
      input: '[3, 2, 4], 6',
      expectedOutput: '[1, 2]',
      description: 'Different numbers'
    });
  } else if (title.toLowerCase().includes('async') || title.toLowerCase().includes('fetch')) {
    tests.sampleTests.push({
      input: '["user/1", "posts/1"]',
      expectedOutput: '{ user: {...}, posts: [...] }',
      description: 'Fetch multiple resources'
    });
  }

  // Ensure we have at least one test
  if (tests.sampleTests.length === 0) {
    tests.sampleTests.push({
      input: 'test_input',
      expectedOutput: 'expected_output',
      description: 'Basic functionality test'
    });
  }

  tests.testCases = [...tests.sampleTests, ...tests.hiddenTests];
  return tests;
}

// Helper to generate function signatures for all languages from title
function generateSignatureFromTitle(title, language = 'javascript') {
  const functionName = extractFunctionNameFromTitle(title);
  
  const signatures = {
    javascript: `/**\n * @param {...} params\n * @return {...}\n */\nfunction ${functionName}() {\n    // Your code here\n}`,
    python: `class Solution:\n    def ${functionName}(self, *args):\n        # Your code here\n        pass`,
    java: `class Solution {\n    public Object ${functionName}() {\n        // Your code here\n        return null;\n    }\n}`,
    cpp: `class Solution {\npublic:\n    auto ${functionName}() {\n        // Your code here\n        return nullptr;\n    }\n};`
  };
  
  // Return specific language or all signatures
  if (language && signatures[language.toLowerCase()]) {
    return signatures[language.toLowerCase()];
  }
  
  return signatures;
}

// Helper to extract function name from title
function extractFunctionNameFromTitle(title) {
  if (!title) return 'solution';
  
  // Common patterns
  if (title.toLowerCase().includes('two sum')) return 'twoSum';
  if (title.toLowerCase().includes('async') && title.toLowerCase().includes('fetch')) return 'fetchData';
  if (title.toLowerCase().includes('palindrome')) return 'isPalindrome';
  if (title.toLowerCase().includes('reverse')) return 'reverseString';
  
  // Default: camelCase the title
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('') || 'solution';
}

function getDb() {
  if (!db) throw new Error('Database not initialized - call connectToDB first');
  return db;
}

function getConfigsCollection() {
  // Try to use the real MongoDB database. If not initialized, fall back to
  // an in-memory list loaded from a local JSON file (useful for local dev
  // when MONGO_URI is not set but you still want to test candidate lookups).
  let database = null;
  try {
    database = getDb();
  } catch (e) {
    database = null;
  }

  const primaryName = process.env.MONGO_CONFIGS_COLLECTION || 'configs';
  const fallbackName = process.env.MONGO_CONFIGS_FALLBACK_COLLECTION || 'candidates';

  let primary = null;
  let fallback = null;
  if (database) {
    primary = database.collection(primaryName);
    fallback = database.collection(fallbackName);
  }

  // Return a light wrapper that keeps the same-call-site shape but
  // will try the primary collection first and fall back to the fallback
  // collection for read operations. Writes go to the primary collection.
  function makeCursor(q) {
    let sortObj = null;
    let limitNum = null;
    return {
      sort(s) { sortObj = s; return this; },
      limit(n) { limitNum = n; return this; },
      async toArray() {
        const qTransformed = transformQuery(q);
        // If database is available, use Mongo cursor semantics
        if (database) {
          let cur = primary.find(qTransformed);
          if (sortObj) cur = cur.sort(sortObj);
          if (limitNum) cur = cur.limit(limitNum);
          let arr = await cur.toArray();
          if (arr && arr.length > 0) return arr.map(normalizeDoc);
          // fallback to fallback collection
          let fcur = fallback.find(qTransformed);
          if (sortObj) fcur = fcur.sort(sortObj);
          if (limitNum) fcur = fcur.limit(limitNum);
          arr = await fcur.toArray();
          return arr.map(normalizeDoc);
        }

        // No DB: read from local sample file or env-provided JSON
        const candidates = loadLocalCandidates();
        let results = candidates.filter(d => matchesQuery(normalizeDoc(d), qTransformed));
        // apply sort if requested (simple single-field sort support)
        if (sortObj && typeof sortObj === 'object') {
          const [[field, order]] = Object.entries(sortObj);
          results.sort((a,b) => {
            const av = getByPath(a, field);
            const bv = getByPath(b, field);
            if (av === bv) return 0;
            return (av < bv ? -1 : 1) * (order === -1 ? -1 : 1);
          });
        }
        if (limitNum && Number.isInteger(limitNum)) results = results.slice(0, limitNum);
        return results.map(normalizeDoc);
      }
    };
  }

  return {
    // findOne: try primary first, then fallback
    async findOne(query, opts) {
      const qTransformed = transformQuery(query);
      if (database) {
        let p = await primary.findOne(qTransformed, opts);
        if (p) return normalizeDoc(p);
        p = await fallback.findOne(qTransformed, opts);
        return p ? normalizeDoc(p) : p;
      }

      const candidates = loadLocalCandidates();
      for (const d of candidates) {
        const nd = normalizeDoc(d);
        if (matchesQuery(nd, qTransformed)) return nd;
      }
      return null;
    },
    // find returns a cursor-like object with chainable sort/limit/toArray
    find(query) {
      return makeCursor(query);
    },
    // insertOne and other write ops target the primary collection (DB required)
    insertOne(doc, opts) {
      if (!database) throw new Error('Database not initialized - cannot perform insert');
      return primary.insertOne(doc, opts);
    },
    insertMany(docs, opts) {
      if (!database) throw new Error('Database not initialized - cannot perform insert');
      return primary.insertMany(docs, opts);
    },
    updateOne(filter, update, opts) {
      if (!database) throw new Error('Database not initialized - cannot perform update');
      return primary.updateOne(filter, update, opts);
    },
    // expose underlying collection names for debugging
    _primaryName: primaryName,
    _fallbackName: fallbackName
  };
}

module.exports = {
  connectToDB,
  getDb,
  getConfigsCollection
};

// --- Helper functions used by the in-memory fallback ---
const fs = require('fs');
const path = require('path');

function loadLocalCandidates() {
  const filePath = process.env.SAMPLE_CANDIDATES_FILE || path.join(__dirname, '..', 'sample_candidates.json');
  try {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    const arr = JSON.parse(content);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn('Failed to load local candidates file:', e && e.message);
    return [];
  }
}

// Very small query matcher: supports simple equality and $or of simple equality
function getByPath(obj, pathStr) {
  if (!pathStr) return undefined;
  const parts = pathStr.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function matchesSimpleQuery(obj, q) {
  // q is like { 'normalized.candidateId': 'CAND_EXAMPLE' }
  if (!q || typeof q !== 'object') return false;
  for (const [k, v] of Object.entries(q)) {
    if (k === '$or' && Array.isArray(v)) {
      return v.some(sub => matchesSimpleQuery(obj, sub));
    }
    const actual = getByPath(obj, k);
    if (actual === undefined) return false;
    if (actual !== v) return false;
  }
  return true;
}

function matchesQuery(doc, query) {
  if (!query) return true;
  return matchesSimpleQuery(doc, query);
}
