'use strict';

const mongoose = require('mongoose');

let mongoServer = null;

/**
 * Connect to MongoDB with retry logic and event handlers.
 * Falls back to in-memory MongoDB if USE_MEMORY_DB=true or if
 * the configured MONGO_URI is unreachable and NODE_ENV=development.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI environment variable is not set.');
  }

  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  // Connection event handlers
  mongoose.connection.on('connected', () => {
    if (mongoServer) {
      console.log('✅ MongoDB connected: In-Memory (development)');
    } else {
      const mode = uri.includes('mongodb+srv') || uri.includes('mongodb.net') ? 'Cloud (Atlas)' : 'Local';
      console.log(`✅ MongoDB connected: ${mode}`);
    }
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    if (!mongoServer) {
      console.warn('MongoDB disconnected.');
    }
  });

  // Use in-memory DB if explicitly requested
  if (process.env.USE_MEMORY_DB === 'true') {
    return await connectMemoryDB(options);
  }

  // Connect with retry
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 3000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri, options);
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt === MAX_RETRIES) {
        // In development, try in-memory fallback
        if (process.env.NODE_ENV !== 'production') {
          console.warn('⚠️  External MongoDB unavailable. Attempting in-memory fallback...');
          try {
            return await connectMemoryDB(options);
          } catch (memErr) {
            throw new Error(
              `Failed to connect to MongoDB after ${MAX_RETRIES} attempts, ` +
              `and in-memory fallback also failed: ${memErr.message}`
            );
          }
        }
        throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts.`);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

async function connectMemoryDB(options) {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const memUri = mongoServer.getUri();
    await mongoose.connect(memUri, options);
    console.log('⚠️  Using in-memory MongoDB — data will NOT persist across restarts.');
  } catch (err) {
    throw new Error(
      'mongodb-memory-server is not installed. Run: npm install mongodb-memory-server --save-dev\n' +
      'Or configure MONGO_URI to point to a running MongoDB instance.'
    );
  }
}

async function disconnectDB() {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

module.exports = { connectDB, disconnectDB };
