// Database connection configuration using Sequelize
const Sequelize = require('sequelize');

// Configuration for environment variables loaded from .env file
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

// Custom logging function to show query execution time
const customLogger = (sql, timing) => {
  // Only log SELECT queries to avoid clutter (optional)
  if (sql.includes('SELECT')) {
    console.log(`[Query: ${timing}ms] ${sql.substring(0, 100)}...`);
  }
};

// Determine if we should log queries
const shouldLog = process.env.NODE_ENV !== 'production';

// Connection pool configuration to prevent connection exhaustion
const poolConfig = {
  max: 10,          // Maximum number of connections in pool
  min: 2,           // Minimum number of connections in pool
  acquire: 30000,   // Maximum time (ms) to try to get connection before throwing error
  idle: 10000       // Maximum time (ms) that a connection can be idle before being released
};

// Initialize database connection based on environment
// Either using DATABASE_URL for Railway deployment or local credentials for development
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: poolConfig,                           // Add connection pool
    logging: shouldLog ? customLogger : false,  // Only log in development
    benchmark: shouldLog                        // Only benchmark in development
  })
  : new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: 'localhost',
      dialect: 'mysql',
      port: 3306,
      pool: poolConfig,                           // Add connection pool
      logging: shouldLog ? customLogger : false,  // Only log in development
      benchmark: shouldLog                        // Only benchmark in development
    }
  );

// Log which configuration is being used
console.log(`Using ${process.env.DATABASE_URL ? 'Railway' : 'local'} MySQL configuration`);
console.log(`Connection pool: max=${poolConfig.max}, min=${poolConfig.min}`);

// Export Sequelize connection instance for use throughout the application
module.exports = sequelize;