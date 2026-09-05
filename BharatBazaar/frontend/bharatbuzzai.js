// BharatBuzzAI - Complete Chatbot Logic

// Predefined responses database
const responses = {
    greetings: [
        "🙏 Namaste! I'm BharatBuzzAI, your AI assistant for BharatBazaar - Supporting Local for Vocal! How can I assist you?",
        "Hello! I'm BharatBuzzAI, helping you explore BharatBazaar - your trusted Indian marketplace!",
        "Namaste! BharatBuzzAI here! How can I help you discover amazing Indian products today?",
        "🇮🇳 Welcome! I'm BharatBuzzAI, your intelligent shopping companion for BharatBazaar!"
    ],
    saree: [
        "🥻 We have beautiful sarees from local artisans! Our collection includes Banarasi, Kanjeevaram, Chanderi, and Cotton sarees. Prices range from ₹500 to ₹5000. Support local weavers with BharatBazaar! Which type interests you?",
        "🥻 BharatBazaar offers authentic Indian sarees! We support local for vocal with handwoven Silk sarees, Designer sarees, and Traditional sarees. All made by local artisans!",
        "🥻 Our saree collection celebrates Indian craftsmanship! From Banarasi silk to South Indian Kanjeevarams, we have it all. Prices start at ₹500. Local for Vocal!",
        "🥻 Check our premium saree collection! Handloom sarees, Party wear sarees, and Bridal sarees available. Each piece tells a story of Indian heritage!"
    ],
    kurta: [
        "👔 We have stylish Kurta Pajamas for men! Cotton Kurtas (₹400-₹1500), Silk Kurtas (₹1000-₹3000), and Designer Kurta sets. All from local Indian manufacturers. Local for Vocal!",
        "👔 BharatBazaar's Kurta collection includes traditional and modern designs! Pure cotton, linen, and silk options available. Supporting local tailors and weavers!",
        "👔 Check out our Kurta Pajama sets! Perfect for festivals and daily wear. Made by Indian artisans. Prices from ₹400 onwards. Choose local, choose quality!",
        "👔 Men's ethnic wear at its best! Kurtas with intricate embroidery, printed designs, and solid colors. Comfortable and stylish!"
    ],
    lehenga: [
        "👗 Beautiful Lehengas for weddings and festivals! Designer lehengas (₹3000-₹15000), Bridal lehengas, and Party wear. All handcrafted by local designers. Local for Vocal!",
        "👗 Our lehenga collection is stunning! Traditional embroidery work by Indian craftsmen. Various colors and designs available. Support local artisans!",
        "👗 Bridal and festive lehengas in stock! Zari work, sequin designs, and traditional patterns. Make your special day memorable with Indian craftsmanship!"
    ],
    jewelry: [
        "💍 We offer traditional Indian jewelry! Artificial jewelry (₹200-₹2000), Oxidized jewelry, Temple jewelry, and Kundan sets. From local jewelry makers. Local for Vocal!",
        "💍 BharatBazaar's jewelry collection includes Jhumkas, Bangles, Necklaces, and complete sets. All from Indian artisans. Affordable and beautiful!",
        "💍 Adorn yourself with traditional jewelry! Polki sets, Meenakari work, and Antique designs available. Handcrafted by skilled artisans!"
    ],
    dupatta: [
        "🧣 Beautiful Dupattas in various fabrics! Silk dupattas (₹300-₹1500), Cotton dupattas, and Embroidered dupattas. Local craftsmanship at its best!",
        "🧣 Our dupatta range includes Banarasi, Phulkari, and Bandhani styles. All from local weavers. Prices start at ₹250. Local for Vocal!",
        "🧣 Complete your ethnic look with our dupattas! Chiffon, Georgette, and Net dupattas in vibrant colors!"
    ],
    salwar: [
        "👘 Salwar Kameez sets available! Anarkali suits (₹800-₹3000), Punjabi suits, and Churidar sets. Made by local tailors. Support Indian fashion!",
        "👘 BharatBazaar has beautiful Salwar suits! Cotton, Silk, and Designer collections. All locally manufactured. Prices from ₹600!",
        "👘 Elegant Salwar Kameez in trending designs! Straight cut, A-line, and Anarkali styles. Perfect for every occasion!"
    ],
    price: [
        "💰 Our prices are very competitive! Sarees: ₹500-₹5000, Kurtas: ₹400-₹3000, Lehengas: ₹3000-₹15000, Jewelry: ₹200-₹2000. Best value for Indian products!",
        "💰 We offer affordable pricing on all products! Check specific categories for detailed pricing. Quality products at local prices!",
        "💰 Great value for money! We keep prices low by working directly with artisans. No middlemen, just authentic products!"
    ],
    shipping: [
        "🚚 We provide all-India shipping! Free delivery on orders above ₹1000. Normal delivery takes 5-7 days. Supporting local for vocal across India!",
        "🚚 Shipping available pan-India! Orders dispatched within 24 hours. Track your order online. Bringing local products to your doorstep!",
        "🚚 Fast and reliable delivery! Express shipping available for urgent orders. Packaging done with care to ensure product safety!"
    ],
    payment: [
        "💳 Multiple payment options available! UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery. Safe and secure payments!",
        "💳 We accept all payment methods! UPI (Google Pay, PhonePe, Paytm), Cards, and COD available. Shop safely with BharatBazaar!",
        "💳 Secure payment gateway! Your financial information is protected. Pay the way you prefer!"
    ],
    return: [
        "🔄 7-day return policy available! Products must be unused with original tags. Refund processed within 5-7 days. Customer satisfaction guaranteed!",
        "🔄 Easy returns and exchanges! Contact us within 7 days of delivery. We value your trust in local products!",
        "🔄 Hassle-free returns! If you're not satisfied, we'll make it right. Your happiness is our priority!"
    ],
    local: [
        "🇮🇳 BharatBazaar proudly supports Local for Vocal! All our products are made by Indian artisans, weavers, and manufacturers. Your purchase directly supports local communities!",
        "🇮🇳 Local for Vocal is our motto! We source 100% from Indian artisans. Every purchase strengthens our local economy. Be vocal about local!",
        "🇮🇳 Support Indian craftsmanship! BharatBazaar connects you with authentic local products. When you buy from us, you support Indian families and traditions!",
        "🇮🇳 Vocal for Local! Each product has a story of Indian heritage. Your purchase empowers local artisans and preserves traditional crafts!"
    ],
    quality: [
        "✅ We guarantee quality! All products are checked before dispatch. Only authentic Indian craftsmanship. 100% quality assurance!",
        "✅ Quality is our priority! We work directly with artisans to ensure the best products. Authenticity guaranteed!",
        "✅ Premium quality materials used! Each item goes through rigorous quality checks. We never compromise on standards!"
    ],
    ethnic: [
        "🪔 Ethnic wear for all occasions! Weddings, festivals, parties, and daily wear. Complete your traditional look with BharatBazaar!",
        "🪔 Wide range of ethnic clothing! For men, women, and kids. Traditional meets modern at BharatBazaar!",
        "🪔 Celebrate Indian culture with our ethnic collection! From casual to festive wear, we have it all!"
    ],
    men: [
        "🧔 Men's collection includes Kurta Pajamas, Sherwanis, Nehru Jackets, and Dhotis. Traditional wear for the modern man! Prices from ₹400.",
        "🧔 BharatBazaar offers premium men's ethnic wear! Kurtas, Sherwanis, and accessories. Made by local tailors!",
        "🧔 Stylish ethnic wear for men! Indo-western fusion and traditional designs. Look dapper at every event!"
    ],
    women: [
        "👩 Women's collection: Sarees, Salwar suits, Lehengas, Kurtis, and Ethnic jewelry. Celebrate Indian fashion! Prices from ₹300.",
        "👩 Beautiful women's ethnic wear! Traditional and fusion styles available. Support local female artisans!",
        "👩 Empowering women through fashion! Elegant designs made by women artisans across India!"
    ],
    kids: [
        "👶 Kids ethnic wear available! Cute Kurta sets, Lehenga cholis, and Dhoti Kurtas. Sizes for all ages. Prices from ₹300!",
        "👶 Dress your little ones in traditional style! Kids collection includes festival wear and daily wear. Made with soft, comfortable fabrics!",
        "👶 Adorable ethnic wear for children! Safe, comfortable, and stylish. Let them celebrate Indian culture from young age!"
    ],
    material: [
        "🧵 We use premium materials! Pure Cotton, Silk, Linen, Georgette, and Chiffon. All sourced from Indian suppliers. Quality fabrics from local mills!",
        "🧵 Authentic fabrics only! Handloom cotton, Pure silk, and Traditional textiles. Supporting Indian textile industry!",
        "🧵 Natural and breathable fabrics! No synthetic compromises. Comfortable wear for all seasons!"
    ],
    size: [
        "📏 All sizes available! XS to XXL for readymade. Custom stitching available for sarees and suits. Size chart provided on product pages!",
        "📏 We offer standard and custom sizes! Measurements guide available. Perfect fit guaranteed!",
        "📏 Size not fitting? We do alterations! Contact us for custom measurements. Tailoring services available!"
    ],
    discount: [
        "🎉 Regular discounts and offers! Follow us for festive sales. First-time buyers get 10% off! Use code: BHARAT10",
        "🎉 Special offers running! Check homepage for current deals. Subscribe to newsletter for exclusive discounts!",
        "🎉 Festive season sale live! Up to 40% off on selected items. Limited time offer. Shop now!"
    ],
    festival: [
        "🪔 Festival special collections available! Diwali, Holi, Durga Puja, and Eid collections. Traditional wear for every celebration!",
        "🪔 Celebrate festivals in style! Special designs for Indian festivals. Book early for best selection!",
        "🪔 Festival season is here! New arrivals for Navratri, Dussehra, and Diwali. Traditional outfits for the whole family!"
    ],
    contact: [
        "📞 Contact us: Email: support@bharatbazaar.com | Phone: +91-9876543210 | WhatsApp: +91-9876543210. We're here to help!",
        "📞 Reach out anytime! Customer support available 10 AM - 7 PM. Email or call us with queries!",
        "📞 Need help? Our support team is ready to assist! Call, email, or WhatsApp us. Quick response guaranteed!"
    ],
    default: [
        "I'm BharatBuzzAI, here to help! You can ask me about: Sarees, Kurta Pajamas, Lehengas, Jewelry, Prices, Shipping, Returns, or anything else!",
        "🛍️ As BharatBuzzAI, I can help you explore authentic Indian products on BharatBazaar! Ask me about sarees, kurtas, lehengas, jewelry, or our Local for Vocal initiative!",
        "I didn't quite understand. Can you ask about specific products like sarees, kurtas, or shipping details? I'm BharatBuzzAI, your smart assistant!",
        "Let me help you! Try asking about our products, prices, delivery, or any other queries. I'm BharatBuzzAI, your AI shopping assistant!"
    ],
    thanks: [
        "🙏 You're welcome! Happy shopping at BharatBazaar! Support Local for Vocal!",
        "Glad to help! Visit us again. Jai Hind! 🇮🇳",
        "Thank you for choosing BharatBazaar! Be vocal about local! 🛍️",
        "My pleasure! Feel free to ask anything else. Happy shopping! 🇮🇳"
    ],
    bye: [
        "👋 Goodbye! Come back soon. Happy shopping! Support local!",
        "Thank you for chatting with BharatBuzzAI! Have a great day! 🙏",
        "See you soon! Remember - Local for Vocal! 🇮🇳",
        "Bye! Keep supporting Indian artisans. Visit again soon! 🛍️"
    ],
    price_hin: [
        "Bhaiya, har product ka price alag hai. Saree 500 se 5,000 rupaye tak mil jayega. Kurta pajama 400 rupaye se shuru ho jata hai. Jewelry bhi 200 rupaye se milti hai. Aap batao kis item ka price chahiye, bilkul details de dunga. BharatBazaar me sab kuch budget me milta hai!",
        "Dosto, daam ki chinta mat karo! Yahan saree, kurta, lehenga sab milenge affordable price par. Jo bhi product chahiye, uska naam batao, main price details turant de dunga. BharatBazaar me local artisans ka support hai aur best price guarantee!",
        "Sir/Ma'am, BharatBazaar par price fix aur reasonable hai. Saree ka rate 500 rupaye se start hota hai, kurta bhi sasta aur achha hai. Aapko agar koi specific product ka rate chahiye toh turant pooch lijiye. Yahan par bargaining ka bhi feel aata hai, par price bilkul final hai!"
    ],
    products_hin: [
        "BharatBazaar par har type ke kapde milte hain: saree, kurta pajama, lehenga, salwar suit, dupatta, kids wear, aur ethnic jackets. Accessories jaise jewelry, bangles, aur dupatta bhi hai. Yahan par sab kuch traditional Indian style me milega! Apni requirement batao, main full list bhej dunga.",
        "Sir, yahan pe ethnic wear ka full collection hai: Saree, Kurta, Lehenga, Salwar suits, Dupatta, Saree Blouses, Men & Kids wear. Festive aur daily wear sab milega. Accessories aur gifts bhi available hai. Jo bhi chahiye, BharatBazaar ready hai dene ke liye!",
        "Aapko kapde chahiye toh BharatBazaar ekdum best hai! Traditional, casual, festive, collection sab hai. Saree, kurta, kids outfits se le kar jewelry tak. Poora family ka shopping one site pe complete ho jayega!"
    ],
    special_hin: [
        "BharatBazaar ki sabse badi speciality hai ki yeh 100% Indian products deta hai - local for vocal! Yahan par direct artisans se saman aata hai, na koi beech ka agent. Quality bilkul best, price pocket friendly, aur shipping tez hai. Support karo local business, BharatBazaar ke saath!",
        "Is site ki khaas baat hai made in India original items - sarees, kurtas, lehengas, jewelry sab kuch yahan milega. Yahan par har rang, har size available hai. Online payment sahi aur safe hai, customer care bhi helpful hai! Issi wajah se BharatBazaar best hai!",
        "BharatBazaar sabse achha isliye hai kyunki yahan par variety, quality aur Indian touch sab kuch milega ek jagah par. Local artisans ke banaye original kapde aur accessories, sab kuch ekdum authentic hai! Yeh site badi reliable hai aur returns bhi easy hai."
    ]
};

// Keywords mapping
const keywords = {
    greetings: ['hi', 'hello', 'hey', 'namaste', 'namaskar', 'good morning', 'good afternoon', 'good evening', 'hii', 'hola'],
    saree: ['saree', 'sari', 'banarasi', 'kanjeevaram', 'kanjivaram', 'silk saree', 'cotton saree', 'designer saree', 'handloom', 'traditional saree'],
    kurta: ['kurta', 'kurta pajama', 'kurta pyjama', 'mens kurta', 'pathani', 'kurta set', 'sherwani kurta'],
    lehenga: ['lehenga', 'lehnga', 'ghagra', 'bridal lehenga', 'wedding lehenga', 'chaniya choli'],
    jewelry: ['jewelry', 'jewellery', 'necklace', 'earring', 'bangle', 'jhumka', 'kundan', 'polki', 'meenakari'],
    dupatta: ['dupatta', 'chunni', 'stole', 'shawl', 'odhni'],
    salwar: ['salwar', 'salwar kameez', 'suit', 'anarkali', 'punjabi suit', 'churidar', 'patiala'],
    price: ['price', 'cost', 'rate', 'how much', 'expensive', 'cheap', 'affordable', 'budget'],
    shipping: ['shipping', 'delivery', 'courier', 'dispatch', 'when will i get', 'tracking'],
    payment: ['payment', 'pay', 'cod', 'cash on delivery', 'upi', 'card', 'paytm', 'gpay'],
    return: ['return', 'refund', 'exchange', 'replace', 'money back'],
    local: ['local', 'vocal', 'local for vocal', 'indian', 'made in india', 'artisan', 'vocal for local'],
    quality: ['quality', 'authentic', 'genuine', 'original', 'good', 'real'],
    ethnic: ['ethnic', 'traditional', 'cultural', 'indian wear', 'desi'],
    men: ['men', 'mens', 'male', 'boy', 'groom', 'man'],
    women: ['women', 'womens', 'female', 'girl', 'bride', 'ladies', 'woman'],
    kids: ['kids', 'children', 'baby', 'toddler', 'child', 'kid'],
    material: ['material', 'fabric', 'cloth', 'cotton', 'silk', 'linen', 'quality'],
    size: ['size', 'fit', 'measurement', 'dimension', 'fitting'],
    discount: ['discount', 'offer', 'sale', 'deal', 'coupon', 'promo', 'code'],
    festival: ['festival', 'diwali', 'holi', 'eid', 'navratri', 'durga puja', 'dussehra'],
    contact: ['contact', 'phone', 'email', 'whatsapp', 'customer care', 'support', 'help'],
    thanks: ['thank', 'thanks', 'appreciate', 'grateful', 'thankyou'],
    bye: ['bye', 'goodbye', 'see you', 'tata', 'exit', 'quit'],
    price_hin: ["kitne rupay ka hai", "kitne ka hai", "daam batao", "price batao", "kya rate hai", "rate kya hai", "kitne rupay"],
    products_hin: ["kya kya kapde hai", "kya kya milta hai", "kis kis type ke kapde hai", "kapde batao", "kapde kitne hai", "kitne clothes hai", "products batao", "kya milta hai"],
    special_hin: ["speciality kya hai", "special hai kya", "ye site ki khasiyat", "isme kya khaas hai", "ye site best kyu hai", "bharat bazaar best kyun hai", "kyu sabse achha hai", "best kya hai", "is site ki specialty", "isme kya hai"]
};

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const quickActions = document.getElementById('quickActions');

// Get current time
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// Add message to chat
function addMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'bot' ? '🤖' : '👤';

    const content = document.createElement('div');
    content.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = message;

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = getCurrentTime();

    content.appendChild(bubble);
    content.appendChild(time);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';

    const content = document.createElement('div');
    content.className = 'message-content';

    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    content.appendChild(typing);
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(content);

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) {
        typing.remove();
    }
}

// Get bot response based on keywords
function getBotResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    for (const [category, keywordList] of Object.entries(keywords)) {
        for (const keyword of keywordList) {
            if (lowerMessage.includes(keyword)) {
                const responseList = responses[category];
                return responseList[Math.floor(Math.random() * responseList.length)];
            }
        }
    }

    return responses.default[Math.floor(Math.random() * responses.default.length)];
}

// Handle send message
function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Simulate bot response delay
    setTimeout(() => {
        removeTypingIndicator();
        const botResponse = getBotResponse(message);
        addMessage(botResponse, 'bot');
    }, 1000 + Math.random() * 1000);
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Quick action buttons
quickActions.addEventListener('click', (e) => {
    if (e.target.classList.contains('quick-btn')) {
        const message = e.target.getAttribute('data-message');
        chatInput.value = message;
        sendMessage();
    }
});

// Focus input on load
chatInput.focus();
