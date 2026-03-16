const redisService = require('../config/redisCache');

const CACHE_TTL = 86400; // 24 hours

const cacheMiddleware = async (req, res, next) => {
  try {
    let cacheKey;
    if (req.path.includes('/user/posts')) {
      cacheKey = `user:${req.session.user_id}:posts`;
    } else if (req.path.includes('/edit-post/')) {
      // Log edit-post requests but don't cache them
      cacheKey = `edit-post:${req.params.slug || 'unknown'}`;
    } else if (req.baseUrl.includes('posts')) {
      cacheKey = req.params.slug ? `post:${req.params.slug}` : 'posts:all';
    } else if (req.baseUrl.includes('comments')) {
      cacheKey = `comments:${req.params.postId}`;
    } else if (req.baseUrl.includes('users') && req.path.includes('/profile/')) {
      cacheKey = `user:profile:${req.params.username}`;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('\x1b[35m%s\x1b[0m', `Cache key for request:`, {
        path: req.path,
        baseUrl: req.baseUrl,
        cacheKey,
        method: req.method
      });
    }

    if (!cacheKey) {
      return next();
    }

    const cachedData = await redisService.get(cacheKey);

    if (cachedData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('\x1b[32m%s\x1b[0m', `Cache HIT: ${cacheKey}`);
      }
      res.locals.cacheStatus = 'HIT';
      return res.json(cachedData);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('\x1b[33m%s\x1b[0m', `Cache MISS - Fetching from DB: ${cacheKey}`);
    }
    res.locals.cacheStatus = 'MISS';

    // Store the original json method
    const originalJson = res.json;
    const originalStatus = res.status;

    // Override the status method to track the status code
    res.status = function (code) {
      res._customStatusCode = code;
      return originalStatus.call(this, code);
    };

    // Override the json method
    res.json = function (data) {
      // Only cache successful responses (status code < 400)
      if (!res._customStatusCode || res._customStatusCode < 400) {
        if (process.env.NODE_ENV === 'development') {
          console.log('\x1b[36m%s\x1b[0m', `Caching successful data for: ${cacheKey}`);
        }
        redisService.set(cacheKey, data, CACHE_TTL);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('\x1b[31m%s\x1b[0m', `Not caching error response for: ${cacheKey} (status: ${res._customStatusCode})`);
        }
      }

      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `Cache error: ${error}`);
    next();
  }
};

module.exports = cacheMiddleware;