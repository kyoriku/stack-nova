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

  // If not localhost, never skip
  if (!isLocalhost)
    return false;

  // If in production, never skip localhost
  if (process.env.NODE_ENV === 'production')
    return false;

  // In development: check for test header OR environment variable
  // This allows testing without restarting server
  const isTestRequest = req.headers['x-bypass-localhost-whitelist'] === 'true';
  const isTestMode = process.env.TEST_RATE_LIMITS === 'true';

  // Don't skip (apply rate limits) if either test mode is active
  if (isTestRequest || isTestMode)
    return false;

  // Otherwise skip rate limits for localhost in development
  return true;
};

// Create Redis client for rate limiting
const redisClient = createClient({
  url: getRedisUrl(),
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.error('Redis rate limiter: Max retries reached');
        return new Error('Max retries reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Rate Limiter Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Rate Limiter Connected');
});

// Connect to Redis (RedisStore will wait for connection)
if (process.env.NODE_ENV !== 'test') {
  redisClient.connect().catch((err) => {
    console.error('Redis Rate Limiter failed to connect:', err);
  });
}

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  keyGenerator: (req) => getClientIP(req),
  skip: skipLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:',
    sendCommand: (...args) => redisClient.sendCommand(args)
  }),
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.'
    });
  }
});

// Login rate limiter with bot tracking
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 requests per windowMs
  keyGenerator: (req) => getClientIP(req),
  skip: skipLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:login:',
    sendCommand: (...args) => redisClient.sendCommand(args)
  }),
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts. Please try again later.'
    });
  }
});

// Post creation rate limiter
const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 25, // limit each IP to 25 requests per windowMs
  skip: skipLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.session?.user_id ? `user:${req.session.user_id}` : `ip:${req.ip}`;
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:post:',
    sendCommand: (...args) => redisClient.sendCommand(args)
  }),
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many posts created. Please try again in an hour.'
    });
  },
  skipFailedRequests: true
});

// Comment creation rate limiter
const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 requests per windowMs
  skip: skipLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.session?.user_id ? `user:${req.session.user_id}` : `ip:${req.ip}`;
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:comment:',
    sendCommand: (...args) => redisClient.sendCommand(args)
  }),
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many comments created. Please try again in an hour.'
    });
  },
  skipFailedRequests: true
});

// OAuth-specific rate limiting with bot tracking
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  keyGenerator: (req) => getClientIP(req),
  skip: skipLocalhost,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:oauth:',
    sendCommand: (...args) => redisClient.sendCommand(args)
  }),
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.'
    });
  }
});

// Read operations rate limiter
const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (req) => getClientIP(req),
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:read:',
    sendCommand: (...args) => redisClient.sendCommand(args)
  }),
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests. Please slow down.'
    });
  },
  skip: (req) => {
    // Skip for non-GET requests OR localhost in development
    return req.method !== 'GET' || skipLocalhost(req);
  }
});

module.exports = {
  apiLimiter,
  loginLimiter,
  postLimiter,
  commentLimiter,
  oauthLimiter,
  readLimiter
};