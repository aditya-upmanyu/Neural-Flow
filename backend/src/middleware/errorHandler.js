// backend/src/middleware/errorHandler.js
// Centralized error handling middleware

import logger from '../utils/logger.js';

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, true);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404, true);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, true);
    this.name = 'UnauthorizedError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, true);
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, true);
    this.name = 'ServiceUnavailableError';
  }
}

// Error response formatter
function formatErrorResponse(err, includeStack = false) {
  const response = {
    success: false,
    error: {
      message: err.message,
      type: err.name || 'Error',
      timestamp: err.timestamp || new Date().toISOString(),
    }
  };

  if (err.details) {
    response.error.details = err.details;
  }

  if (err.statusCode) {
    response.error.statusCode = err.statusCode;
  }

  if (includeStack && err.stack) {
    response.error.stack = err.stack.split('\n').slice(0, 5);
  }

  return response;
}

// Main error handling middleware
export function errorHandler(err, req, res, next) {
  // Log the error
  logger.logError(
    `Error in ${req.method} ${req.path}`,
    err,
    {
      component: 'ErrorHandler',
      data: {
        statusCode: err.statusCode || 500,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      }
    }
  );

  // Determine status code
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Send error response
  res.status(statusCode).json(
    formatErrorResponse(err, !isProduction)
  );
}

// 404 handler
export function notFoundHandler(req, res) {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  res.status(404).json(formatErrorResponse(error));
}

// Async error wrapper to catch errors in async route handlers
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Validation helper
export function validate(schema, data) {
  const errors = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }
    
    if (value !== undefined && value !== null) {
      if (rules.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) {
          errors[field] = `${field} must be a number`;
        } else if (rules.min !== undefined && num < rules.min) {
          errors[field] = `${field} must be at least ${rules.min}`;
        } else if (rules.max !== undefined && num > rules.max) {
          errors[field] = `${field} must be at most ${rules.max}`;
        }
      }
      
      if (rules.type === 'string') {
        if (typeof value !== 'string') {
          errors[field] = `${field} must be a string`;
        } else if (rules.minLength && value.length < rules.minLength) {
          errors[field] = `${field} must be at least ${rules.minLength} characters`;
        } else if (rules.maxLength && value.length > rules.maxLength) {
          errors[field] = `${field} must be at most ${rules.maxLength} characters`;
        } else if (rules.pattern && !rules.pattern.test(value)) {
          errors[field] = `${field} has invalid format`;
        }
      }
      
      if (rules.type === 'enum' && rules.values) {
        if (!rules.values.includes(value)) {
          errors[field] = `${field} must be one of: ${rules.values.join(', ')}`;
        }
      }
      
      if (rules.type === 'array') {
        if (!Array.isArray(value)) {
          errors[field] = `${field} must be an array`;
        } else if (rules.minItems && value.length < rules.minItems) {
          errors[field] = `${field} must have at least ${rules.minItems} items`;
        } else if (rules.maxItems && value.length > rules.maxItems) {
          errors[field] = `${field} must have at most ${rules.maxItems} items`;
        }
      }
    }
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }
  
  return true;
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validate,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  RateLimitError,
  ServiceUnavailableError,
};
