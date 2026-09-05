/* ===================================
   USER MODEL
   User Schema for MongoDB
   =================================== */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit phone number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: ['customer', 'seller', 'salesperson', 'admin'],
        default: 'customer'
    },
    profileImage: {
        type: String,
        default: null
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    // Seller-specific fields
    businessName: {
        type: String,
        trim: true
    },
    businessDescription: String,
    // Salesperson-specific fields
    assignedSellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedRoomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    }
}, {
    timestamps: true
});

// Index for faster queries (email already indexed via unique: true)
userSchema.index({ role: 1 });
userSchema.index({ phone: 1 });

// Virtual for full name
userSchema.virtual('fullProfile').get(function() {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone,
        role: this.role
    };
});

// Method to check if user is seller
userSchema.methods.isSeller = function() {
    return this.role === 'seller';
};

// Method to check if user is customer
userSchema.methods.isCustomer = function() {
    return this.role === 'customer';
};

// Method to check if user is salesperson
userSchema.methods.isSalesperson = function() {
    return this.role === 'salesperson';
};

module.exports = mongoose.model('User', userSchema);
