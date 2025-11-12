/**
 * Debug Script for Candidate API
 * This script helps debug the 404 error for the candidate endpoint
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection configuration
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'test';
const COLLECTION_NAME = 'shortlistedcandidates';

async function debugCandidateAPI() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGO_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${DB_NAME}`);
    console.log(`📁 Collection: ${COLLECTION_NAME}`);
    
    // Check total documents
    const totalDocs = await collection.countDocuments();
    console.log(`📄 Total documents in collection: ${totalDocs}`);
    
    // Look for the specific candidate ID
    const targetCandidateId = "68f909508b0f083d6bf39efd";
    console.log(`\n🔍 Searching for candidate ID: ${targetCandidateId}`);
    
    // Try different search methods
    console.log('\n1️⃣ Searching by candidateId as ObjectId...');
    try {
      const candidate1 = await collection.findOne({ candidateId: new ObjectId(targetCandidateId) });
      if (candidate1) {
        console.log('✅ Found candidate by candidateId (ObjectId):', candidate1.candidateName);
        console.log('   📧 Email:', candidate1.candidateEmail);
        console.log('   📝 Has coding questions:', !!candidate1.codingAssessment);
      } else {
        console.log('❌ Not found by candidateId (ObjectId)');
      }
    } catch (err) {
      console.log('❌ Error searching by candidateId (ObjectId):', err.message);
    }
    
    console.log('\n2️⃣ Searching by candidateId as string...');
    const candidate2 = await collection.findOne({ candidateId: targetCandidateId });
    if (candidate2) {
      console.log('✅ Found candidate by candidateId (string):', candidate2.candidateName);
      console.log('   📧 Email:', candidate2.candidateEmail);
      console.log('   📝 Has coding questions:', !!candidate2.codingAssessment);
    } else {
      console.log('❌ Not found by candidateId (string)');
    }
    
    console.log('\n3️⃣ Searching by _id...');
    try {
      const candidate3 = await collection.findOne({ _id: new ObjectId(targetCandidateId) });
      if (candidate3) {
        console.log('✅ Found candidate by _id:', candidate3.candidateName);
        console.log('   📧 Email:', candidate3.candidateEmail);
        console.log('   🆔 Actual candidateId:', candidate3.candidateId);
        console.log('   📝 Has coding questions:', !!candidate3.codingAssessment);
      } else {
        console.log('❌ Not found by _id');
      }
    } catch (err) {
      console.log('❌ Error searching by _id:', err.message);
    }
    
    console.log('\n4️⃣ Searching in normalized field...');
    const candidate4 = await collection.findOne({ 'normalized.candidateId': targetCandidateId });
    if (candidate4) {
      console.log('✅ Found candidate by normalized.candidateId:', candidate4.candidateName);
      console.log('   📧 Email:', candidate4.candidateEmail);
      console.log('   📝 Has coding questions:', !!candidate4.codingAssessment);
    } else {
      console.log('❌ Not found by normalized.candidateId');
    }
    
    // List all candidates to see what's available
    console.log('\n📋 All candidates in collection:');
    const allCandidates = await collection.find({}).limit(10).toArray();
    allCandidates.forEach((candidate, index) => {
      console.log(`   ${index + 1}. ${candidate.candidateName || 'No name'}`);
      console.log(`      📧 Email: ${candidate.candidateEmail || 'No email'}`);
      console.log(`      🆔 candidateId: ${candidate.candidateId}`);
      console.log(`      🆔 _id: ${candidate._id}`);
      console.log(`      📝 Has coding: ${!!candidate.codingAssessment}`);
      console.log('');
    });
    
    // Test the actual API query logic
    console.log('\n🔍 Testing API query logic...');
    const apiQuery = { 'normalized.candidateId': targetCandidateId };
    const apiResult1 = await collection.find(apiQuery).sort({ createdAt: -1 }).limit(1).toArray();
    console.log('API query 1 result count:', apiResult1.length);
    
    const apiQuery2 = { candidateId: targetCandidateId };
    const apiResult2 = await collection.find(apiQuery2).sort({ createdAt: -1 }).limit(1).toArray();
    console.log('API query 2 result count:', apiResult2.length);
    
  } catch (error) {
    console.error('❌ Error debugging candidate API:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('🔐 Database connection closed');
    }
  }
}

// Run the debug script
debugCandidateAPI().catch(console.error);