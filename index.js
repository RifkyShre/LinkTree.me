const express = require('express');
const path = require('path');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin password for basic authentication
const adminPassword = 'admin123';

// Security headers and caching for best practices
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Caching headers for static assets
    if (req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/img/') || req.path.startsWith('/icons/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (req.path === '/manifest.json' || req.path === '/robots.txt' || req.path === '/sitemap.xml') {
        res.setHeader('Cache-Control', 'public, max-age=86400');
    }
    
    next();
});

// In-memory storage for visitors and banned IPs
const visitors = new Map();
const bannedIPs = new Set();
const requestCounts = new Map();

// Configurable rate limiting settings
let rateLimitConfig = {
    blockDuration: 60 * 1000, // 1 minute block
    maxRequestsPerSecond: 10, // Max 10 requests per second per IP
    windowSize: 1000 // 1 second window
};

// Admin IP whitelist - add your IP here to never get blocked
const ADMIN_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

// Update constants from config
const BLOCK_DURATION = () => rateLimitConfig.blockDuration;
const MAX_REQUESTS_PER_SECOND = () => rateLimitConfig.maxRequestsPerSecond;
const WINDOW_SIZE = () => rateLimitConfig.windowSize;

// Clean up old entries every 5 seconds
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requestCounts.entries()) {
        if (now - data.lastRequest > WINDOW_SIZE()) {
            requestCounts.delete(ip);
        }
    }
}, 5 * 1000);

// Rate limiting middleware - very lenient for legit users
function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Skip rate limiting untuk static files
    const path = req.path;
    if (path.startsWith('/css') || path.startsWith('/js') || 
        path.startsWith('/favicon') || path.startsWith('/img')) {
        return next();
    }
    
    // Check if banned FIRST - even admin IPs can be banned if needed
    if (bannedIPs.has(ip)) {
        return res.status(403).json({
            error: 'Akses ditolak. IP Anda diblokir.',
            contact: 'Hubungi administrator untuk unbanned.'
        });
    }
    
    // Skip for admin IPs (localhost) - but only if not banned
    if (ADMIN_IPS.has(ip)) {
        return next();
    }
    
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { count: 1, lastRequest: now, blockedUntil: 0 });
        return next();
    }
    
    const data = requestCounts.get(ip);
    
    // Check if blocked
    if (now < data.blockedUntil) {
        return res.status(429).json({
            error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
            retryAfter: Math.ceil((data.blockedUntil - now) / 1000)
        });
    }
    
    // Reset count if window passed
    if (now - data.lastRequest > WINDOW_SIZE()) {
        data.count = 1;
        data.lastRequest = now;
        return next();
    }
    
    // Increment count
    data.count++;
    data.lastRequest = now;
    
    // Block only if REALLY excessive (bot behavior) - per second now
    if (data.count > MAX_REQUESTS_PER_SECOND()) {
        data.blockedUntil = now + BLOCK_DURATION();
        console.log(`🚫 Rate limit exceeded for IP: ${ip}. Blocked for ${BLOCK_DURATION()/1000} seconds.`);
        return res.status(429).json({
            error: `Terlalu banyak permintaan per detik. Silakan coba lagi nanti.`,
            retryAfter: Math.ceil(BLOCK_DURATION() / 1000)
        });
    }
    
    next();
}

// Visitor tracking middleware
function trackVisitor(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!visitors.has(ip)) {
        visitors.set(ip, {
            firstVisit: now,
            lastVisit: now,
            pageViews: 0,
            userAgent: req.headers['user-agent'] || 'Unknown',
            path: req.path
        });
    } else {
        const visitor = visitors.get(ip);
        visitor.lastVisit = now;
        visitor.path = req.path;
    }
    
    // Increment page views
    const visitor = visitors.get(ip);
    visitor.pageViews++;
    
    next();
}

// Apply visitor tracking to all routes
app.use(trackVisitor);

// Admin auth middleware
function adminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
        return res.status(401).send('Authentication required');
    }
    
    const auth = new Buffer(authHeader.split(' ')[1], 'base64').toString().split(':');
    const username = auth[0];
    const password = auth[1];
    
    if (username === 'admin' && password === adminPassword) {
        return next();
    }
    
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
    return res.status(401).send('Invalid credentials');
}

// Simple admin auth middleware - bypasses banned IP check for admin access
function adminAuthBypassBan(req, res, next) {
    console.log('adminPassword defined:', typeof adminPassword, adminPassword);
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
        return res.status(401).send('Authentication required');
    }
    
    const auth = new Buffer(authHeader.split(' ')[1], 'base64').toString().split(':');
    const username = auth[0];
    const password = auth[1];
    
    if (username === 'admin' && password === adminPassword) {
        return next();
    }
    
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
    return res.status(401).send('Invalid credentials');
}

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', rateLimiter, (req, res) => {
  res.render('index', { config });
});

// Admin API routes
app.get('/admin/stats', adminAuth, (req, res) => {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);
    
    let totalVisitors = 0;
    let todayVisitors = 0;
    let hourVisitors = 0;
    
    for (const [ip, data] of visitors.entries()) {
        totalVisitors++;
        if (data.lastVisit > oneDayAgo) {
            todayVisitors++;
        }
        if (data.lastVisit > oneHourAgo) {
            hourVisitors++;
        }
    }
    
    res.json({
        totalVisitors,
        todayVisitors,
        hourVisitors,
        bannedCount: bannedIPs.size,
        activeConnections: hourVisitors,
        uptime: process.uptime(),
        rateLimitConfig: rateLimitConfig
    });
});

app.get('/admin/settings', adminAuth, (req, res) => {
    res.json(rateLimitConfig);
});

app.post('/admin/settings', adminAuth, express.json(), (req, res) => {
    const { blockDuration, maxRequestsPerSecond, windowSize } = req.body;
    
    if (typeof blockDuration === 'number' && blockDuration > 0) {
        rateLimitConfig.blockDuration = blockDuration;
    }
    if (typeof maxRequestsPerSecond === 'number' && maxRequestsPerSecond > 0) {
        rateLimitConfig.maxRequestsPerSecond = maxRequestsPerSecond;
    }
    if (typeof windowSize === 'number' && windowSize > 0) {
        rateLimitConfig.windowSize = windowSize;
    }
    
    res.json({ success: true, message: 'Settings updated successfully', config: rateLimitConfig });
});

app.get('/admin/visitors', adminAuth, (req, res) => {
    const visitorList = [];
    for (const [ip, data] of visitors.entries()) {
        visitorList.push({
            ip,
            firstVisit: new Date(data.firstVisit).toISOString(),
            lastVisit: new Date(data.lastVisit).toISOString(),
            pageViews: data.pageViews,
            userAgent: data.userAgent.substring(0, 100),
            currentPage: data.path
        });
    }
    
    // Sort by last visit descending
    visitorList.sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
    
    res.json(visitorList);
});

app.get('/admin/banned', adminAuth, (req, res) => {
    const bannedList = Array.from(bannedIPs);
    res.json(bannedList);
});

app.post('/admin/ban', adminAuth, (req, res) => {
    const ip = req.query.ip;
    if (ip) {
        bannedIPs.add(ip);
        console.log(`🔨 IP banned: ${ip}`);
        res.json({ success: true, message: `IP ${ip} telah dibanned` });
    } else {
        res.status(400).json({ error: 'IP parameter required' });
    }
});

app.post('/admin/unban', adminAuthBypassBan, (req, res) => {
    const ip = req.query.ip;
    if (ip && bannedIPs.has(ip)) {
        bannedIPs.delete(ip);
        console.log(`✅ IP unbanned: ${ip}`);
        res.json({ success: true, message: `IP ${ip} telah diunbanned` });
    } else {
        res.status(400).json({ error: 'IP tidak ditemukan atau tidak dibanned' });
    }
});

app.get('/admin/clear-visitors', adminAuth, (req, res) => {
    visitors.clear();
    res.json({ success: true, message: 'Visitor data cleared' });
});

// Admin panel page - bypasses banned IP check for admin access
app.get('/admin', adminAuthBypassBan, (req, res) => {
    res.render('admin', { config });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
});
