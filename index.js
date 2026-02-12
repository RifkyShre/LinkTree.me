const express = require('express');
const path = require('path');
const config = require('./config');
const { kv } = require('@vercel/kv');

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

// In-memory storage replaced with Vercel KV for persistence
// KV Keys:
// - visitors:{ip} -> visitor data object
// - bannedIPs -> JSON array of banned IPs
// - requestCounts:{ip} -> rate limit data object

// Helper functions for KV operations
async function getVisitor(ip) {
    try {
        return await kv.get(`visitors:${ip}`);
    } catch (error) {
        console.error('KV getVisitor error:', error);
        return null;
    }
}

async function setVisitor(ip, data) {
    try {
        await kv.set(`visitors:${ip}`, data);
    } catch (error) {
        console.error('KV setVisitor error:', error);
    }
}

async function getBannedIPs() {
    try {
        const banned = await kv.get('bannedIPs');
        return new Set(banned || []);
    } catch (error) {
        console.error('KV getBannedIPs error:', error);
        return new Set();
    }
}

async function addBannedIP(ip) {
    try {
        const banned = await getBannedIPs();
        banned.add(ip);
        await kv.set('bannedIPs', Array.from(banned));
    } catch (error) {
        console.error('KV addBannedIP error:', error);
    }
}

async function removeBannedIP(ip) {
    try {
        const banned = await getBannedIPs();
        banned.delete(ip);
        await kv.set('bannedIPs', Array.from(banned));
    } catch (error) {
        console.error('KV removeBannedIP error:', error);
    }
}

async function getRequestCount(ip) {
    try {
        return await kv.get(`requestCounts:${ip}`);
    } catch (error) {
        console.error('KV getRequestCount error:', error);
        return null;
    }
}

async function setRequestCount(ip, data) {
    try {
        await kv.set(`requestCounts:${ip}`, data);
    } catch (error) {
        console.error('KV setRequestCount error:', error);
    }
}

async function deleteRequestCount(ip) {
    try {
        await kv.del(`requestCounts:${ip}`);
    } catch (error) {
        console.error('KV deleteRequestCount error:', error);
    }
}

async function getAllVisitorIPs() {
    try {
        const ips = await kv.get('visitorIPs');
        return ips || [];
    } catch (error) {
        console.error('KV getAllVisitorIPs error:', error);
        return [];
    }
}

async function addVisitorIP(ip) {
    try {
        const ips = await getAllVisitorIPs();
        if (!ips.includes(ip)) {
            ips.push(ip);
            await kv.set('visitorIPs', ips);
        }
    } catch (error) {
        console.error('KV addVisitorIP error:', error);
    }
}

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

// Clean up old request count entries every 5 seconds (KV version)
setInterval(async () => {
    try {
        const now = Date.now();
        // Note: In KV implementation, we don't actively clean up old entries
        // as KV handles this automatically. This interval can be removed or
        // modified if needed for other cleanup tasks.
    } catch (error) {
        console.error('Cleanup interval error:', error);
    }
}, 5 * 1000);

// Enable trust proxy for proper IP detection on Vercel
app.set('trust proxy', true);

// Rate limiting middleware - very lenient for legit users
function rateLimiter(req, res, next) {
    // Get real client IP (Vercel forwards it in x-forwarded-for)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers['x-real-ip'] ||
               req.ip ||
               req.connection.remoteAddress ||
               'unknown';
    const now = Date.now();
    
    // Skip rate limiting untuk static files
    const path = req.path;
    if (path.startsWith('/css') || path.startsWith('/js') || 
        path.startsWith('/favicon') || path.startsWith('/img')) {
        return next();
    }
    
    // Check if banned FIRST - even admin IPs can be banned if needed
    getBannedIPs().then(bannedIPs => {
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
        
        // Get request count from KV
        getRequestCount(ip).then(data => {
            if (!data) {
                // First request
                const newData = { count: 1, lastRequest: now, blockedUntil: 0 };
                setRequestCount(ip, newData);
                return next();
            }
            
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
                setRequestCount(ip, data);
                return next();
            }
            
            // Increment count
            data.count++;
            data.lastRequest = now;
            
            // Block only if REALLY excessive (bot behavior) - per second now
            if (data.count > MAX_REQUESTS_PER_SECOND()) {
                data.blockedUntil = now + BLOCK_DURATION();
                setRequestCount(ip, data);
                console.log(`🚫 Rate limit exceeded for IP: ${ip}. Blocked for ${BLOCK_DURATION()/1000} seconds.`);
                return res.status(429).json({
                    error: `Terlalu banyak permintaan per detik. Silakan coba lagi nanti.`,
                    retryAfter: Math.ceil(BLOCK_DURATION() / 1000)
                });
            }
            
            setRequestCount(ip, data);
            next();
        }).catch(error => {
            console.error('Rate limiter error:', error);
            next(); // Continue on error to avoid blocking legit users
        });
    }).catch(error => {
        console.error('Banned IPs check error:', error);
        next(); // Continue on error
    });
}

// Visitor tracking middleware
function trackVisitor(req, res, next) {
    // Get real client IP (Vercel forwards it in x-forwarded-for)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers['x-real-ip'] ||
               req.ip ||
               req.connection.remoteAddress ||
               'unknown';
    
    console.log('Visitor IP detected:', ip, 'Headers:', {
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'req.ip': req.ip
    });
    
    // Only track page visits, not API calls or static files
    if (req.path.startsWith('/admin/') || req.path === '/favicon.ico') {
        return next();
    }
    
    // Get existing visitor data from KV
    getVisitor(ip).then(existingVisitor => {
        if (!existingVisitor) {
            // New visitor
            const visitorData = {
                firstVisit: now,
                lastVisit: now,
                pageViews: 1,
                userAgent: req.headers['user-agent'] || 'Unknown',
                path: req.path
            };
            setVisitor(ip, visitorData);
            addVisitorIP(ip); // Add to IP list
            console.log('New visitor tracked:', ip);
        } else {
            // Existing visitor - update last visit and page views
            existingVisitor.lastVisit = now;
            existingVisitor.pageViews++;
            existingVisitor.path = req.path;
            setVisitor(ip, existingVisitor);
            console.log('Existing visitor updated:', ip, 'pageViews:', existingVisitor.pageViews);
        }
        next();
    }).catch(error => {
        console.error('Visitor tracking error:', error);
        next(); // Continue even if tracking fails
    });
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
app.get('/admin/stats', adminAuth, async (req, res) => {
    try {
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        const oneHourAgo = now - (60 * 60 * 1000);
        
        let totalVisitors = 0;
        let todayVisitors = 0;
        let hourVisitors = 0;
        
        // Get all visitor IPs
        const visitorIPs = await getAllVisitorIPs();
        
        // Fetch visitor data for each IP
        for (const ip of visitorIPs) {
            const visitorData = await getVisitor(ip);
            if (visitorData) {
                totalVisitors++;
                if (visitorData.lastVisit > oneDayAgo) {
                    todayVisitors++;
                }
                if (visitorData.lastVisit > oneHourAgo) {
                    hourVisitors++;
                }
            }
        }
        
        // Get banned IPs count
        const bannedIPs = await getBannedIPs();
        
        res.json({
            totalVisitors,
            todayVisitors,
            hourVisitors,
            bannedCount: bannedIPs.size,
            activeConnections: hourVisitors,
            uptime: process.uptime(),
            rateLimitConfig: rateLimitConfig
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
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

app.get('/admin/visitors', adminAuth, async (req, res) => {
    try {
        const visitorList = [];
        const visitorIPs = await getAllVisitorIPs();
        
        // Fetch data for each visitor IP
        for (const ip of visitorIPs) {
            const visitorData = await getVisitor(ip);
            if (visitorData) {
                visitorList.push({
                    ip,
                    firstVisit: new Date(visitorData.firstVisit).toISOString(),
                    lastVisit: new Date(visitorData.lastVisit).toISOString(),
                    pageViews: visitorData.pageViews,
                    userAgent: visitorData.userAgent.substring(0, 100),
                    currentPage: visitorData.path
                });
            }
        }
        
        // Sort by last visit descending
        visitorList.sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
        
        res.json(visitorList);
    } catch (error) {
        console.error('Admin visitors error:', error);
        res.status(500).json({ error: 'Failed to get visitors' });
    }
});

app.get('/admin/banned', adminAuth, async (req, res) => {
    try {
        const bannedIPs = await getBannedIPs();
        const bannedList = Array.from(bannedIPs);
        res.json(bannedList);
    } catch (error) {
        console.error('Admin banned error:', error);
        res.status(500).json({ error: 'Failed to get banned IPs' });
    }
});

app.post('/admin/ban', adminAuth, async (req, res) => {
    try {
        const ip = req.query.ip;
        if (ip) {
            await addBannedIP(ip);
            console.log(`🔨 IP banned: ${ip}`);
            res.json({ success: true, message: `IP ${ip} telah dibanned` });
        } else {
            res.status(400).json({ error: 'IP parameter required' });
        }
    } catch (error) {
        console.error('Admin ban error:', error);
        res.status(500).json({ error: 'Failed to ban IP' });
    }
});

app.post('/admin/unban', adminAuthBypassBan, async (req, res) => {
    try {
        const ip = req.query.ip;
        const bannedIPs = await getBannedIPs();
        if (ip && bannedIPs.has(ip)) {
            await removeBannedIP(ip);
            console.log(`✅ IP unbanned: ${ip}`);
            res.json({ success: true, message: `IP ${ip} telah diunbanned` });
        } else {
            res.status(400).json({ error: 'IP tidak ditemukan atau tidak dibanned' });
        }
    } catch (error) {
        console.error('Admin unban error:', error);
        res.status(500).json({ error: 'Failed to unban IP' });
    }
});

app.get('/admin/clear-visitors', adminAuth, async (req, res) => {
    try {
        // Get all visitor IPs
        const visitorIPs = await getAllVisitorIPs();
        
        // Delete all visitor data
        for (const ip of visitorIPs) {
            await kv.del(`visitors:${ip}`);
        }
        
        // Clear the visitor IPs list
        await kv.set('visitorIPs', []);
        
        res.json({ success: true, message: 'Visitor data cleared' });
    } catch (error) {
        console.error('Admin clear visitors error:', error);
        res.status(500).json({ error: 'Failed to clear visitors' });
    }
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
