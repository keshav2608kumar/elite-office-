const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'admin_login', 'admin_login_failed', 'admin_logout', 
      'product_create', 'product_update', 'product_delete', 
      'order_status_change', 
      'category_create', 'category_update', 'category_delete', 
      'brand_create', 'brand_update', 'brand_delete', 
      'testimonial_create', 'testimonial_update', 'testimonial_delete', 
      'config_update', 'bulk_import', 'password_change'
    ]
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  actorName: {
    type: String
  },
  resource: {
    type: String
  },
  resourceId: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

auditLogSchema.index({ action: 1 });
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

auditLogSchema.statics.log = async function(data) {
  try {
    const logEntry = new this(data);
    await logEntry.save();
    return logEntry;
  } catch (error) {
    console.error('Audit log failed:', error);
    // Do not throw, audit logging should not break the main flow
  }
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
