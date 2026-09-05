/* ===================================
   CART MODULE
   Add, Remove, Update Cart Items
   =================================== */

// Get Cart from localStorage
function getCart() {
    const cart = localStorage.getItem('shoppingCart');
    return cart ? JSON.parse(cart) : [];
}

// Save Cart to localStorage
function saveCart(cart) {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
    updateCartCount();
}

// Add to Cart
function addToCart(productId, quantity = 1) {
    const products = JSON.parse(localStorage.getItem('sellerProducts')) || [];
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        alert('Product not found');
        return;
    }
    
    let cart = getCart();
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0],
            quantity: quantity,
            addedFrom: 'browse' // Can be 'browse' or 'live-room'
        });
    }
    
    saveCart(cart);
    return true;
}

// Remove from Cart
function removeCartItem(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
}

// Update Cart Item Quantity
function updateCartItemQuantity(productId, quantity) {
    let cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity = quantity;
        saveCart(cart);
    }
}

// Clear Cart
function clearCart() {
    localStorage.removeItem('shoppingCart');
    updateCartCount();
}

// Update Cart Count Badge
function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const badges = document.querySelectorAll('#cartCount, #cartCountMobile');
    badges.forEach(badge => {
        if (badge) {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    });
}

// Load Cart Page
function loadCart() {
    const cart = getCart();
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCart = document.getElementById('emptyCart');
    const loadingCart = document.getElementById('loadingCart');
    
    if (!cartItemsList) return;
    
    // Hide loading
    if (loadingCart) loadingCart.style.display = 'none';
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = '';
        if (emptyCart) emptyCart.style.display = 'block';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    cartItemsList.innerHTML = '';
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h3 class="cart-item-title">${item.name}</h3>
                <p class="cart-item-price">₹${item.price.toLocaleString()}</p>
                ${item.addedFrom === 'live-room' ? '<span class="added-from-badge">Added from Live Room</span>' : ''}
            </div>
            <div class="cart-item-quantity">
                <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})" class="qty-btn">−</button>
                <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity('${item.id}', this.value)" class="qty-input">
                <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})" class="qty-btn">+</button>
            </div>
            <div class="cart-item-total">
                <strong>₹${(item.price * item.quantity).toLocaleString()}</strong>
            </div>
            <button onclick="removeFromCart('${item.id}')" class="btn-remove-item" title="Remove">
                🗑️
            </button>
        `;
        cartItemsList.appendChild(cartItem);
    });
    
    updateCartSummary();
}

// Update Cart Summary
function updateCartSummary() {
    const cart = getCart();
    const summary = calculateCartSummary();
    
    // Update cart page summary
    const itemCount = document.getElementById('itemCount');
    const subtotal = document.getElementById('subtotal');
    const tax = document.getElementById('tax');
    const total = document.getElementById('total');
    
    if (itemCount) itemCount.textContent = cart.length;
    if (subtotal) subtotal.textContent = `₹${summary.subtotal.toLocaleString()}`;
    if (tax) tax.textContent = `₹${summary.tax.toLocaleString()}`;
    if (total) total.textContent = `₹${summary.total.toLocaleString()}`;
}

// Calculate Cart Summary
function calculateCartSummary() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.18); // 18% tax
    const shipping = 0; // Free shipping
    const total = subtotal + tax + shipping;
    
    return { subtotal, tax, shipping, total };
}

// Initialize cart on page load
window.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});
