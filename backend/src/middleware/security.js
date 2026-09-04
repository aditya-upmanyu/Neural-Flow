// backend/src/middleware/security.js
// Security middleware including rate limiting, authentication, and input sanitization

import logger from '../utils/logger.js';
import { RateLimitError, UnauthorizedError } from './errorHandler.js';

// Simple in-memory rate limiter
class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute
    this.maxRequests = options.maxRequests || 100;
    this.requests = new Map();
    
    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), this.windowMs);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const filtered = requests.filter(time => now - time < this.windowMs);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }

  check(identifier) {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Filter out old requests
    const recentRequests = requests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...recentRequests) + this.windowMs,
      };
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return {
      allowed: true,
      remaining: this.maxRequests - recentRequests.length,
      resetTime: now + this.windowMs,
    };
  }

  reset(identifier) {
    this.requests.delete(identifier);
  }
}

// Create rate limiters for different endpoints
const rateLimiters = {
  global: new RateLimiter({ windowMs: 60000, maxRequests: 100 }),
  api: new RateLimiter({ windowMs: 60000, maxRequests: 60 }),
  attack: new RateLimiter({ windowMs: 60000, maxRequests: 10 }),
  strict: new RateLimiter({ windowMs: 60000, maxRequests: 20 }),
};

// Rate limiting middleware factory
export function createRateLimiter(limiterName = 'global') {
  return (req, res, next) => {
    const limiter = rateLimiters[limiterName];
    if (!limiter) {
      return next();
    }

    const identifier = req.ip || req.connection.remoteAddress;
    const result = limiter.check(identifier);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limiter.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.allowed) {
      logger.warn(`Rate limit exceeded for ${identifier}`, {
        component: 'RateLimiter',
        data: { limiterName, path: req.path }
      });
      
      throw new RateLimitError(`Too many requests. Please try again after ${new Date(result.resetTime).toISOString()}`);
    }

    next();
  };
}

// API Key authentication middleware
export function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const validApiKey = process.env.API_KEY;

  // If no API key is configured, allow all requests (development mode)
  if (!validApiKey) {
    return next();
  }

  if (!apiKey) {
    throw new UnauthorizedError('API key is required');
  }

  if (apiKey !== validApiKey) {
    logger.warn('Invalid API key attempt', {
      component: 'ApiKeyAuth',
      data: { ip: req.ip, path: req.path }
    });
    throw new UnauthorizedError('Invalid API key');
  }

  next();
}

// Input sanitization
export function sanitizeInput(req, res, next) {
  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    }
  }

  // Sanitize body
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    }
  }

  next();
}

// Request logging middleware
export function requestLogger(req, res, next) {
  const start = Date.now();

  // Log request
  logger.http(`Incoming ${req.method} ${req.path}`, {
    component: 'RequestLogger',
    data: {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
    }
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res.statusCode, duration);
  });

  next();
}

// CORS configuration helper
export function configureCORS(app) {
  app.use((req, res, next) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3001'];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
    }

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
    } else {
      next();
    }
  });
}

// Security headers middleware
export function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  
  // Remove powered-by header
  res.removeHeader('X-Powered-By');
  
  next();
}

// IP whitelist middleware
export function ipWhitelist(allowedIPs = []) {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    const isAllowed = allowedIPs.some(ip => clientIP.includes(ip));

    if (!isAllowed) {
      logger.warn(`Blocked request from unauthorized IP: ${clientIP}`, {
        component: 'IPWhitelist',
        data: { path: req.path }
      });
      throw new UnauthorizedError('IP address not authorized');
    }

    next();
  };
}

export default {
  createRateLimiter,
  apiKeyAuth,
  sanitizeInput,
  requestLogger,
  configureCORS,
  securityHeaders,
  ipWhitelist,
  rateLimiters,
};
