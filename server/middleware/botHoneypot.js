const LOCALHOST_IPS = new Set(['::1', '::ffff:127.0.0.1', '127.0.0.1']);

const SAFE_PATHS = new Set([
  '/sitemap.xml',
  '/robots.txt',
  '/favicon.ico',
  '/favicon.svg',
]);

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
];

const SUSPICIOUS_EXTENSIONS = [
  '.php', '.asp', '.aspx', '.jsp', '.xml',
  '.yaml', '.yml', '.map', '.toml', '.tfvars', '.tfstate',
];

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

const isLocalhost = (ip) => {
  return process.env.NODE_ENV !== 'production' && LOCALHOST_IPS.has(ip);
};

const botHoneypot = (req, res, next) => {
  const ip = getClientIP(req);
  if (isLocalhost(ip)) return next();

  const path = req.path.toLowerCase();

  if (SAFE_PATHS.has(path)) return next();

  const isBotPath = OBVIOUS_BOT_PATHS.some(p => path.startsWith(p.toLowerCase()));
  const isSuspiciousExt = SUSPICIOUS_EXTENSIONS.some(ext => path.endsWith(ext));
  const isEnvProbe = path.includes('.env');

  if (isBotPath || isSuspiciousExt || isEnvProbe) {
    return res.status(404).json({ error: 'Not Found' });
  }

  next();
};

module.exports = { botHoneypot, getClientIP };