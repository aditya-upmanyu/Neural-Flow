/* ===================================
   LIVE ROOM EXTENDED MODULE
   Additional Functions for Video Chat Interface
   =================================== */

// Note: Main Socket.io and WebRTC code is already in live-room.html
// This file contains additional helper functions

// Product Showcase Management
const showcasedProducts = [];

function showcaseProduct(productId) {
    const products = JSON.parse(localStorage.getItem('sellerProducts')) || [];
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    // Emit to socket (already in live-room.html)
    if (typeof socket !== 'undefined') {
        socket.emit('showcase-product', {
            roomId: roomId,
            product: {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images[0],
                description: product.description
            }
        });
    }
    
    // Add to showcased list
    showcasedProducts.push(productId);
    
    // Visual feedback
    const productButtons = document.querySelectorAll('.btn-show-product');
    productButtons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(productId)) {
            btn.textContent = '✓ Shown';
            btn.style.background = 'linear-gradient(135deg, #32E685, #5CF0A0)';
            btn.disabled = true;
        }
    });
}

// Add Product to Customer Cart (from live room)
function addToCustomerCart(productId) {
    if (typeof addToCart === 'function') {
        addToCart(productId, 1);
        
        // Send notification to customer
        if (typeof socket !== 'undefined') {
            socket.emit('product-added-to-cart', {
                roomId: roomId,
                productId: productId
            });
        }
        
        // Visual feedback
        const toast = document.createElement('div');
        toast.className = 'toast success show';
        toast.textContent = 'Product added to customer cart!';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Screen Sharing (Optional Enhancement)
async function shareScreen() {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
        });
        
        // Replace video track
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        
        if (sender) {
            sender.replaceTrack(videoTrack);
        }
        
        // Stop screen share when track ends
        videoTrack.onended = () => {
            stopScreenShare();
        };
        
        addChatMessage('System: Screen sharing started', 'system');
    } catch (error) {
        console.error('Error sharing screen:', error);
        addChatMessage('System: Screen share failed', 'system');
    }
}

async function stopScreenShare() {
    try {
        // Get camera stream again
        const cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        const videoTrack = cameraStream.getVideoTracks()[0];
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        
        if (sender) {
            sender.replaceTrack(videoTrack);
        }
        
        document.getElementById('localVideo').srcObject = cameraStream;
        addChatMessage('System: Screen sharing stopped', 'system');
    } catch (error) {
        console.error('Error stopping screen share:', error);
    }
}

// Record Session (Optional Enhancement)
let mediaRecorder;
let recordedChunks = [];

function startRecording() {
    const stream = document.getElementById('localVideo').srcObject;
    
    if (!stream) {
        alert('No active stream to record');
        return;
    }
    
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Download recorded video
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-${Date.now()}.webm`;
        a.click();
        
        recordedChunks = [];
    };
    
    mediaRecorder.start();
    addChatMessage('System: Recording started', 'system');
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        addChatMessage('System: Recording stopped and saved', 'system');
    }
}

// Connection Quality Monitor
function monitorConnectionQuality() {
    if (!pc) return;
    
    setInterval(async () => {
        const stats = await pc.getStats();
        let bytesReceived = 0;
        let bytesSent = 0;
        
        stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                bytesReceived = report.bytesReceived;
            }
            if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
                bytesSent = report.bytesSent;
            }
        });
        
        // Log connection quality (can display to user)
        console.log('Connection Quality:', {
            received: bytesReceived,
            sent: bytesSent
        });
    }, 5000);
}

// End Session with Summary
function endSessionWithSummary() {
    if (!confirm('End this session? A summary will be generated.')) return;
    
    const sessionDuration = sessionStartTime 
        ? Math.floor((Date.now() - sessionStartTime) / 60000) 
        : 0;
    
    const summary = {
        duration: `${sessionDuration} minutes`,
        productsShown: showcasedProducts.length,
        timestamp: new Date().toISOString()
    };
    
    // Save session summary
    let sessions = JSON.parse(localStorage.getItem('sessionHistory')) || [];
    sessions.push(summary);
    localStorage.setItem('sessionHistory', JSON.stringify(sessions));
    
    // Call original endCall function
    if (typeof endCall === 'function') {
        endCall();
    }
}

// Quick Actions Panel
function toggleQuickActions() {
    const panel = document.getElementById('quickActionsPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

// Customer Feedback Collection
function collectCustomerFeedback() {
    const rating = prompt('Rate this session (1-5 stars):');
    if (rating) {
        const feedback = {
            rating: parseInt(rating),
            timestamp: new Date().toISOString()
        };
        
        // Save feedback
        let feedbacks = JSON.parse(localStorage.getItem('sessionFeedbacks')) || [];
        feedbacks.push(feedback);
        localStorage.setItem('sessionFeedbacks', JSON.stringify(feedbacks));
        
        alert('Thank you for your feedback!');
    }
}

// Initialize live room enhancements
window.addEventListener('DOMContentLoaded', () => {
    // Monitor connection quality if in live room
    if (window.location.pathname.includes('live-room.html')) {
        setTimeout(() => {
            if (typeof pc !== 'undefined' && pc) {
                monitorConnectionQuality();
            }
        }, 3000);
    }
});
