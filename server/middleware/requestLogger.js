const requestLogger = (req, res, next) => {
  // Only log API routes
  if (!req.originalUrl.startsWith('/api/')) {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const ip = req.headers['x-real-ip'] || req.headers['fastly-client-ip'] || req.ip || req.connection.remoteAddress || '-';
    const method = req.method;
    const url = req.originalUrl || req.url;
    const status = res.statusCode;
    const cache = res.locals.cacheStatus;

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