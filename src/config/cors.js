'use strict';

/**
 * CORS configuration — strict origin whitelist.
 * In development: allows localhost origins.
 * In production: only allows CLIENT_URL.
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [];

    // Add configured client URL
    if (process.env.CLIENT_URL) {
      allowedOrigins.push(process.env.CLIENT_URL);
    }

    // In development, allow common localhost origins
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push(
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5000'
      );
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
  maxAge: 86400 // 24 hours preflight cache
};

module.exports = { corsOptions };
