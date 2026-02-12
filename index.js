const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers and caching for best practices
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://va.vercel-scripts.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://va.vercel-scripts.com"],
    },
  },
}));

// Compression
app.use(compression());

// Caching headers for static assets
app.use((req, res, next) => {
  if (req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/img/') || req.path.startsWith('/icons/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.path === '/manifest.json' || req.path === '/robots.txt' || req.path === '/sitemap.xml') {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  next();
});

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Main route
app.get('/', (req, res) => {
  res.render('index', { config });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
