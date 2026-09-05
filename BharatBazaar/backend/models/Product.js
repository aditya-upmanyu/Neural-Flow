/* ===================================
   PRODUCT MODEL
   Product Schema for MongoDB
   =================================== */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        minlength: [3, 'Product name must be at least 3 characters'],
        maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['electronics', 'fashion', 'accessories', 'home', 'sports', 'books', 'toys', 'other'],
        lowercase: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    originalPrice: {
        type: Number,
        default: null
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    stock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    images: [{
        type: String,
        required: true
    }],
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Seller ID is required']
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'out_of_stock'],
        default: 'active'
    },
    specifications: {
        type: Map,
        of: String
    },
    features: [{
        type: String
    }],
    tags: [{
        type: String,
        lowercase: true
    }],
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    views: {
        type: Number,
        default: 0
    },
    sales: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for faster queries
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ sellerId: 1 });
productSchema.index({ price: 1 });
productSchema.index({ status: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for computed discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.originalPrice && this.originalPrice > this.price) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
    if (this.stock === 0) return 'out_of_stock';
    if (this.stock < 10) return 'low_stock';
    return 'in_stock';
});

// Method to check if product is available
productSchema.methods.isAvailable = function() {
    return this.status === 'active' && this.stock > 0;
};

// Method to decrease stock
productSchema.methods.decreaseStock = async function(quantity) {
    if (this.stock < quantity) {
        throw new Error('Insufficient stock');
    }
    this.stock -= quantity;
    this.sales += quantity;
    
    if (this.stock === 0) {
        this.status = 'out_of_stock';
    }
    
    return await this.save();
};

// Pre-save hook to update status based on stock
productSchema.pre('save', function(next) {
    if (this.stock === 0) {
        this.status = 'out_of_stock';
    } else if (this.status === 'out_of_stock' && this.stock > 0) {
        this.status = 'active';
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
