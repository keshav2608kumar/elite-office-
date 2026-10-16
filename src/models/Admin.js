const mongoose = require('mongoose');
const argon2 = require('argon2');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'manager'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  refreshTokens: [{
    token: String,
    createdAt: Date,
    expiresAt: Date
  }]
}, {
  timestamps: true
});

// Indexes (email and username already have unique: true in field definition)

adminSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  try {
    // Assuming password is set temporarily to passwordHash before hashing
    // E.g., admin.passwordHash = 'plaintext_password'
    this.passwordHash = await argon2.hash(this.passwordHash, { type: argon2.argon2id });
    next();
  } catch (error) {
    next(error);
  }
});

adminSchema.methods.verifyPassword = async function(password) {
  try {
    return await argon2.verify(this.passwordHash, password);
  } catch (error) {
    return false;
  }
};

adminSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

adminSchema.methods.incrementLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    // lock expired
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 10) {
      this.lockUntil = Date.now() + 60 * 60 * 1000; // 1 hour
    } else if (this.loginAttempts >= 5) {
      this.lockUntil = Date.now() + 15 * 60 * 1000; // 15 mins
    }
  }
};

adminSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
