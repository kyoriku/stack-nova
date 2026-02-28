const redisService = require('../config/redisCache');

const LOCALHOST_IPS = new Set(['::1', '::ffff:127.0.0.1', '127.0.0.1']);

const OBVIOUS_BOT_PATHS = [
  '/.git', '/.env', '/.aws', '/.ssh', '/.config',
  '/.htaccess', '/.DS_Store',
  '/wp-admin', '/wp-login', '/wp-includes', '/wp-content',
  '/wordpress', '/xmlrpc.php',
  '/phpMyAdmin', '/phpmyadmin',
  '/admin',
  '/latest', '/metadata', '/computeMetadata',
  '/backup', '/database', '/dump',
  '/config', '/composer.json', '/package.json',
  '/server.js', '/app.js',
  '/apps/.env', '/services/.env', '/packages/.env',
  '/laravel',
  '/shell', '/c99', '/r57', '/phpinfo',
  '/.github', '/.gitlab-ci', '/azure-pipelines',
  '/netlify.toml', '/vercel.json',
  '/terraform', '/.terraform', '/.kube', '/kubernetes',
  '/docker-compose', '/Dockerfile',
  '/app.js.map', '/bundle.js.map', '/main.js.map', '/vendor.js.map'
];

const SUSPICIOUS_EXTENSIONS = [
  '.php', '.asp', '.aspx', '.jsp', '.xml',
  '.yaml', '.yml', '.map', '.toml', '.tfvars', '.tfstate'
];

const getClientIP = (req) => {
  // Fastly sets this to the true client IP at their edge
  const fastlyIP = req.headers['fastly-client-ip'];
  if (fastlyIP) {
    return fastlyIP.trim();
  }

  // Fallback: use rightmost XFF entry (last untrusted proxy)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[ips.length - 1].trim();
  }

  return req.ip;
};

const isLocalhost = (ip) => {
  return process.env.NODE_ENV !== 'production' && LOCALHOST_IPS.has(ip);
};

const isBanned = async (ip) => {
  if (!redisService.isConnected()) return false;
  try {
    const banned = await redisService.get(`badbot:${ip}`);
    return banned !== null;
  } catch (error) {
    console.error('Error checking ban status:', error);
    return false;
  }
};

const getBanDuration = (attemptCount) => {
  if (attemptCount >= 3) return 31536000; // 365 days
  if (attemptCount >= 2) return 7776000;  // 90 days
  if (attemptCount >= 1) return 2592000;  // 30 days
  return 0;
};

const trackSuspiciousActivity = async (ip, path) => {
  if (!redisService.isConnected()) return;
  try {
    const key = `bot_attempts:${ip}`;
    const currentAttempts = parseInt(await redisService.get(key) || '0');
    const newAttempts = currentAttempts + 1;

    const banDuration = getBanDuration(newAttempts);
    const counterTTL = banDuration + 2592000; // ban + 30 day buffer

    await redisService.set(key, newAttempts, counterTTL);

    console.log(`\x1b[33m[SUSPICIOUS]\x1b[0m ${ip} → ${path} (offense #${newAttempts})`);

    if (banDuration > 0) {
      await redisService.set(`badbot:${ip}`, true, banDuration);
      const banDays = Math.round(banDuration / 86400);
      console.log(`\x1b[31m[IP BANNED]\x1b[0m ${ip} banned for ${banDays} days (offense #${newAttempts})`);
    }
  } catch (error) {
    console.error('Error tracking suspicious activity:', error);
  }
};

const checkBannedIP = async (req, res, next) => {
  const ip = getClientIP(req);
  if (isLocalhost(ip)) return next();

  const banned = await isBanned(ip);

  if (banned) {
    const logKey = `blocked_log:${ip}`;
    const alreadyLogged = await redisService.get(logKey);

    if (!alreadyLogged) {
      console.log(`\x1b[31m[BLOCKED]\x1b[0m ${ip} → ${req.path}`);
      await redisService.set(logKey, true, 3600);
    }

    return res.status(404).json({ error: 'Not Found' });
  }

  next();
};

const botHoneypot = async (req, res, next) => {
  const ip = getClientIP(req);
  if (isLocalhost(ip)) return next();

  const path = req.path.toLowerCase();

  const isObviousBot = OBVIOUS_BOT_PATHS.some(botPath =>
    path.startsWith(botPath.toLowerCase())
  );

  const hasSuspiciousExtension = SUSPICIOUS_EXTENSIONS.some(ext =>
    path.endsWith(ext)
  );

  if (isObviousBot || hasSuspiciousExtension) {
    await trackSuspiciousActivity(ip, req.path);
    return res.status(404).json({ error: 'Not Found' });
  }

  next();
};

module.exports = {
  checkBannedIP,
  botHoneypot,
  isBanned,
  trackSuspiciousActivity
};