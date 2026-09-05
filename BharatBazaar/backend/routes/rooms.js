/* ===================================
   ROOM ROUTES
   Live Room Management
   =================================== */

const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { authenticateToken, checkRole } = require('../middleware/auth');
const { updateRoomStatus, emitToRoom } = require('../socketserver');

// Get all rooms (seller only)
router.get('/', authenticateToken, checkRole(['seller']), async (req, res) => {
    try {
        const rooms = await Room.find({ sellerId: req.user.userId })
            .populate('salespersonId', 'name email')
            .populate('currentCustomer', 'name phone')
            .sort({ createdAt: -1 });

        res.json({ rooms });

    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ error: 'Server error fetching rooms' });
    }
});

// Get single room
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('salespersonId', 'name email')
            .populate('currentCustomer', 'name phone');

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.json({ room });

    } catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({ error: 'Server error fetching room' });
    }
});

// Create new room (seller only)
router.post('/', authenticateToken, checkRole(['seller']), async (req, res) => {
    try {
        const { name, salespersonId, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Room name is required' });
        }

        const room = new Room({
            name,
            sellerId: req.user.userId,
            salespersonId: salespersonId || null,
            description,
            status: salespersonId ? 'available' : 'offline'
        });

        await room.save();
        await room.populate('salespersonId', 'name email');

        res.status(201).json({
            message: 'Room created successfully',
            room
        });

    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ error: 'Server error creating room' });
    }
});

// Update room (seller only)
router.put('/:id', authenticateToken, checkRole(['seller']), async (req, res) => {
    try {
        const { name, salespersonId, description, status } = req.body;

        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Check ownership
        if (room.sellerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Update fields
        if (name) room.name = name;
        if (salespersonId !== undefined) room.salespersonId = salespersonId;
        if (description !== undefined) room.description = description;
        if (status) room.status = status;

        await room.save();
        await room.populate('salespersonId', 'name email');

        // Update socket status
        updateRoomStatus(room._id, room.status);

        res.json({
            message: 'Room updated successfully',
            room
        });

    } catch (error) {
        console.error('Update room error:', error);
        res.status(500).json({ error: 'Server error updating room' });
    }
});

// Delete room (seller only)
router.delete('/:id', authenticateToken, checkRole(['seller']), async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Check ownership
        if (room.sellerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await Room.findByIdAndDelete(req.params.id);

        res.json({ message: 'Room deleted successfully' });

    } catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({ error: 'Server error deleting room' });
    }
});

// Start session in room
router.post('/:id/start-session', authenticateToken, async (req, res) => {
    try {
        const { customerId, productId } = req.body;

        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        if (room.status !== 'available') {
            return res.status(400).json({ error: 'Room not available' });
        }

        room.status = 'active';
        room.currentCustomer = customerId;
        room.currentProduct = productId;
        room.sessionStartTime = new Date();

        await room.save();

        // Update socket
        updateRoomStatus(room._id, 'active');
        emitToRoom(room._id, 'session-started', {
            customerId,
            productId
        });

        res.json({
            message: 'Session started',
            room
        });

    } catch (error) {
        console.error('Start session error:', error);
        res.status(500).json({ error: 'Server error starting session' });
    }
});

// End session in room
router.post('/:id/end-session', authenticateToken, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        room.status = 'available';
        room.currentCustomer = null;
        room.currentProduct = null;
        room.sessionStartTime = null;

        await room.save();

        // Update socket
        updateRoomStatus(room._id, 'available');
        emitToRoom(room._id, 'session-ended', {});

        res.json({
            message: 'Session ended',
            room
        });

    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({ error: 'Server error ending session' });
    }
});

// Get available rooms for customer
router.get('/available/list', authenticateToken, async (req, res) => {
    try {
        const rooms = await Room.find({ status: 'available' })
            .populate('salespersonId', 'name')
            .limit(10);

        res.json({ rooms });

    } catch (error) {
        console.error('Get available rooms error:', error);
        res.status(500).json({ error: 'Server error fetching available rooms' });
    }
});

module.exports = router;
