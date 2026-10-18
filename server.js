'use strict';

// Load environment variables first
require('dotenv').config();

const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Config
const { validateEnv } = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const { corsOptions } = require('./src/config/cors');
const { generalLimiter } = require('./src/config/rateLimiter');

// Middleware
const errorHandler = require('./src/middleware/errorHandler');

// Routes
const productRoutes = require('./src/routes/product.routes');
const categoryRoutes = require('./src/routes/category.routes');
const cartRoutes = require('./src/routes/cart.routes');
const orderRoutes = require('./src/routes/order.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const contactRoutes = require('./src/routes/contact.routes');
const seoRoutes = require('./src/routes/seo.routes');
const configRoutes = require('./src/routes/config.routes');
const brandRoutes = require('./src/routes/brand.routes');
const testimonialRoutes = require('./src/routes/testimonial.routes');
const bannerRoutes = require('./src/routes/banner.routes');

// Admin Routes
const adminAuthRoutes = require('./src/routes/admin/auth.routes');
const adminProductRoutes = require('./src/routes/admin/product.routes');
const adminOrderRoutes = require('./src/routes/admin/order.routes');
const adminCategoryRoutes = require('./src/routes/admin/category.routes');
const adminBrandRoutes = require('./src/routes/admin/brand.routes');
const adminTestimonialRoutes = require('./src/routes/admin/testimonial.routes');
const adminDashboardRoutes = require('./src/routes/admin/dashboard.routes');
const adminAuditRoutes = require('./src/routes/admin/audit.routes');
const adminConfigRoutes = require('./src/routes/admin/config.routes');
const adminImportRoutes = require('./src/routes/admin/import.routes');
const adminBannerRoutes = require('./src/routes/admin/banner.routes');

// Validate environment variables
validateEnv();

const app = express();

// Trust proxy for reverse proxies (Nginx, Cloudflare, AWS, etc.)
app.set('trust proxy', 1);

// Enforce HTTPS in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    if (!isHttps) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
  }
  next();
});

// ======================
// SECURITY MIDDLEWARE
// ======================

// Security headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
      frameSrc: ["https://api.razorpay.com", "https://checkout.razorpay.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false // Allow loading external images
}));

// CORS
app.use(cors(corsOptions));

// Rate limiting
app.use('/api', generalLimiter);

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Raw body for webhook signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json', limit: '10kb' }));

// NoSQL injection prevention
app.use(mongoSanitize());

// HTTP parameter pollution protection
app.use(hpp({
  whitelist: ['price', 'category', 'brand', 'sort', 'page', 'limit']
}));

// Compression
app.use(compression());

// HTTP request logging (skip in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('short'));
}

// ======================
// STATIC FILES
// ======================
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  etag: true
}));

// ======================
// API ROUTES
// ======================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Public routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/config', configRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/banners', bannerRoutes);

// Admin routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/brands', adminBrandRoutes);
app.use('/api/admin/testimonials', adminTestimonialRoutes);
app.use('/api/admin/banners', adminBannerRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/audit-logs', adminAuditRoutes);
app.use('/api/admin/config', adminConfigRoutes);
app.use('/api/admin/import', adminImportRoutes);

// SEO routes
app.use(seoRoutes);

// ======================
// SPA FALLBACK
// ======================
// Serve index.html for non-API, non-file routes (SPA-style navigation)
app.get('*', (req, res, next) => {
  // Don't intercept API routes or file requests
  if (req.path.startsWith('/api/') || req.path.includes('.')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ======================
// ERROR HANDLING
// ======================
app.use(errorHandler);

// ======================
// SERVER STARTUP
// ======================
const PORT = parseInt(process.env.PORT, 10) || 5000;

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Auto-seed if using memory DB
    if (process.env.USE_MEMORY_DB === 'true' || process.env.NODE_ENV !== 'production') {
      try {
        const Admin = require('./src/models/Admin');
        const count = await Admin.countDocuments();
        if (count === 0) {
          console.log('Memory DB is empty. Auto-seeding...');
          require('child_process').execSync('node src/seed/seed.js --force', { env: { ...process.env, MONGO_URI: require('mongoose').connection.client.s.url } });
        }
      } catch (e) { console.error('Auto-seed failed', e.message); }
    }

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Elite Office Technologies Server`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Port: ${PORT}`);
      console.log(`   URL: http://localhost:${PORT}`);
    });

    // HTTPS servers if certificates exist
    const httpsServers = [];
    const sslKeyPath = process.env.SSL_KEY_PATH || path.join(__dirname, 'ssl', 'key.pem');
    const sslCertPath = process.env.SSL_CERT_PATH || path.join(__dirname, 'ssl', 'cert.pem');

    if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
      try {
        const httpsOptions = {
          key: fs.readFileSync(sslKeyPath),
          cert: fs.readFileSync(sslCertPath)
        };

        // Standard HTTPS on port 443
        try {
          const server443 = https.createServer(httpsOptions, app);
          server443.listen(443, () => {
            console.log(`   HTTPS (Standard): https://localhost`);
          });
          server443.on('error', (err) => {
            console.warn(`   Note: Port 443 not bound (${err.message})`);
          });
          httpsServers.push(server443);
        } catch (e) {}

        // Dedicated dev HTTPS port 5443
        const server5443 = https.createServer(httpsOptions, app);
        server5443.listen(5443, () => {
          console.log(`   HTTPS (Port 5443): https://localhost:5443\n`);
        });
        server5443.on('error', () => {});
        httpsServers.push(server5443);

      } catch (sslErr) {
        console.warn(`⚠️ Failed to start HTTPS server: ${sslErr.message}`);
      }
    } else {
      console.log(`   HTTPS: Ready (add ssl/key.pem and ssl/cert.pem to enable)\n`);
    }

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      httpsServers.forEach(s => {
        try { s.close(); } catch (e) {}
      });
      server.close(async () => {
        try {
          await mongoose.connection.close();
          console.log('MongoDB connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err.message);
          process.exit(1);
        }
      });

      // Force close after 10s
      setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION:', err.message);
      server.close(() => process.exit(1));
    });

  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
