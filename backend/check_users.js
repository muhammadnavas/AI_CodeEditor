// Check the users collection for candidate data
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'test';

async function checkUsersCollection() {
  let client;
  
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('users');
    
    // Get all users
    const users = await collection.find({}).toArray();
    console.log(`\n📋 Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User:`);
      console.log(`   _id: ${user._id}`);
      console.log(`   candidateId: ${user.candidateId || 'N/A'}`);
      console.log(`   candidateName: ${user.candidateName || user.name || 'N/A'}`);
      console.log(`   Has codingAssessment: ${!!user.codingAssessment}`);
      console.log(`   Has questions: ${!!user.questions}`);
      console.log(`   Has codingQuestions: ${!!user.codingQuestions}`);
      
      if (user.codingAssessment?.questions) {
        console.log(`   Questions count: ${user.codingAssessment.questions.length}`);
      }
      if (user.questions) {
        console.log(`   Direct questions count: ${user.questions.length}`);
      }
      if (user.codingQuestions) {
        console.log(`   Coding questions count: ${user.codingQuestions.length}`);
      }
    });
    
    // Look specifically for Navas
    const navas = await collection.findOne({
      $or: [
        { candidateName: 'Navas' },
        { name: 'Navas' },
        { candidateId: '68f909508b0f083d6bf39efd' }
      ]
    });
    
    if (navas) {
      console.log('\n🎯 Found Navas candidate:');
      console.log(JSON.stringify(navas, null, 2));
    } else {
      console.log('\n❌ Navas candidate not found in users collection');
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

checkUsersCollection().catch(console.error);