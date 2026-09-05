/* ===================================
   CART MODEL
   Shopping Cart Schema for MongoDB
   =================================== */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        default: 1
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    addedFrom: {
        type: String,
        enum: ['browse', 'live-room', 'wishlist'],
        default: 'browse'
    }
});

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    guestSessionId: {
        type: String,
        sparse: true,
        unique: true
    },
    items: [cartItemSchema],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Method to calculate cart total
cartSchema.methods.calculateTotal = async function() {
    await this.populate('items.productId');
    
    let subtotal = 0;
    
    for (const item of this.items) {
        if (item.productId) {
            subtotal += item.productId.price * item.quantity;
        }
    }
    
    const tax = Math.round(subtotal * 0.18); // 18% tax
    const shipping = 0; // Free shipping
    const total = subtotal + tax + shipping;
    
    return {
        subtotal,
        tax,
        shipping,
        total,
        itemCount: this.items.length
    };
};

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity = 1, addedFrom = 'browse') {
    const existingItemIndex = this.items.findIndex(
        item => item.productId.toString() === productId.toString()
    );
    
    if (existingItemIndex > -1) {
        this.items[existingItemIndex].quantity += quantity;
    } else {
        this.items.push({ productId, quantity, addedFrom });
    }
    
    this.lastUpdated = new Date();
    return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
    this.items = this.items.filter(
        item => item.productId.toString() !== productId.toString()
    );
    this.lastUpdated = new Date();
    return this.save();
};

// Method to update item quantity
cartSchema.methods.updateQuantity = function(productId, quantity) {
    const item = this.items.find(
        item => item.productId.toString() === productId.toString()
    );
    
    if (item) {
        if (quantity <= 0) {
            return this.removeItem(productId);
        }
        item.quantity = quantity;
        this.lastUpdated = new Date();
        return this.save();
    }
    
    return Promise.reject(new Error('Item not found in cart'));
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
    this.items = [];
    this.lastUpdated = new Date();
    return this.save();
};

// Pre-save hook to update lastUpdated
cartSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('Cart', cartSchema);
