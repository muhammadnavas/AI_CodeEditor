// Quick MongoDB Database Explorer
// This script helps us find where your candidate data is stored

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

async function exploreDatabase() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB at:', MONGO_URI);
    
    // List all databases
    const databasesList = await client.db().admin().listDatabases();
    console.log('\n📋 Available Databases:');
    databasesList.databases.forEach(db => {
      console.log(`  - ${db.name} (${Math.round(db.sizeOnDisk / 1024)} KB)`);
    });
    
    // Check common database names
    const commonDbNames = ['test', 'ai_code_editor', 'coding_test', 'interview_system'];
    
    for (const dbName of commonDbNames) {
      console.log(`\n🔍 Checking database: ${dbName}`);
      
      try {
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        
        if (collections.length > 0) {
          console.log(`  📁 Collections in ${dbName}:`);
          for (const col of collections) {
            console.log(`    - ${col.name}`);
            
            // Check if this collection has our candidate
            if (['candidates', 'users', 'configs', 'test_configs'].includes(col.name)) {
              const count = await db.collection(col.name).countDocuments();
              console.log(`      (${count} documents)`);
              
              // Look for our specific candidate
              const candidate = await db.collection(col.name).findOne({
                $or: [
                  { candidateId: '68f909508b0f083d6bf39efd' },
                  { _id: '68f909508b0f083d6bf39efd' },
                  { candidateName: 'Navas' }
                ]
              });
              
              if (candidate) {
                console.log(`      🎯 FOUND CANDIDATE: ${candidate.candidateName || candidate.name || 'Unknown'}`);
                console.log(`         ID: ${candidate.candidateId || candidate._id}`);
                console.log(`         Questions: ${candidate.questions?.length || candidate.codingQuestions?.length || candidate.codingAssessment?.questions?.length || 'Unknown'}`);
              }
            }
          }
        } else {
          console.log(`  (No collections found)`);
        }
      } catch (error) {
        console.log(`  ❌ Cannot access database ${dbName}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check your connection string');
    console.log('3. Verify database permissions');
  } finally {
    if (client) {
      await client.close();
      console.log('\n📡 MongoDB connection closed');
    }
  }
}

// Run the exploration
exploreDatabase().catch(console.error);