/* ===================================
   QUEUE MODULE
   Real-Time Customer Queue Management
   =================================== */

// Initialize Queue (for demo purposes)
function initQueue() {
    const existingQueue = localStorage.getItem('customerQueue');
    if (!existingQueue) {
        // Create demo queue
        const demoQueue = [
            {
                id: 'q1',
                name: 'Rahul Kumar',
                phone: '+91 98765 43210',
                productName: 'iPhone 15 Pro',
                productId: 'prod1',
                joinedAt: new Date(Date.now() - 5 * 60000).toISOString(),
                status: 'waiting'
            },
            {
                id: 'q2',
                name: 'Priya Sharma',
                phone: '+91 98765 43211',
                productName: 'MacBook Pro',
                productId: 'prod3',
                joinedAt: new Date(Date.now() - 3 * 60000).toISOString(),
                status: 'waiting'
            },
            {
                id: 'q3',
                name: 'Ajay Verma',
                phone: '+91 98765 43212',
                productName: 'AirPods Pro',
                productId: 'prod2',
                joinedAt: new Date(Date.now() - 1 * 60000).toISOString(),
                status: 'waiting'
            }
        ];
        localStorage.setItem('customerQueue', JSON.stringify(demoQueue));
    }
}

// Add Customer to Queue
function addToQueue(customerData) {
    let queue = JSON.parse(localStorage.getItem('customerQueue')) || [];
    
    const queueItem = {
        id: 'q' + Date.now(),
        name: customerData.name,
        phone: customerData.phone,
        productName: customerData.productName,
        productId: customerData.productId,
        joinedAt: new Date().toISOString(),
        status: 'waiting'
    };
    
    queue.push(queueItem);
    localStorage.setItem('customerQueue', JSON.stringify(queue));
    
    return queueItem;
}

// Remove from Queue
function removeFromQueue(queueId) {
    let queue = JSON.parse(localStorage.getItem('customerQueue')) || [];
    queue = queue.filter(item => item.id !== queueId);
    localStorage.setItem('customerQueue', JSON.stringify(queue));
}

// Get Queue Position
function getQueuePosition(queueId) {
    const queue = JSON.parse(localStorage.getItem('customerQueue')) || [];
    return queue.findIndex(item => item.id === queueId) + 1;
}

// Get Queue Length
function getQueueLength() {
    const queue = JSON.parse(localStorage.getItem('customerQueue')) || [];
    return queue.length;
}

// Socket.IO Real-Time Updates (for production)
/*
if (typeof io !== 'undefined') {
    const socket = io(SOCKET_URL);
    
    socket.on('queue-updated', (data) => {
        // Reload queue display
        if (typeof loadQueue === 'function') {
            loadQueue();
        }
    });
    
    socket.on('assigned-to-room', (data) => {
        // Notify customer they've been assigned
        alert(`You've been assigned to ${data.roomName}!`);
        window.location.href = `live-room.html?roomId=${data.roomId}`;
    });
}
*/

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    initQueue();
});
