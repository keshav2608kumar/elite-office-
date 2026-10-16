const Admin = require('../../models/Admin');
const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { createAuditLog } = require('../../middleware/auditLog');

const scrubRefreshTokens = (admin) => {
  if (admin && admin.refreshTokens && Array.isArray(admin.refreshTokens)) {
    // Filter out strings or invalid objects, keeping only valid subdocuments
    admin.refreshTokens = admin.refreshTokens.filter(t => t && typeof t === 'object' && t.token);
  }
};

const generateTokens = (adminId) => {
  const accessToken = jwt.sign({ id: adminId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: adminId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const admin = await Admin.findOne({ email }).select('+passwordHash +loginAttempts +lockUntil');
  scrubRefreshTokens(admin);

  if (!admin) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check lockout
  if (admin.lockUntil && admin.lockUntil > Date.now()) {
    return next(new AppError('Account is temporarily locked. Please try again later', 401));
  }

  const isPasswordCorrect = await argon2.verify(admin.passwordHash, password);

  if (!isPasswordCorrect) {
    admin.loginAttempts += 1;
    if (admin.loginAttempts >= 5) {
      admin.lockUntil = Date.now() + 15 * 60 * 1000; // lock for 15 mins
    }
    await admin.save();

    await createAuditLog('admin_login_failed', admin._id, { email });
    return next(new AppError('Invalid email or password', 401));
  }

  // Reset attempts
  admin.loginAttempts = 0;
  admin.lockUntil = undefined;

  const { accessToken, refreshToken } = generateTokens(admin._id);

  admin.refreshTokens.push({
    token: refreshToken,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  try {
    await admin.save();
  } catch (saveError) {
    return next(new AppError('Authentication failed due to server configuration error', 500));
  }

  await createAuditLog('admin_login', admin._id, { email });

  res.status(200).json({
    status: 'success',
    data: {
      accessToken,
      refreshToken,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    }
  });
});

exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(new AppError('Refresh token is required', 400));
  }

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const admin = await Admin.findById(decoded.id);
  if (admin) scrubRefreshTokens(admin);

  if (!admin || !admin.refreshTokens.some(t => t.token === token)) {
    return next(new AppError('Invalid refresh token', 401));
  }

  // Rotate token
  admin.refreshTokens = admin.refreshTokens.filter(t => t.token !== token);
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(admin._id);
  
  admin.refreshTokens.push({
      token: newRefreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  await admin.save();

  res.status(200).json({
    status: 'success',
    data: {
      accessToken,
      refreshToken: newRefreshToken
    }
  });
});

exports.logout = asyncHandler(async (req, res, next) => {
  const { token } = req.body;
  const admin = req.admin; // populated by auth middleware
  if (admin) scrubRefreshTokens(admin);

  if (admin && token) {
    admin.refreshTokens = admin.refreshTokens.filter(t => t.token !== token);
    await admin.save();
    await createAuditLog('admin_logout', admin._id, {});
  }

  res.status(200).json({ status: 'success' });
});

exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const admin = await Admin.findById(req.admin.id).select('+passwordHash');

  if (!await argon2.verify(admin.passwordHash, currentPassword)) {
    return next(new AppError('Current password is incorrect', 401));
  }

  admin.passwordHash = await argon2.hash(newPassword);
  admin.refreshTokens = []; // invalidate all sessions
  await admin.save();

  await createAuditLog('password_change', admin._id, {});

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully, please login again'
  });
});
