const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'Duplicate field value';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 409);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  const error = new AppError(message, 400);
  error.errors = err.errors;
  return error;
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(err.errors && { errors: err.errors })
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error server-side
  logger.error(err.message, { 
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    
    // Mongoose bad ObjectId
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    // Mongoose duplicate key
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    // Mongoose validation error
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    // JWT errors
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    // Fallback for non-operational errors
    if (!error.isOperational) {
      error = new AppError(error.message, error.statusCode || 500);
      error.isOperational = false;
    }

    sendErrorProd(error, res);
  }
};

module.exports = errorHandler;
