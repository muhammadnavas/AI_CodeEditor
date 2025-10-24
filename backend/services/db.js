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

function getDb() {
  if (!db) throw new Error('Database not initialized - call connectToDB first');
  return db;
}

function getConfigsCollection() {
  const database = getDb();
  return database.collection('configs');
}

module.exports = {
  connectToDB,
  getDb,
  getConfigsCollection
};
