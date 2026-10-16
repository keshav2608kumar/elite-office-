const AuditLog = require('../models/AuditLog');

const createAuditLog = async (...args) => {
  try {
    let req, action, resource, resourceId, metadata;
    
    // Check if first argument is req object (has ip or connection)
    if (args[0] && (args[0].ip || (args[0].connection && args[0].connection.remoteAddress) || args[0].headers)) {
      [req, action, resource, resourceId, metadata] = args;
    } else {
      // Signature used in some controllers: action, resourceId (or actorId), metadata
      [action, resourceId, metadata] = args;
      resource = action.split('_')[0] || 'System'; // Guess resource from action
    }

    const logData = {
      action: action || 'unknown',
      resource: resource || 'System',
      resourceId: resourceId || null,
      metadata: metadata || {},
      ipAddress: req ? (req.ip || (req.connection && req.connection.remoteAddress)) : 'unknown',
      userAgent: req ? (req.headers && req.headers['user-agent']) : 'unknown'
    };

    if (req && req.admin) {
      logData.actor = req.admin._id;
      logData.actorName = req.admin.username;
    }

    await AuditLog.log(logData);
  } catch (error) {
    // Ignore error so it doesn't break the main request
    console.error('AuditLog middleware error:', error);
  }
};

module.exports = { createAuditLog };
