/* ===================================
   ROLE CHECK MIDDLEWARE
   Role-Based Access Control
   =================================== */

// Check if user has required role
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required.' 
            });
        }

        const userRole = req.user.role;

        // Convert single role to array
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!roles.includes(userRole)) {
            return res.status(403).json({ 
                error: `Access denied. Required role: ${roles.join(' or ')}` 
            });
        }

        next();
    };
};

// Check if user is customer
const isCustomer = (req, res, next) => {
    return checkRole(['customer'])(req, res, next);
};

// Check if user is seller
const isSeller = (req, res, next) => {
    return checkRole(['seller'])(req, res, next);
};

// Check if user is salesperson
const isSalesperson = (req, res, next) => {
    return checkRole(['salesperson'])(req, res, next);
};

// Check if user is seller or salesperson
const isSellerOrSalesperson = (req, res, next) => {
    return checkRole(['seller', 'salesperson'])(req, res, next);
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    return checkRole(['admin'])(req, res, next);
};

module.exports = {
    checkRole,
    isCustomer,
    isSeller,
    isSalesperson,
    isSellerOrSalesperson,
    isAdmin
};
