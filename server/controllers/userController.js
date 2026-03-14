const { User, Post, Comment } = require('../models');
const redisService = require('../config/redisCache');
const sequelize = require('../config/connection');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const ERROR_CODES = require('../constants/errorCodes');

// Common user profile query options
const userProfileQueryOptions = {
  attributes: ['username', 'createdAt'],
  include: [
    {
      model: Post,
      attributes: ['id', 'title', 'content', 'excerpt', 'slug', 'createdAt', 'updatedAt'],
      include: [
        {
          model: User,
          attributes: ['username']
        },
        {
          model: Comment,
          attributes: ['id', 'comment_text', 'excerpt', 'createdAt', 'updatedAt'],
          include: [{
            model: User,
            attributes: ['username']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    },
    {
      model: Comment,
      attributes: ['id', 'comment_text', 'excerpt', 'createdAt', 'updatedAt'],
      include: [{
        model: Post,
        attributes: ['id', 'title', 'slug']
      }],
      order: [['createdAt', 'DESC']]
    }
  ]
};

// Helper function to set session data
const setSessionData = (req, userId) => {
  req.session.user_id = userId;
  req.session.logged_in = true;
  req.session.userAgent = req.headers['user-agent'];
  req.session.ipAddress = req.ip || req.connection.remoteAddress;
  req.session.createdAt = Date.now();
};

// Helper function for OAuth - improved username generation
const generateUniqueUsername = async (email, displayName) => {
  let candidates = [];

  if (displayName) {
    const displayNameClean = displayName.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '');
    if (displayNameClean.length >= 3) {
      candidates.push(displayNameClean);
    }
  }

  const emailPrefix = email.split('@')[0]
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, '');
  if (emailPrefix.length >= 3) {
    candidates.push(emailPrefix);
  }

  candidates.push('user');

  for (let baseUsername of candidates) {
    let username = baseUsername;
    let counter = 1;

    if (!(await User.findOne({ where: { username } }))) {
      return username;
    }

    while (counter <= 999) {
      username = `${baseUsername}${counter}`;
      if (!(await User.findOne({ where: { username } }))) {
        return username;
      }
      counter++;
    }
  }

  return `user${Date.now()}`;
};

const userController = {
  // Create new user with session regeneration
  createUser: asyncHandler(async (req, res, next) => {
    const userData = await User.create(req.body);

    await redisService.clearUserProfileCache(userData.username);

    // Regenerate session after user creation to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return next(new AppError(
          'Account created but login failed. Please try logging in.',
          500,
          ERROR_CODES.SESSION_ERROR
        ));
      }

      setSessionData(req, userData.id);

      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return next(new AppError(
            'Account created but login failed. Please try logging in.',
            500,
            ERROR_CODES.SESSION_ERROR
          ));
        }

        res.status(201).json({
          user: userData.get({ plain: true }),
          message: 'User created successfully'
        });
      });
    });
  }),

  // User login with session regeneration and optional "Remember Me"
  login: asyncHandler(async (req, res, next) => {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      throw new AppError(
        'Email and password are required',
        400,
        ERROR_CODES.INVALID_INPUT
      );
    }

    const userData = await User.findOne({
      where: { email }
    });

    if (!userData || !(await userData.checkPassword(password))) {
      throw new AppError(
        'Incorrect email or password',
        401,
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    // Regenerate session ID to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return next(new AppError(
          'Login failed',
          500,
          ERROR_CODES.SESSION_ERROR
        ));
      }

      setSessionData(req, userData.id);

      // Store remember me flag in session
      req.session.rememberMe = rememberMe || false;

      // Optional: Extend session if "Remember Me" is checked
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        console.log(`Extended session for user ${userData.id} (Remember Me)`);
      }

      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return next(new AppError(
            'Login failed',
            500,
            ERROR_CODES.SESSION_ERROR
          ));
        }

        res.json({
          user: userData.get({ plain: true }),
          message: 'Logged in successfully'
        });
      });
    });
  }),

  // User logout
  logout: asyncHandler(async (req, res, next) => {
    if (!req.session.logged_in) {
      throw new AppError(
        'Not logged in',
        400,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return next(new AppError(
          'Logout failed',
          500,
          ERROR_CODES.SESSION_ERROR
        ));
      }

      // Clear the cookie
      res.clearCookie('sessionId', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      res.status(204).end();
    });
  }),

  // Logout from all devices - FIXED VERSION
  logoutAllDevices: asyncHandler(async (req, res, next) => {
    const userId = req.session.user_id;

    if (!userId) {
      throw new AppError(
        'Not logged in',
        401,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Import Redis client
    const { createClient } = require('redis');
    let redisClient;

    try {
      redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      await redisClient.connect();

      // Find all session keys for this user
      const sessionKeys = await redisClient.keys('sess:*');

      // Check each session for this user_id and delete it
      for (const key of sessionKeys) {
        const sessionData = await redisClient.get(key);
        if (sessionData && sessionData.includes(`"user_id":${userId}`)) {
          await redisClient.del(key);
        }
      }

      // Clear current session cookie
      res.clearCookie('sessionId', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      res.json({
        message: 'Logged out from all devices successfully'
      });
    } catch (error) {
      throw error;
    } finally {
      // ✅ ALWAYS close connection, even if error occurs
      if (redisClient && redisClient.isOpen) {
        await redisClient.quit().catch(console.error);
      }
    }
  }),

  // Check session status
  checkSession: asyncHandler(async (req, res) => {
    if (!req.session.user_id) {
      return res.status(204).end();
    }

    const userData = await User.findByPk(req.session.user_id, {
      attributes: ['id', 'username', 'email']
    });

    if (!userData) {
      // User was deleted - destroy session
      req.session.destroy();
      return res.status(204).end();
    }

    res.status(200).json({
      user: userData.get({ plain: true })
    });
  }),


  // Get user profile
  getUserProfile: asyncHandler(async (req, res) => {
    const username = req.params.username;

    if (!username) {
      throw new AppError(
        'Username is required',
        400,
        ERROR_CODES.INVALID_INPUT
      );
    }

    const userData = await User.findOne({
      where: { username },
      ...userProfileQueryOptions
    });

    if (!userData) {
      throw new AppError(
        'No user found with this username',
        404,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    res.json(userData.get({ plain: true }));
  }),

  // Handle Google OAuth callback
  googleCallback: asyncHandler(async (req, res, next) => {
    const { id, emails, photos, displayName } = req.user;
    const email = emails[0].value;

    // Extract return path from state parameter
    let returnPath = '/dashboard';
    try {
      const state = req.query.state || req.session.oauth_state;
      if (state) {
        const decodedState = JSON.parse(atob(state));
        returnPath = decodedState.returnPath || '/dashboard';

        const maxAge = 10 * 60 * 1000;
        if (decodedState.timestamp && (Date.now() - decodedState.timestamp > maxAge)) {
          console.warn('OAuth state parameter expired');
          returnPath = '/dashboard';
        }
      }
      delete req.session.oauth_state;
    } catch (err) {
      console.warn('Failed to decode OAuth state parameter:', err.message);
      returnPath = '/dashboard';
    }

    // Check if user already exists with this Google ID
    let userData = await User.findOne({
      where: {
        oauth_id: id,
        auth_provider: 'google'
      }
    });

    if (!userData) {
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser && existingUser.auth_provider === 'local') {
        await existingUser.update({
          oauth_id: id,
          auth_provider: 'google',
          avatar_url: photos[0]?.value,
          display_name: displayName
        });
        userData = existingUser;
        await redisService.clearUserProfileCache(userData.username);
      } else if (!existingUser) {
        const uniqueUsername = await generateUniqueUsername(email, displayName);

        userData = await User.create({
          username: uniqueUsername,
          email: email,
          auth_provider: 'google',
          oauth_id: id,
          avatar_url: photos[0]?.value,
          display_name: displayName,
          password: null
        });

        await redisService.clearUserProfileCache(userData.username);
      } else {
        throw new AppError(
          'An account with this email already exists',
          400,
          ERROR_CODES.EMAIL_ALREADY_EXISTS
        );
      }
    }

    // Regenerate session ID after OAuth login
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=session_error`);
      }

      setSessionData(req, userData.id);

      req.session.save(() => {
        res.redirect(`${process.env.CLIENT_URL}${returnPath}`);
      });
    });
  }),

  // Handle OAuth failure
  oauthFailure: asyncHandler(async (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_cancelled`);
  })
};

module.exports = userController;