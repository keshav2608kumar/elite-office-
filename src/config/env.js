'use strict';

/**
 * Validates required environment variables at startup.
 * Fails fast with clear error if critical config is missing.
 */
function validateEnv() {
  const required = [
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nCopy .env.example to .env and fill in the required values.\n');
    process.exit(1);
  }

  // Warn about optional but important vars
  const warnings = [];

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    warnings.push('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — payment gateway disabled');
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    warnings.push('SMTP_HOST / SMTP_USER not set — email notifications disabled');
  }

  if (process.env.JWT_SECRET === 'replace-with-random-64-char-string') {
    console.error('\n❌ JWT_SECRET is still set to the default placeholder. Generate a random secret.\n');
    process.exit(1);
  }

  if (process.env.JWT_REFRESH_SECRET === 'replace-with-another-random-64-char-string') {
    console.error('\n❌ JWT_REFRESH_SECRET is still set to the default placeholder. Generate a random secret.\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Configuration warnings:');
    warnings.forEach((w) => console.warn(`   - ${w}`));
    console.warn('');
  }
}

module.exports = { validateEnv };
