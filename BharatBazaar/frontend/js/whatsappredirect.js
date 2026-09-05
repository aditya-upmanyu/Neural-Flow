/* ===================================
   WHATSAPP REDIRECT MODULE
   Send Product Inquiry via WhatsApp
   =================================== */

// Your WhatsApp Business Number (Replace with actual number)
const WHATSAPP_NUMBER = '919876543210'; // Format: Country code + number (no + or spaces)

// Redirect to WhatsApp with Product Inquiry
function redirectToWhatsApp(userName, productName, productId) {
    // Get product details
    const products = JSON.parse(localStorage.getItem('sellerProducts')) || [];
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        alert('Product not found');
        return;
    }
    
    // Create message with user name and product details
    const message = `Hi! I'm ${userName}.\n\nI'm interested in: *${productName}*\nPrice: ₹${product.price.toLocaleString()}\n\nI would like to schedule a live demo session.\n\nProduct Link: ${window.location.origin}/product-detail.html?id=${productId}`;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    // Add to queue before redirecting
    addToQueue({
        name: userName,
        phone: localStorage.getItem('userPhone') || 'Not provided',
        productName: productName,
        productId: productId
    });
    
    // Open WhatsApp in new tab
    window.open(whatsappURL, '_blank');
    
    // Show success message
    showToastNotification('Opening WhatsApp... You have been added to the queue!', 'success');
}

// Alternative: Send WhatsApp Message from Seller Side
function sendWhatsAppToCustomer(customerPhone, customerName, productName) {
    const message = `Hello ${customerName}! 👋\n\nThank you for your interest in *${productName}*.\n\nWe'd love to show you this product in a live video demo. When would you like to schedule a session?\n\nBest regards,\nLive Shop Team`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
}

// Send Product Details via WhatsApp
function shareProductViaWhatsApp(productId) {
    const products = JSON.parse(localStorage.getItem('sellerProducts')) || [];
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        alert('Product not found');
        return;
    }
    
    const productURL = `${window.location.origin}/product-detail.html?id=${productId}`;
    const message = `Check out this amazing product! 🛍️\n\n*${product.name}*\n\nPrice: ₹${product.price.toLocaleString()}\n\n${product.description}\n\n🔗 ${productURL}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
}

// Send Order Confirmation via WhatsApp
function sendOrderConfirmationWhatsApp(orderId, customerPhone) {
    const message = `🎉 Order Confirmed!\n\nOrder ID: ${orderId}\n\nThank you for shopping with us! Your order has been confirmed and will be delivered soon.\n\nTrack your order: ${window.location.origin}/order-confirmation.html?orderId=${orderId}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
}

// Toast notification helper
function showToastNotification(message, type) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize WhatsApp button listeners
window.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to all WhatsApp buttons
    const whatsappButtons = document.querySelectorAll('[data-whatsapp]');
    whatsappButtons.forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.getAttribute('data-product-id');
            const userName = localStorage.getItem('userName') || 'Guest';
            const productName = button.getAttribute('data-product-name');
            redirectToWhatsApp(userName, productName, productId);
        });
    });
});
