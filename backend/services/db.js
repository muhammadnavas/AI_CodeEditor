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

  // Detect shape like your Compass screenshot: top-level candidateId, candidateName, codingAssessment
  const candidateId = doc.candidateId || (doc.normalized && doc.normalized.candidateId) || null;
  const candidateName = doc.candidateName || (doc.normalized && doc.normalized.candidateName) || null;
  const codingAssessment = doc.codingAssessment || doc.normalized || {};

  const questionsRaw = codingAssessment.questions || doc.questions || [];

  const questions = Array.isArray(questionsRaw) ? questionsRaw.map((q, idx) => {
    const sampleTests = (q.sampleTests || q.samples || q.examples || []).map(st => {
      // normalize sample test shape
      return {
        input: st.input !== undefined ? st.input : st.inputValues || st.args || null,
        expectedOutput: st.expected !== undefined ? st.expected : (st.expectedOutput !== undefined ? st.expectedOutput : st.output)
      };
    });

    return {
      id: q.id || q.questionId || `q_${idx}`,
      title: q.title || q.name || q.prompt || `Question ${idx + 1}`,
      description: q.description || q.prompt || '',
      signature: q.signature || q.signatureTemplate || '',
      functionName: q.functionName || null,
      sampleTests,
      hiddenTests: q.hiddenTests || q.hidden || [],
      testCases: q.testCases || q.tests || [],
      constraints: q.constraints || q.constraint || '',
      expectedComplexity: q.expectedComplexity || q.complexity || '',
      difficulty: q.difficulty || codingAssessment.difficulty || 'easy',
      language: (q.language || codingAssessment.language || 'javascript').toLowerCase(),
      timeLimit: q.timeLimit || codingAssessment.timePerQuestion || doc.timePerQuestion || 300,
      metadata: q.metadata || {}
    };
  }) : [];

  const normalized = {
    candidateId,
    candidateName,
    timePerQuestion: codingAssessment.timePerQuestion || doc.timePerQuestion || 300,
    difficulty: codingAssessment.difficulty || doc.difficulty || 'easy',
    questions
  };

  return Object.assign({}, doc, { normalized });
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
