// Custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Define which errors are expected and shouldn't be logged as errors
  const isExpectedAuthError =
    err.code === 'UNAUTHORIZED' &&
    (req.path === '/api/users/heartbeat' || req.path === '/api/users/logout');

  const isExpectedSessionTimeout =
    err.code === 'SESSION_TIMEOUT' &&
    req.path === '/api/users/logout'; // Logout after timeout is expected

  const isSessionTimeoutOnOtherRoute =
    err.code === 'SESSION_TIMEOUT' &&
    req.path !== '/api/users/logout';

  // Log appropriately based on error type
  if (isExpectedAuthError || isExpectedSessionTimeout) {
    // These are normal - don't log at all
    // Frontend is just cleaning up after expiration
  } else if (isSessionTimeoutOnOtherRoute) {
    // Session timeouts on other routes are informational
    console.info('Session timeout:', {
      path: req.path,
      userId: req.session?.user_id || 'unknown',
      message: err.message
    });
  } else if (err.statusCode >= 500 || !err.statusCode) {
    // Server errors only - log with full detail
    console.error('Error occurred:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.session?.user_id
    });
  }
  // 4xx errors are expected client errors - not logged

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = 'A record with this information already exists';
    code = 'DUPLICATE_ENTRY';
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Referenced resource does not exist';
    code = 'INVALID_REFERENCE';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    code = 'TOKEN_EXPIRED';
  }

  // Don't leak internal errors in production
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    message = 'Something went wrong';
    code = 'INTERNAL_ERROR';
  }

  // Send sanitized error to client
  res.status(statusCode).json({
    message,
    code
  });
};

// Async error wrapper (to avoid try-catch in every controller)
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { errorHandler, asyncHandler, AppError };