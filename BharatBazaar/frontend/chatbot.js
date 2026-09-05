// Chatbot Configuration
const CHATBOT_CONFIG = {
    supportWhatsApp: '917007494575',  // ← LINE 2: Your number (Support)
    sellerWhatsApp: '917007494575',   // ← LINE 3: Your number (Seller)
    supportMessage: 'Hello! I need help with BharatBazaar.',
    sellerMessage: 'Hi! I am interested in your products on BharatBazaar.'
};


// Initialize chatbot
document.addEventListener('DOMContentLoaded', function() {
    // Create chatbot button
    const chatbotButton = document.createElement('div');
    chatbotButton.className = 'chatbot-button';
    chatbotButton.innerHTML = '🤖';
    chatbotButton.onclick = toggleChatbot;
    document.body.appendChild(chatbotButton);

    // Create chatbot menu
    const chatbotMenu = document.createElement('div');
    chatbotMenu.className = 'chatbot-menu';
    chatbotMenu.id = 'chatbotMenu';
    chatbotMenu.innerHTML = `
        <button class="chatbot-close" onclick="closeChatbot()">✕</button>
        <h3>💬 How can we help?</h3>
        <div class="chatbot-option" onclick="contactSupport()">
            <div class="chatbot-option-icon">🛟</div>
            <div class="chatbot-option-text">
                <div class="chatbot-option-title">Contact Support</div>
                <div class="chatbot-option-desc">Get help from our team</div>
            </div>
        </div>
        <div class="chatbot-option" onclick="contactSeller()">
            <div class="chatbot-option-icon">👨‍💼</div>
            <div class="chatbot-option-text">
                <div class="chatbot-option-title">Contact Seller</div>
                <div class="chatbot-option-desc">Chat with the seller</div>
            </div>
        </div>
    `;
    document.body.appendChild(chatbotMenu);
});

function toggleChatbot() {
    const menu = document.getElementById('chatbotMenu');
    menu.classList.toggle('active');
}

function closeChatbot() {
    const menu = document.getElementById('chatbotMenu');
    menu.classList.remove('active');
}

function contactSupport() {
    const number = CHATBOT_CONFIG.supportWhatsApp;
    const message = encodeURIComponent(CHATBOT_CONFIG.supportMessage);
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
    closeChatbot();
}

function contactSeller() {
    const number = CHATBOT_CONFIG.sellerWhatsApp;
    const message = encodeURIComponent(CHATBOT_CONFIG.sellerMessage);
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
    closeChatbot();
}
