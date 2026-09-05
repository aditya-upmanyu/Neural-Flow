/* ===================================
   SOCKET.IO SERVER
   Live Video & Real-Time Features
   YOUR ORIGINAL CODE INTEGRATED
   =================================== */

const { Server } = require('socket.io');

let io;
let activeRooms = {};

function initialize(server) {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('✅ User connected:', socket.id);

        // Handle reconnection
        socket.on('reconnect', () => {
            console.log('🔄 User reconnected:', socket.id);
        });

        socket.on('reconnect_attempt', () => {
            console.log('🔄 Attempting to reconnect...');
        });

        socket.on('reconnect_failed', () => {
            console.log('❌ Reconnection failed');
        });

        // Buyer starts call
        socket.on('buyer-start', (data) => {
            const { roomId, buyerId } = data;
            activeRooms[roomId] = { buyerId, status: 'waiting', socketId: socket.id };
            socket.join(roomId);
            console.log(`🛒 Buyer ${buyerId} started call in room: ${roomId}`);
            io.to(roomId).emit('incoming-call', { roomId, buyerId });
        });

        // Seller accepts call
        socket.on('seller-accept', (data) => {
            const { roomId, sellerId } = data;
            if (activeRooms[roomId]) {
                activeRooms[roomId].sellerId = sellerId;
                activeRooms[roomId].status = 'active';
            }
            socket.join(roomId);
            console.log(`👨‍💼 Seller ${sellerId} accepted call in room: ${roomId}`);
            io.to(roomId).emit('call-accepted', { sellerId });
        });

        // Join room
        socket.on('join-room', ({ roomId, userId }) => {
            socket.join(roomId);
            console.log(`${userId} joined room: ${roomId}`);
        });

        // WebRTC signaling
        socket.on('offer', ({ roomId, offer }) => {
            socket.to(roomId).emit('offer', offer);
        });

        socket.on('answer', ({ roomId, answer }) => {
            socket.to(roomId).emit('answer', answer);
        });

        socket.on('ice-candidate', ({ roomId, candidate }) => {
            socket.to(roomId).emit('ice-candidate', candidate);
        });

        // Chat messages
        socket.on('chat-message', ({ roomId, msg }) => {
            io.to(roomId).emit('chat-message', msg);
            console.log(`💬 Message in ${roomId}: ${msg}`);
        });

        // Product showcase
        socket.on('showcase-product', ({ roomId, product }) => {
            io.to(roomId).emit('product-showcased', product);
            console.log(`📦 Product showcased in ${roomId}:`, product.name);
        });

        // Add product to cart (from live room)
        socket.on('product-added-to-cart', ({ roomId, productId }) => {
            io.to(roomId).emit('cart-updated', { productId });
        });

        // Queue management
        socket.on('customer-joined-queue', (data) => {
            io.emit('queue-updated', data);
            console.log('👥 Customer joined queue:', data.name);
        });

        socket.on('customer-assigned', ({ roomId, customerId }) => {
            io.to(customerId).emit('assigned-to-room', { roomId });
            console.log(`✅ Customer ${customerId} assigned to ${roomId}`);
        });

        // Room status updates
        socket.on('room-status-change', ({ roomId, status }) => {
            if (activeRooms[roomId]) {
                activeRooms[roomId].status = status;
            }
            io.emit('room-status-updated', { roomId, status });
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log('🔴 User disconnected:', socket.id);
            
            // Clean up active rooms if needed
            Object.keys(activeRooms).forEach(roomId => {
                if (activeRooms[roomId].socketId === socket.id) {
                    delete activeRooms[roomId];
                    io.emit('room-status-updated', { roomId, status: 'available' });
                }
            });
        });

        // Call ended
        socket.on('call-ended', ({ roomId }) => {
            if (activeRooms[roomId]) {
                activeRooms[roomId].status = 'available';
            }
            io.to(roomId).emit('call-ended');
            console.log(`📞 Call ended in room: ${roomId}`);
        });
    });

    console.log('🔌 Socket.IO server initialized');
}

function getActiveRooms() {
    return activeRooms;
}

function getRoomStatus(roomId) {
    return activeRooms[roomId] || null;
}

function updateRoomStatus(roomId, status) {
    if (activeRooms[roomId]) {
        activeRooms[roomId].status = status;
        io.emit('room-status-updated', { roomId, status });
        return true;
    }
    return false;
}

function emitToRoom(roomId, event, data) {
    if (io) {
        io.to(roomId).emit(event, data);
    }
}

function broadcastToAll(event, data) {
    if (io) {
        io.emit(event, data);
    }
}

module.exports = {
    initialize,
    getActiveRooms,
    getRoomStatus,
    updateRoomStatus,
    emitToRoom,
    broadcastToAll
};
