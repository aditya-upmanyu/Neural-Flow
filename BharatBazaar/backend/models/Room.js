/* ===================================
   ROOM MODEL
   Live Shopping Room Schema for MongoDB
   =================================== */

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Room name is required'],
        trim: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    salespersonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'available', 'offline', 'maintenance'],
        default: 'offline'
    },
    currentCustomer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    currentProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null
    },
    sessionStartTime: {
        type: Date,
        default: null
    },
    description: {
        type: String,
        maxlength: 500
    },
    capacity: {
        type: Number,
        default: 1,
        min: 1
    },
    // Session history
    sessions: [{
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        startTime: Date,
        endTime: Date,
        duration: Number, // in minutes
        outcome: {
            type: String,
            enum: ['purchased', 'undecided', 'not_interested']
        }
    }],
    stats: {
        totalSessions: {
            type: Number,
            default: 0
        },
        totalDuration: {
            type: Number,
            default: 0 // in minutes
        },
        conversions: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Indexes for faster queries
roomSchema.index({ sellerId: 1 });
roomSchema.index({ salespersonId: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ currentCustomer: 1 });

// Virtual for current session duration
roomSchema.virtual('currentSessionDuration').get(function() {
    if (this.sessionStartTime) {
        const now = new Date();
        const durationMs = now - this.sessionStartTime;
        return Math.floor(durationMs / 60000); // in minutes
    }
    return 0;
});

// Virtual for conversion rate
roomSchema.virtual('conversionRate').get(function() {
    if (this.stats.totalSessions === 0) return 0;
    return Math.round((this.stats.conversions / this.stats.totalSessions) * 100);
});

// Method to check if room is available
roomSchema.methods.isAvailable = function() {
    return this.status === 'available' && this.currentCustomer === null;
};

// Method to start session
roomSchema.methods.startSession = async function(customerId, productId) {
    if (!this.isAvailable()) {
        throw new Error('Room is not available');
    }
    
    this.status = 'active';
    this.currentCustomer = customerId;
    this.currentProduct = productId;
    this.sessionStartTime = new Date();
    
    return await this.save();
};

// Method to end session
roomSchema.methods.endSession = async function(outcome = 'undecided') {
    if (this.status !== 'active') {
        throw new Error('No active session');
    }
    
    const endTime = new Date();
    const duration = Math.floor((endTime - this.sessionStartTime) / 60000);
    
    // Add to session history
    this.sessions.push({
        customerId: this.currentCustomer,
        productId: this.currentProduct,
        startTime: this.sessionStartTime,
        endTime,
        duration,
        outcome
    });
    
    // Update stats
    this.stats.totalSessions += 1;
    this.stats.totalDuration += duration;
    if (outcome === 'purchased') {
        this.stats.conversions += 1;
    }
    
    // Reset current session
    this.status = 'available';
    this.currentCustomer = null;
    this.currentProduct = null;
    this.sessionStartTime = null;
    
    return await this.save();
};

// Method to get today's sessions
roomSchema.methods.getTodaySessions = function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.sessions.filter(session => 
        session.startTime >= today
    );
};

// Static method to get available rooms
roomSchema.statics.getAvailableRooms = async function() {
    return await this.find({ 
        status: 'available',
        currentCustomer: null
    }).populate('salespersonId', 'name');
};

module.exports = mongoose.model('Room', roomSchema);
