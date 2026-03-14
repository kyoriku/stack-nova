const { AppError } = require('./errorHandler');
const ERROR_CODES = require('../constants/errorCodes');

// Extract browser family from user agent
const extractBrowserFamily = (ua) => {
  if (!ua) return 'unknown';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera')) return 'Opera';
  return ua.split('/')[0] || 'unknown';
};

// Relaxed session security - checks for major changes only
const sessionSecurity = (req, res, next) => {
  // Skip if not logged in
  if (!req.session.logged_in) {
    return next();
  }

  const currentUserAgent = req.headers['user-agent'];
  const currentIP = req.ip || req.connection.remoteAddress;

  // First request after login - store metadata
  if (!req.session.userAgent || !req.session.ipAddress) {
    req.session.userAgent = currentUserAgent;
    req.session.ipAddress = currentIP;
    return next();
  }

  // Check for major browser changes (not minor version updates)
  const sessionBrowser = extractBrowserFamily(req.session.userAgent);
  const currentBrowser = extractBrowserFamily(currentUserAgent);

  // Only flag if browser family completely changes
  if (sessionBrowser !== currentBrowser) {
    console.warn(
      `Security violation: Browser changed from ${sessionBrowser} to ${currentBrowser}`,
      `for user ${req.session.user_id}`
    );

    req.session.destroy((err) => {
      if (err) console.error('Session destroy error:', err);
    });

    return next(new AppError(
      'Session security check failed. Please log in again.',
      401,
      ERROR_CODES.SESSION_SECURITY_VIOLATION
    ));
  }

  next();
};

module.exports = { sessionSecurity };