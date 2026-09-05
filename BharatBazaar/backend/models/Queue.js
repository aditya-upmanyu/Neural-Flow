/* ===================================
   QUEUE MODEL
   Customer Queue Schema for MongoDB
   =================================== */

const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    status: {
        type: String,
        enum: ['waiting', 'assigned', 'completed', 'cancelled'],
        default: 'waiting'
    },
    assignedRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        default: null
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    assignedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    notes: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Indexes for faster queries
queueSchema.index({ customerId: 1 });
queueSchema.index({ productId: 1 });
queueSchema.index({ status: 1 });
queueSchema.index({ joinedAt: 1 });
queueSchema.index({ assignedRoom: 1 });

// Compound index for finding waiting customers
queueSchema.index({ status: 1, joinedAt: 1 });

// Virtual for wait time in minutes
queueSchema.virtual('waitTime').get(function() {
    if (this.status === 'waiting') {
        const now = new Date();
        const diffMs = now - this.joinedAt;
        return Math.floor(diffMs / 60000); // Convert to minutes
    }
    return 0;
});

// Method to get position in queue
queueSchema.methods.getPosition = async function() {
    const Queue = this.constructor;
    
    const position = await Queue.countDocuments({
        joinedAt: { $lt: this.joinedAt },
        status: 'waiting'
    });
    
    return position + 1;
};

// Method to assign to room
queueSchema.methods.assignToRoom = async function(roomId) {
    this.status = 'assigned';
    this.assignedRoom = roomId;
    this.assignedAt = new Date();
    return await this.save();
};

// Method to complete queue item
queueSchema.methods.complete = async function() {
    this.status = 'completed';
    this.completedAt = new Date();
    return await this.save();
};

// Method to cancel queue item
queueSchema.methods.cancel = async function() {
    this.status = 'cancelled';
    return await this.save();
};

// Static method to get queue length
queueSchema.statics.getQueueLength = async function() {
    return await this.countDocuments({ status: 'waiting' });
};

// Static method to get average wait time
queueSchema.statics.getAverageWaitTime = async function() {
    const completed = await this.find({
        status: { $in: ['assigned', 'completed'] },
        assignedAt: { $ne: null }
    });
    
    if (completed.length === 0) return 0;
    
    const totalWaitTime = completed.reduce((sum, item) => {
        const waitMs = item.assignedAt - item.joinedAt;
        return sum + waitMs;
    }, 0);
    
    return Math.floor(totalWaitTime / completed.length / 60000); // In minutes
};

// Auto-expire old waiting items (24 hours)
queueSchema.pre('save', function(next) {
    if (this.status === 'waiting') {
        const now = new Date();
        const hoursSinceJoined = (now - this.joinedAt) / (1000 * 60 * 60);
        
        if (hoursSinceJoined > 24) {
            this.status = 'cancelled';
        }
    }
    next();
});

module.exports = mongoose.model('Queue', queueSchema);
