/* ===================================
   GUEST SESSION MIDDLEWARE
   Allows customer shopping without login
   =================================== */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function resolveCustomer(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
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
                req.isGuest = false;
                return next();
            }
        }

        const guestSessionId = req.headers['x-guest-session'];

        if (!guestSessionId) {
            return res.status(400).json({
                error: 'Guest session required. Include X-Guest-Session header.'
            });
        }

        req.guestSessionId = guestSessionId;
        req.isGuest = true;
        next();
    } catch (error) {
        const guestSessionId = req.headers['x-guest-session'];

        if (guestSessionId) {
            req.guestSessionId = guestSessionId;
            req.isGuest = true;
            return next();
        }

        return res.status(401).json({ error: 'Invalid or expired session.' });
    }
}

function getCartFilter(req) {
    if (req.user && req.user.userId) {
        return { userId: req.user.userId };
    }

    return { guestSessionId: req.guestSessionId };
}

module.exports = {
    resolveCustomer,
    getCartFilter
};
