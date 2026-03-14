const requestLogger = (req, res, next) => {
  // Skip health checks and static assets to keep logs clean
  if (req.path === '/health' || req.path === '/favicon.ico') {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const ip = req.ip || req.connection.remoteAddress || '-';
    const method = req.method;
    const url = req.originalUrl || req.url;
    const status = res.statusCode;
    const cache = res.locals.cacheStatus; // Set by cacheMiddleware

    const parts = [
      `${ip} → ${method} ${url}`,
      `${status}`,
      `${duration}ms`,
    ];

    if (cache) parts.push(cache);

    console.log(parts.join(' | '));
  });

  next();
};

module.exports = requestLogger;