const { createClient } = require('redis');

// Same URL logic as Redis Cache and Rate Limiter
const getRedisUrl = () => {
  if (process.env.REDIS_URL && process.env.REDIS_PASSWORD) {
    const [host, port] = process.env.REDIS_URL.split(':');
    return `redis://:${process.env.REDIS_PASSWORD}@${host}:${port}`;
  }
  return process.env.REDIS_URL || 'redis://localhost:6379';
};

let client = null;

const getSessionRedisClient = async () => {
  if (client) return client;

  client = createClient({
    url: getRedisUrl(),
    legacyMode: false
  });

  client.on('error', (err) => console.log('Redis Session Store Error:', err));
  client.on('connect', () => console.log('Redis Session Store Connected'));

  await client.connect().catch(console.error);
  return client;
};

module.exports = getSessionRedisClient;