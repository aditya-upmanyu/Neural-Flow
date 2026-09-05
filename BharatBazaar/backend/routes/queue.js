/* ===================================
   QUEUE ROUTES
   Customer Queue Management
   =================================== */

const express = require('express');
const router = express.Router();
const Queue = require('../models/Queue');
const { authenticateToken, checkRole } = require('../middleware/auth');
const { broadcastToAll } = require('../socketserver');

// Get all queue items (seller/salesperson only)
router.get('/', authenticateToken, checkRole(['seller', 'salesperson']), async (req, res) => {
    try {
        const queueItems = await Queue.find({ status: 'waiting' })
            .populate('customerId', 'name phone email')
            .populate('productId', 'name price images')
            .sort({ joinedAt: 1 });

        res.json({ queue: queueItems });

    } catch (error) {
        console.error('Get queue error:', error);
        res.status(500).json({ error: 'Server error fetching queue' });
    }
});

// Add customer to queue
router.post('/join', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        // Check if customer already in queue for this product
        const existingQueueItem = await Queue.findOne({
            customerId: req.user.userId,
            productId,
            status: 'waiting'
        });

        if (existingQueueItem) {
            return res.status(400).json({ error: 'Already in queue for this product' });
        }

        const queueItem = new Queue({
            customerId: req.user.userId,
            productId,
            status: 'waiting',
            joinedAt: new Date()
        });

        await queueItem.save();
        await queueItem.populate('customerId', 'name phone email');
        await queueItem.populate('productId', 'name price images');

        // Broadcast to sellers/salespeople
        broadcastToAll('queue-updated', {
            action: 'customer-joined',
            queueItem
        });

        res.status(201).json({
            message: 'Joined queue successfully',
            queueItem,
            position: await getQueuePosition(queueItem._id)
        });

    } catch (error) {
        console.error('Join queue error:', error);
        res.status(500).json({ error: 'Server error joining queue' });
    }
});

// Get customer's queue position
router.get('/my-position', authenticateToken, async (req, res) => {
    try {
        const queueItem = await Queue.findOne({
            customerId: req.user.userId,
            status: 'waiting'
        }).populate('productId', 'name');

        if (!queueItem) {
            return res.json({ inQueue: false });
        }

        const position = await getQueuePosition(queueItem._id);

        res.json({
            inQueue: true,
            queueItem,
            position
        });

    } catch (error) {
        console.error('Get position error:', error);
        res.status(500).json({ error: 'Server error fetching position' });
    }
});

// Assign customer to room (seller/salesperson only)
router.post('/:queueId/assign', authenticateToken, checkRole(['seller', 'salesperson']), async (req, res) => {
    try {
        const { roomId } = req.body;
        const { queueId } = req.params;

        if (!roomId) {
            return res.status(400).json({ error: 'Room ID is required' });
        }

        const queueItem = await Queue.findById(queueId);

        if (!queueItem) {
            return res.status(404).json({ error: 'Queue item not found' });
        }

        queueItem.status = 'assigned';
        queueItem.assignedRoom = roomId;
        await queueItem.save();

        // Broadcast to customer
        broadcastToAll('customer-assigned', {
            customerId: queueItem.customerId,
            roomId
        });

        res.json({
            message: 'Customer assigned to room',
            queueItem
        });

    } catch (error) {
        console.error('Assign customer error:', error);
        res.status(500).json({ error: 'Server error assigning customer' });
    }
});

// Remove customer from queue
router.delete('/:queueId', authenticateToken, checkRole(['seller', 'salesperson']), async (req, res) => {
    try {
        const queueItem = await Queue.findByIdAndDelete(req.params.queueId);

        if (!queueItem) {
            return res.status(404).json({ error: 'Queue item not found' });
        }

        // Broadcast update
        broadcastToAll('queue-updated', {
            action: 'customer-removed',
            queueId: req.params.queueId
        });

        res.json({ message: 'Customer removed from queue' });

    } catch (error) {
        console.error('Remove from queue error:', error);
        res.status(500).json({ error: 'Server error removing from queue' });
    }
});

// Helper function to get queue position
async function getQueuePosition(queueItemId) {
    const queueItem = await Queue.findById(queueItemId);
    if (!queueItem) return 0;

    const position = await Queue.countDocuments({
        joinedAt: { $lt: queueItem.joinedAt },
        status: 'waiting'
    });

    return position + 1;
}

module.exports = router;
