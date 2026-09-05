/* ===================================
   AUTHENTICATION MIDDLEWARE
   JWT Token Verification
   =================================== */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                error: 'Access denied. No token provided.' 
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'your-secret-key'
        );

        // Check if user exists
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid token. User not found.' 
            });
        }

        if (!user.isActive) {
            return res.status(403).json({ 
                error: 'Account is deactivated.' 
            });
        }

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            userData: user
        };

        next();

    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired. Please login again.' 
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid token.' 
            });
        }

        res.status(500).json({ 
            error: 'Authentication error.' 
        });
    }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || 'your-secret-key'
            );

            const user = await User.findById(decoded.userId).select('-password');

            if (user && user.isActive) {
                req.user = {
                    userId: decoded.userId,
                    role: decoded.role,
                    userData: user
                };
            }
        }

        next();

    } catch (error) {
        // Continue without authentication
        next();
    }
};

const { checkRole } = require('./roleCheck');

module.exports = {
    authenticateToken,
    optionalAuth,
    checkRole
};
