const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const hasPlaceholderCredentials = (mongoUri) =>
  /<[^>]+>/.test(mongoUri) || mongoUri.includes('db_password') || mongoUri.includes('REPLACE_WITH');

const isLocalMongoUri = (mongoUri) =>
  /^mongodb:\/\/(localhost|127\.0\.0\.1)/i.test(mongoUri) || mongoUri.includes('localhost:27017');

let _memoryServer = null;
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined');
    }

    if (hasPlaceholderCredentials(mongoUri)) {
      // Allow an opt-in in-memory fallback for quick local testing if explicitly enabled.
      if (process.env.ALLOW_MEMORY === 'true') {
        console.warn('⚠️ MONGO_URI contains placeholder credentials. ALLOW_MEMORY=true — starting in-memory MongoDB for testing');
        _memoryServer = await MongoMemoryServer.create();
        const memoryUri = _memoryServer.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`✅ MongoDB Connected (in-memory): ${conn.connection.host}`);
        return;
      }
      throw new Error('MONGO_URI still contains placeholder credentials. Add your Atlas username and password in server/.env, or set ALLOW_MEMORY=true for temporary local testing.');
    }

    if (isLocalMongoUri(mongoUri) && process.env.ALLOW_MEMORY !== 'true') {
      throw new Error('Local MongoDB URIs are disabled by default. Use your Atlas cluster URI in server/.env or set ALLOW_MEMORY=true to allow local Mongo.');
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
