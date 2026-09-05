/* ===================================
   ORDER MODEL
   Order Schema for MongoDB
   =================================== */

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    image: String
});

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    guestSessionId: {
        type: String,
        default: null
    },
    items: [orderItemSchema],
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        email: String,
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, default: 'India' }
    },
    payment: {
        method: {
            type: String,
            enum: ['COD', 'Online', 'UPI', 'Card', 'NetBanking'],
            default: 'COD'
        },
        status: {
            type: String,
            enum: ['pending', 'authorized', 'paid', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        transactionId: String,
        amount: {
            type: Number,
            required: true
        },
        // Razorpay-specific fields
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String,
        failureReason: String,
        paidAt: Date
    },
    pricing: {
        subtotal: {
            type: Number,
            required: true
        },
        tax: {
            type: Number,
            required: true
        },
        shipping: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'payment_failed'],
        default: 'pending'
    },
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }],
    trackingInfo: {
        carrier: String,
        trackingNumber: String,
        trackingUrl: String,
        estimatedDelivery: Date
    },
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    notes: String
}, {
    timestamps: true
});

// Indexes for faster queries (orderId already indexed via unique: true)
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Method to update status
orderSchema.methods.updateStatus = async function(newStatus, note = '') {
    this.status = newStatus;
    
    this.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        note
    });
    
    if (newStatus === 'delivered') {
        this.deliveredAt = new Date();
    }
    
    if (newStatus === 'cancelled') {
        this.cancelledAt = new Date();
    }
    
    return await this.save();
};

// Method to mark as paid
orderSchema.methods.markAsPaid = async function(transactionId) {
    this.payment.status = 'completed';
    this.payment.transactionId = transactionId;
    this.payment.paidAt = new Date();
    
    return await this.save();
};

// Method to cancel order
orderSchema.methods.cancelOrder = async function(reason) {
    if (['shipped', 'delivered'].includes(this.status)) {
        throw new Error('Cannot cancel order that has been shipped or delivered');
    }
    
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
    
    this.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: reason
    });
    
    return await this.save();
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = async function(userId) {
    const stats = await this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$pricing.total' },
                averageOrderValue: { $avg: '$pricing.total' }
            }
        }
    ]);
    
    return stats[0] || { totalOrders: 0, totalSpent: 0, averageOrderValue: 0 };
};

// Pre-save hook to add initial status to history
orderSchema.pre('save', function(next) {
    if (this.isNew) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            note: 'Order placed'
        });
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
