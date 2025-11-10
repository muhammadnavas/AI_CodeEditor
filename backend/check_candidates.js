// Check the candidates collection in test database
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'test';

async function checkCandidatesCollection() {
  let client;
  
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('candidates');
    
    // Get all candidates
    const candidates = await collection.find({}).toArray();
    console.log(`\n📋 Found ${candidates.length} candidates in 'test.candidates' collection:\n`);
    
    candidates.forEach((candidate, index) => {
      console.log(`${index + 1}. Candidate:`);
      console.log(`   📛 Name: ${candidate.candidateName || 'N/A'}`);
      console.log(`   🆔 ID: ${candidate.candidateId || candidate._id}`);
      console.log(`   💼 Position: ${candidate.position || 'N/A'}`);
      console.log(`   📅 Experience: ${candidate.experience || 'N/A'}`);
      
      if (candidate.codingAssessment) {
        console.log(`   📝 Assessment:`);
        console.log(`      - Difficulty: ${candidate.codingAssessment.difficulty || 'N/A'}`);
        console.log(`      - Language: ${candidate.codingAssessment.language || 'N/A'}`);
        console.log(`      - Time per question: ${candidate.codingAssessment.timePerQuestion || 'N/A'} seconds`);
        console.log(`      - Questions: ${candidate.codingAssessment.questions?.length || 0}`);
        
        if (candidate.codingAssessment.questions?.length > 0) {
          candidate.codingAssessment.questions.forEach((q, qIndex) => {
            console.log(`         ${qIndex + 1}. ${q.title || 'Untitled'}`);
            console.log(`            - ID: ${q.id || 'N/A'}`);
            console.log(`            - Difficulty: ${q.difficulty || 'N/A'}`);
            console.log(`            - Has signatures: ${!!q.signatures}`);
            
            if (q.signatures) {
              console.log(`            - Languages: ${Object.keys(q.signatures).join(', ')}`);
            }
            
            console.log(`            - Sample tests: ${q.sampleTests?.length || 0}`);
            console.log(`            - Hidden tests: ${q.hiddenTests?.length || 0}`);
            console.log(`            - Examples: ${q.examples?.length || 0}`);
          });
        }
      } else {
        console.log(`   ❌ No codingAssessment found`);
      }
      console.log(''); // Empty line between candidates
    });
    
    // Specific check for Navas
    const navas = await collection.findOne({ candidateId: '68f909508b0f083d6bf39efd' });
    
    if (navas) {
      console.log('🎯 DETAILED VIEW - Navas Candidate:\n');
      console.log('📋 Basic Info:');
      console.log(`   Name: ${navas.candidateName}`);
      console.log(`   ID: ${navas.candidateId}`);
      console.log(`   Position: ${navas.position}`);
      console.log(`   Skills: ${navas.skills?.join(', ') || 'None listed'}`);
      
      if (navas.codingAssessment?.questions?.length > 0) {
        const firstQuestion = navas.codingAssessment.questions[0];
        console.log('\n📝 First Question Details:');
        console.log(`   Title: ${firstQuestion.title}`);
        console.log(`   Description: ${firstQuestion.description?.substring(0, 100)}...`);
        console.log(`   Function Name: ${firstQuestion.functionName}`);
        
        if (firstQuestion.signatures) {
          console.log('\n💻 Language Signatures:');
          Object.entries(firstQuestion.signatures).forEach(([lang, code]) => {
            console.log(`\n   ${lang.toUpperCase()}:`);
            console.log(`   ${code.split('\n').slice(0, 3).join('\n   ')}`);
            console.log(`   ... (${code.split('\n').length} total lines)`);
          });
        }
        
        if (firstQuestion.sampleTests?.length > 0) {
          console.log('\n🧪 Sample Tests:');
          firstQuestion.sampleTests.forEach((test, idx) => {
            console.log(`   ${idx + 1}. Input: ${test.input}`);
            console.log(`      Expected: ${test.expectedOutput}`);
            console.log(`      Description: ${test.description}`);
          });
        }
      }
    } else {
      console.log('❌ Navas candidate not found with ID: 68f909508b0f083d6bf39efd');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n📡 Connection closed');
    }
  }
}

checkCandidatesCollection().catch(console.error);