const sanitizeMetadata = (meta) => {
  if (!meta) return meta;
  
  const sanitized = { ...meta };
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'passwordhash'];
  
  const recurse = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        recurse(obj[key]);
      } else if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        obj[key] = '[REDACTED]';
      }
    }
  };
  
  recurse(sanitized);
  return sanitized;
};

const formatLog = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const sanitizedMeta = sanitizeMetadata(meta);
  
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...(sanitizedMeta && Object.keys(sanitizedMeta).length > 0 ? { meta: sanitizedMeta } : {})
  });
};

const logger = {
  info: (message, meta = {}) => {
    console.log(formatLog('INFO', message, meta));
  },
  warn: (message, meta = {}) => {
    console.warn(formatLog('WARN', message, meta));
  },
  error: (message, meta = {}) => {
    console.error(formatLog('ERROR', message, meta));
  },
  security: (message, meta = {}) => {
    console.warn(formatLog('SECURITY', message, meta));
  }
};

module.exports = logger;
