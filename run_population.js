#!/usr/bin/env node

/**
 * Simple Database Population Runner
 * Run this script to populate your database with coding questions
 */

console.log('🚀 Starting Database Population...\n');

// Check if this is being run from the correct directory
const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
if (!fs.existsSync(backendDir)) {
  console.error('❌ Error: Please run this script from the AI CodeEditor root directory');
  console.error('   Current directory should contain the "backend" folder');
  process.exit(1);
}

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(backendDir, '.env') });

// Check environment variables
if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI not found in backend/.env file');
  console.error('   Please check your environment configuration');
  process.exit(1);
}

// Run the population script
const { populateDatabase } = require('./populate_coding_questions');

populateDatabase()
  .then(() => {
    console.log('\n✅ All done! Your database is now populated with coding questions.');
    console.log('\n🔗 You can now test the system:');
    console.log('   • Frontend: http://localhost:3000');
    console.log('   • Backend API: http://localhost:3001');
    console.log('   • Test endpoint: http://localhost:3001/api/test/candidates');
  })
  .catch((error) => {
    console.error('\n❌ Population failed:', error.message);
    process.exit(1);
  });