/**
 * @author Nishant Sharma
 * @version 2.0.0
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/styleforge';

const mongooseOptions = {
  maxPoolSize: 10,       
  minPoolSize: 2,        
  
  // Timeout settings
  serverSelectionTimeoutMS: 5000, 
  socketTimeoutMS: 45000,         
  connectTimeoutMS: 10000,      
  
  // Retry settings
  retryWrites: true,               
  retryReads: true,                
  
  // Database name
  dbName: 'styleforge',
  
  // Auto index creation
  autoIndex: true,
};

let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number
 * @returns {number} Delay in milliseconds
 */
const getRetryDelay = (attempt) => {
  return Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), 30000); // Max 30 seconds
};

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Connect to MongoDB with retry logic
 * @returns {Promise<mongoose.Connection>} MongoDB connection
 */
export const connectDB = async () => {
  try {
    console.log('\n🔄 Attempting to connect to MongoDB...');
    console.log(`📍 Connection URI: ${MONGODB_URI.replace(/\/\/(.+):(.+)@/, '//*****:*****@')}`);

    // Attempt connection
    const conn = await mongoose.connect(MONGODB_URI, mongooseOptions);

    // Reset retry counter on successful connection
    connectionAttempts = 0;

    console.log('\n✅ ═══════════════════════════════════════════════════════');
    console.log(`   MongoDB Connected Successfully!`);
    console.log(`   📊 Database: ${conn.connection.db.databaseName}`);
    console.log(`   🌐 Host: ${conn.connection.host}`);
    console.log(`   🔌 Port: ${conn.connection.port}`);
    console.log(`   ⚡ Connection State: ${getConnectionState(conn.connection.readyState)}`);
    console.log('✅ ═══════════════════════════════════════════════════════\n');

    return conn.connection;

  } catch (error) {
    connectionAttempts++;
    
    console.error(`\n❌ MongoDB Connection Error (Attempt ${connectionAttempts}/${MAX_RETRY_ATTEMPTS}):`);
    console.error(`   Error: ${error.message}`);

    // Retry logic with exponential backoff
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      const retryDelay = getRetryDelay(connectionAttempts);
      console.log(`⏳ Retrying in ${retryDelay / 1000} seconds...\n`);
      
      await sleep(retryDelay);
      return connectDB(); // Recursive retry
    } else {
      console.error('\n💥 Maximum retry attempts reached. Exiting...\n');
      throw new Error('Failed to connect to MongoDB after maximum retry attempts');
    }
  }
};

/**
 * Disconnect from MongoDB gracefully
 * @returns {Promise<void>}
 */
export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('✅ MongoDB disconnected successfully');
    }
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
    throw error;
  }
};

/**
 * Get human-readable connection state
 * @param {number} state - Mongoose connection state code
 * @returns {string} Human-readable state
 */
const getConnectionState = (state) => {
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };
  return states[state] || 'Unknown';
};

/**
 * Check if database is connected
 * @returns {boolean} Connection status
 */
export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get current connection state
 * @returns {object} Connection state information
 */
export const getConnectionInfo = () => {
  const conn = mongoose.connection;
  return {
    state: getConnectionState(conn.readyState),
    stateCode: conn.readyState,
    host: conn.host,
    port: conn.port,
    database: conn.db?.databaseName,
    connected: isConnected(),
  };
};

mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});


mongoose.connection.on('error', (error) => {
  console.error('❌ Mongoose connection error:', error.message);
});


mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});


process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ Mongoose connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing Mongoose connection:', error.message);
    process.exit(1);
  }
});


mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose reconnected to MongoDB');
});


mongoose.connection.on('reconnectFailed', () => {
  console.error('💥 Mongoose reconnection failed');
});
/**
 * @returns {Promise<void>}
 */
export const clearDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot clear database in production environment');
  }

  try {
    const collections = await mongoose.connection.db.collections();
    
    console.log(`\n🗑️  Clearing ${collections.length} collections...`);
    
    for (const collection of collections) {
      await collection.deleteMany({});
      console.log(`   ✅ Cleared: ${collection.collectionName}`);
    }
    
    console.log('✅ Database cleared successfully\n');
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    throw error;
  }
};

/**
 * @returns {Promise<object>} Database stats
 */
export const getDatabaseStats = async () => {
  try {
    if (!isConnected()) {
      throw new Error('Database not connected');
    }

    const stats = await mongoose.connection.db.stats();
    return {
      database: stats.db,
      collections: stats.collections,
      dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
      indexes: stats.indexes,
      indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`,
      objects: stats.objects,
    };
  } catch (error) {
    console.error('❌ Error getting database stats:', error.message);
    throw error;
  }
};

/**
 * @returns {Promise<boolean>} Connection status
 */
export const pingDatabase = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    return true;
  } catch (error) {
    console.error('❌ Database ping failed:', error.message);
    return false;
  }
};

export default mongoose;
