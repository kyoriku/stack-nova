const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
const routes = require('./routes');
const healthRoutes = require('./routes/healthRoutes');
const sequelize = require('./config/connection');
const createSessionConfig = require('./config/session');
const getHelmetConfig = require('./config/helmet');
const { apiLimiter, readLimiter } = require('./middleware/rateLimiter');
// const { sessionSecurity, checkInactivity } = require('./middleware/sessionSecurity');
const { checkBannedIP, botHoneypot } = require('./middleware/botHoneypot');
const faviconHeaders = require('./middleware/favicon');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Trust proxy in production
if (isProd) {
  app.set('trust proxy', 1);
}

// CORS configuration
const corsOptions = {
  origin: isProd ? process.env.CLIENT_URL : 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Security headers
app.use(getHelmetConfig(isProd));

// Core middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Health checks (before session)
app.use('/', healthRoutes);

// Initialize session (async)
createSessionConfig(isProd).then((sessionConfig) => {
  app.use(session(sessionConfig));

  // Rate limiting
  app.use(apiLimiter);
  app.use(readLimiter);

  // Dev utilities
  if (!isProd) {
    app.use('/api/dev', require('./routes/devRoutes'));
  }

  // Security checks
  app.use(checkBannedIP);

  // Asset headers
  app.use(faviconHeaders);

  // Static files
  if (isProd) {
    app.use(express.static(path.join(__dirname, '../client/dist')));
  }

  // API routes
  app.use(routes);

  // Bot honeypot
  app.use(botHoneypot);

  // SPA catch-all
  app.get('*', (req, res) => {
    if (isProd) {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    } else {
      res.status(404).json({ error: 'Not Found' });
    }
  });

  // Error handling
  app.use(errorHandler);

  // Start server
  sequelize.sync({ force: false }).then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
      console.log(`Health: http://localhost:${PORT}/health`);
      if (isProd) {
        console.log(`Frontend: ${path.join(__dirname, '../client/dist')}`);
      }
    });
  });
}).catch((err) => {
  console.error('Failed to initialize session:', err);
  process.exit(1);
});