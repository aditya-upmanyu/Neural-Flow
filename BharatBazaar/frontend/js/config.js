/* ===================================
   CONFIGURATION MODULE
   API URLs, Constants, Settings
   =================================== */

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? window.location.origin + '/api' 
    : 'https://your-production-domain.com/api';

// Socket.IO Configuration (for live features)
const SOCKET_URL = window.location.hostname === 'localhost'
    ? window.location.origin
    : 'https://your-production-domain.com';

// WhatsApp Configuration
// These values are fetched from backend /api/config endpoint
const WHATSAPP_CONFIG = {
    businessNumber: '', // Will be loaded from /api/config
    countryCode: '+91'
};

// Payment Gateway Configuration
// These values are fetched from backend /api/config endpoint
const PAYMENT_CONFIG = {
    razorpayKey: '', // Will be loaded from /api/config
    razorpaySecret: '', // Never expose secret to frontend
    currency: 'INR'
};

// Load config from backend
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        PAYMENT_CONFIG.razorpayKey = config.razorpayKeyId || '';
        PAYMENT_CONFIG.currency = config.currency || 'INR';
        WHATSAPP_CONFIG.businessNumber = config.whatsappNumber || '';
    } catch (error) {
        console.warn('Could not load config from backend');
    }
}

// Load config on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', loadConfig);
}

// App Configuration
const APP_CONFIG = {
    name: 'Live Shopping Platform',
    version: '1.0.0',
    supportEmail: 'support@liveshop.com',
    supportPhone: '+91 98765 43210',
    
    // Feature Flags
    features: {
        liveVideo: true,
        whatsappIntegration: true,
        paymentGateway: true,
        analytics: true,
        productReviews: false, // Coming soon
        multiLanguage: false   // Coming soon
    },
    
    // Limits
    limits: {
        maxProductImages: 5,
        maxProductNameLength: 100,
        maxDescriptionLength: 1000,
        maxCartItems: 50,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        maxQueueSize: 100
    },
    
    // Default Values
    defaults: {
        productsPerPage: 12,
        defaultCategory: 'all',
        defaultSortBy: 'name',
        shippingCharge: 0, // Free shipping
        taxRate: 0.18,     // 18% GST
        currency: '₹',
        currencyCode: 'INR'
    }
};

// Image Placeholders
const PLACEHOLDERS = {
    product: 'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=Product+Image',
    avatar: 'https://via.placeholder.com/100x100/1E2340/E8ECFF?text=User',
    logo: 'https://via.placeholder.com/200x60/1E2340/E8ECFF?text=Logo'
};

// Status Messages
const MESSAGES = {
    success: {
        login: 'Login successful! Redirecting...',
        signup: 'Account created successfully!',
        productAdded: 'Product added to cart!',
        productRemoved: 'Product removed from cart',
        orderPlaced: 'Order placed successfully!',
        linkCopied: 'Link copied to clipboard!'
    },
    error: {
        loginFailed: 'Invalid credentials. Please try again.',
        networkError: 'Network error. Please check your connection.',
        notFound: 'Item not found',
        unauthorized: 'Unauthorized access',
        sessionExpired: 'Session expired. Please login again.'
    },
    info: {
        loading: 'Loading...',
        processing: 'Processing...',
        noItems: 'No items found',
        emptyCart: 'Your cart is empty'
    }
};

// Room Status Types
const ROOM_STATUS = {
    ACTIVE: 'active',
    AVAILABLE: 'available',
    OFFLINE: 'offline'
};

// User Roles
const USER_ROLES = {
    CUSTOMER: 'customer',
    SELLER: 'seller',
    SALESPERSON: 'salesperson',
    ADMIN: 'admin'
};

// Product Categories
const PRODUCT_CATEGORIES = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'home', label: 'Home & Living' },
    { value: 'sports', label: 'Sports & Fitness' },
    { value: 'books', label: 'Books' },
    { value: 'toys', label: 'Toys & Games' }
];

// Order Status
const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};

// Validation Patterns
const VALIDATION = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[6-9]\d{9}$/,
    pincode: /^[1-9][0-9]{5}$/,
    password: /^.{6,}$/ // Minimum 6 characters
};

// Local Storage Keys
const STORAGE_KEYS = {
    userToken: 'userToken',
    userRole: 'userRole',
    userName: 'userName',
    userEmail: 'userEmail',
    userPhone: 'userPhone',
    shoppingCart: 'shoppingCart',
    sellerProducts: 'sellerProducts',
    customerQueue: 'customerQueue',
    liveRooms: 'liveRooms',
    generatedLinks: 'generatedLinks',
    sessionHistory: 'sessionHistory',
    lastOrder: 'lastOrder'
};

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_BASE_URL,
        SOCKET_URL,
        WHATSAPP_CONFIG,
        PAYMENT_CONFIG,
        APP_CONFIG,
        PLACEHOLDERS,
        MESSAGES,
        ROOM_STATUS,
        USER_ROLES,
        PRODUCT_CATEGORIES,
        ORDER_STATUS,
        VALIDATION,
        STORAGE_KEYS
    };
}

// Initialize app on load
window.addEventListener('DOMContentLoaded', () => {
    console.log(`${APP_CONFIG.name} v${APP_CONFIG.version} initialized`);
    console.log('API Base URL:', API_BASE_URL);
    console.log('Socket URL:', SOCKET_URL);
});
