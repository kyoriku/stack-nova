const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { createClient } = require('redis');

const getRedisUrl = () => {
  if (process.env.REDIS_URL && process.env.REDIS_PASSWORD) {
    const [host, port] = process.env.REDIS_URL.split(':');
    return `redis://:${process.env.REDIS_PASSWORD}@${host}:${port}`;
  }
  return process.env.REDIS_URL || 'redis://localhost:6379';
};

// Get real client IP, accounting for Fastly proxy
const getClientIP = (req) => {
  const realIP = req.headers['x-real-ip'];
  if (realIP) return realIP.trim();

  const fastlyIP = req.headers['fastly-client-ip'];
  if (fastlyIP) return fastlyIP.trim();

  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[ips.length - 1].trim();
  }

  return req.ip;
};

// Helper function to skip rate limiting for localhost in development
const skipLocalhost = (req) => {
  const isLocalhost = req.ip === '::1' ||
    req.ip === '::ffff:127.0.0.1' ||
    req.ip === '127.0.0.1';

  if (!isLocalhost) return false;
  if (process.env.NODE_ENV === 'production') return false;

  const isTestRequest = req.headers['x-bypass-localhost-whitelist'] === 'true';
  const isTestMode = process.env.TEST_RATE_LIMITS === 'true';

  if (isTestRequest || isTestMode) return false;

  return true;
};

// Create Redis client for rate limiting
const redisClient = createClient({
  url: getRedisUrl(),
  socket: {
    keepAlive: 30000,
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Rate Limiter Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Rate Limiter Connected');
});

if (process.env.NODE_ENV !== 'test') {
  redisClient.connect().catch((err) => {
    console.error('Redis Rate Limiter failed to connect:', err);
  });
}

// Pass commands straight through. rate-limit-redis needs real Redis replies
// (SCRIPT LOAD returns a SHA string, EVALSHA returns an array, etc) - we
// can't fake those, so fail-open happens at the middleware layer below.
const sendCommand = (...args) => redisClient.sendCommand(args);

// Wrap a limiter so it skips entirely when Redis is unavailable.
// Better than 500ing every request during a transient disconnect.
const failOpen = (limiter) => (req, res, next) => {
  if (!redisClient.isReady) return next();
  return limiter(req, res, next);
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: (req) => getClientIP(req),
  skip: skipLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ client: redisClient, prefix: 'rl:api:', sendCommand }),
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests from this IP, please try again later.' });
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  keyGenerator: (req) => getClientIP(req),
  skip: skipLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ client: redisClient, prefix: 'rl:login:', sendCommand }),
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  }
});

const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 25,
  skip: skipLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.session?.user_id ? `user:${req.session.user_id}` : `ip:${req.ip}`,
  store: new RedisStore({ client: redisClient, prefix: 'rl:post:', sendCommand }),
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many posts created. Please try again in an hour.' });
  },
  skipFailedRequests: true
});

const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  skip: skipLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.session?.user_id ? `user:${req.session.user_id}` : `ip:${req.ip}`,
  store: new RedisStore({ client: redisClient, prefix: 'rl:comment:', sendCommand }),
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many comments created. Please try again in an hour.' });
  },
  skipFailedRequests: true
});

const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => getClientIP(req),
  skip: skipLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ client: redisClient, prefix: 'rl:oauth:', sendCommand }),
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many authentication attempts, please try again later.' });
  }
});

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => getClientIP(req),
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ client: redisClient, prefix: 'rl:read:', sendCommand }),
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
  },
  skip: (req) => req.method !== 'GET' || skipLocalhost(req)
});

module.exports = {
  apiLimiter: failOpen(apiLimiter),
  loginLimiter: failOpen(loginLimiter),
  postLimiter: failOpen(postLimiter),
  commentLimiter: failOpen(commentLimiter),
  oauthLimiter: failOpen(oauthLimiter),
  readLimiter: failOpen(readLimiter)
};