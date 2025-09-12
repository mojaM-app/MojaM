import { fileLogger as logger } from '@core';
import { NextFunction, Request, Response } from 'express';
import { StatusCode } from 'status-code-enum';

/**
 * List of known indexing robot user agents
 */
const BLOCKED_USER_AGENTS = [
  // Major search engine robots
  'googlebot',
  'bingbot',
  'slurp', // Yahoo
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'applebot',

  // Internet archives
  'ia_archiver', // Internet Archive
  'archive.org_bot',
  'wayback',

  // SEO/Marketing bots
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'screaming frog',
  'serpstatbot',
  'majestic12',

  // Other crawlers
  'crawler',
  'spider',
  'scraper',
  'bot',
  'curl',
  'wget',
  'python-requests',
  'java/',
  'go-http-client',
  'node-fetch',
  'axios',

  // Monitoring/Security scanners
  'nmap',
  'masscan',
  'nuclei',
  'burp',
  'sqlmap',
  'nikto',
  'dirb',
  'gobuster',
  'wfuzz',
  'hydra',
];

/**
 * List of paths that automatically indicate robots
 */
const BLOCKED_PATHS = [
  '/robots.txt',
  '/sitemap.xml',
  '/sitemap',
  '/.well-known',
  '/favicon.ico',
  '/ads.txt',
  '/security.txt',
];

/**
 * Middleware for blocking indexing robots and crawlers
 * Checks User-Agent and blocks known robots
 */
export const antiRobotMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const userAgent = (req.get('User-Agent') || '').toLowerCase().trim();
  const requestPath = req.path.toLowerCase();
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

  // Skip anti-robot checks for test environments
  const isTestEnvironment =
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test' ||
    process.env.JEST_WORKER_ID !== undefined;

  if (isTestEnvironment) {
    // Add minimal anti-indexing headers for test environment but don't block
    res.set({
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate',
    });
    next();
    return;
  }

  // Check paths typical for robots
  const isBlockedPath = BLOCKED_PATHS.some(path => requestPath.startsWith(path));

  if (isBlockedPath) {
    logger.warn(`Blocked robot request for path: ${requestPath} from IP: ${clientIp} with User-Agent: ${userAgent}`);
    res.status(StatusCode.ClientErrorForbidden).json({
      message: 'Access denied',
      error: 'This resource is not available for automated access',
    });
    return;
  }

  // Check User-Agent
  const isBot = BLOCKED_USER_AGENTS.some(botAgent => userAgent.includes(botAgent.toLowerCase()));

  // Additional checks for empty User-Agent or suspicious patterns
  const isSuspicious =
    !userAgent ||
    userAgent.length < 10 ||
    /^[a-z]+\/[\d\.]+$/.test(userAgent) || // simple pattern like bot/1.0
    userAgent.includes('scan') ||
    userAgent.includes('check') ||
    userAgent.includes('monitor') ||
    userAgent.includes('test');

  if (isBot || isSuspicious) {
    logger.warn(
      `Blocked potential robot/bot request from IP: ${clientIp} with User-Agent: ${userAgent} for path: ${requestPath}`,
    );

    // Return 403 Forbidden for robots
    res.status(StatusCode.ClientErrorForbidden).json({
      message: 'Access denied',
      error: 'Automated access is not permitted',
    });
    return;
  }

  // Add anti-indexing headers to response
  res.set({
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-cache, no-store, must-revalidate, private',
    Pragma: 'no-cache',
    Expires: '0',
  });

  next();
};

/**
 * Middleware specifically for /robots.txt endpoint
 * Returns a response blocking all robots
 */
export const robotsTxtMiddleware = (req: Request, res: Response): void => {
  const robotsContent = `# Robots.txt - Application unavailable for robots
# Access denied for all robots and crawlers

User-agent: *
Disallow: /
Crawl-delay: 86400

# Explicit blocks for major crawlers
User-agent: Googlebot
Disallow: /

User-agent: Bingbot
Disallow: /

User-agent: Slurp
Disallow: /

User-agent: DuckDuckBot
Disallow: /

User-agent: Baiduspider
Disallow: /

User-agent: YandexBot
Disallow: /

User-agent: facebookexternalhit
Disallow: /

User-agent: Twitterbot
Disallow: /

User-agent: LinkedInBot
Disallow: /
`;

  res.set({
    'Content-Type': 'text/plain',
    'Cache-Control': 'public, max-age=86400', // 24 hours cache for robots.txt
    'X-Robots-Tag': 'noindex, nofollow',
  });

  logger.info(`Served robots.txt to IP: ${req.ip} with User-Agent: ${req.get('User-Agent')}`);
  res.send(robotsContent);
};
