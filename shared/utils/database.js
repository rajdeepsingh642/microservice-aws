const mongoose = require('mongoose');
const { Pool } = require('pg');
const redis = require('redis');
const logger = require('./logger');

class DatabaseConnection {
  constructor() {
    this.mongoConnection = null;
    this.postgresPool = null;
    this.redisClient = null;
  }

  async connectMongoDB(uri) {
    try {
      this.mongoConnection = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      logger.info('MongoDB connected successfully');
      return this.mongoConnection;
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async connectPostgres(uri) {
    try {
      this.postgresPool = new Pool({
        connectionString: uri,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      
      // Test connection
      const client = await this.postgresPool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      logger.info('PostgreSQL connected successfully');
      return this.postgresPool;
    } catch (error) {
      logger.error('PostgreSQL connection error:', error);
      throw error;
    }
  }

  async connectRedis(url) {
    try {
      this.redisClient = redis.createClient({
        url: url,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.redisClient.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      await this.redisClient.connect();
      return this.redisClient;
    } catch (error) {
      logger.error('Redis connection error:', error);
      throw error;
    }
  }

  async disconnectAll() {
    try {
      if (this.mongoConnection) {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
      }
      
      if (this.postgresPool) {
        await this.postgresPool.end();
        logger.info('PostgreSQL disconnected');
      }
      
      if (this.redisClient) {
        await this.redisClient.quit();
        logger.info('Redis disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting databases:', error);
      throw error;
    }
  }

  getMongoConnection() {
    return this.mongoConnection;
  }

  getPostgresPool() {
    return this.postgresPool;
  }

  getRedisClient() {
    return this.redisClient;
  }
}

// database.js

module.exports = new DatabaseConnection();
