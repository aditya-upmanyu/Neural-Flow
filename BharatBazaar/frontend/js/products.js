/* ===================================
   PRODUCTS MODULE
   Fetch, Display, Filter Products
   =================================== */

// Load Featured Products (Landing Page)
async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    try {
        // In production, fetch from API
        // const response = await fetch(`${API_BASE_URL}/products/featured`);
        
        // Get products from localStorage or use mock data
        let products = JSON.parse(localStorage.getItem('sellerProducts')) || getMockProducts();
        
        // Display first 6 products
        products = products.slice(0, 6);
        
        container.innerHTML = '';
        
        products.forEach(product => {
            const card = createProductCard(product);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p class="error-message">Failed to load products</p>';
    }
}

// Load All Products (Customer Home)
async function loadAllProducts(category = 'all') {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading products...</p></div>';
    
    try {
        // Simulate API delay
        await delay(500);
        
        // Get products
        let products = JSON.parse(localStorage.getItem('sellerProducts')) || getMockProducts();
        
        // Filter by category
        if (category !== 'all') {
            products = products.filter(p => p.category === category);
        }
        
        container.innerHTML = '';
        
        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <p>No products found</p>
                </div>
            `;
            return;
        }
        
        products.forEach(product => {
            const card = createProductCard(product);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p class="error-message">Failed to load products</p>';
    }
}

// Create Product Card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.images[0]}" alt="${product.name}">
        </div>
        <div class="product-content">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description.substring(0, 80)}...</p>
            <div class="product-price">
                <span class="price-current">₹${product.price.toLocaleString()}</span>
                ${product.stock < 10 ? `<span class="stock-warning">Only ${product.stock} left!</span>` : ''}
            </div>
            <div class="product-actions">
                <button onclick="viewProduct('${product.id}')" class="btn-view">
                    View Details
                </button>
                <button onclick="addToCart('${product.id}')" class="btn-add-to-cart">
                    🛒 Add to Cart
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// View Product Details
function viewProduct(productId) {
    window.location.href = `productdetail.html?id=${productId}`;
}

// Load Single Product Detail
async function loadProductDetail(productId) {
    try {
        const products = JSON.parse(localStorage.getItem('sellerProducts')) || getMockProducts();
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            alert('Product not found');
            window.location.href = 'customerhome.html';
            return;
        }
        
        // Update page title
        document.title = `${product.name} - Live Shopping Platform`;
        
        // Update product details
        document.getElementById('productTitle').textContent = product.name;
        document.getElementById('productPrice').textContent = `₹${product.price.toLocaleString()}`;
        document.getElementById('productDescription').textContent = product.description;
        
        // Update stock status
        const stockDiv = document.getElementById('productStock');
        if (product.stock > 0) {
            stockDiv.innerHTML = `<span class="stock-icon">✅</span><span class="stock-text">In Stock (${product.stock} units available)</span>`;
        } else {
            stockDiv.innerHTML = `<span class="stock-icon">❌</span><span class="stock-text">Out of Stock</span>`;
        }
        
        // Load images into slider
        loadProductImages(product.images);
        
        // Load related products
        loadRelatedProducts(productId, product.category);
        
    } catch (error) {
        console.error('Error loading product:', error);
    }
}

// Load Product Images into Slider
function loadProductImages(images) {
    const sliderContainer = document.getElementById('sliderContainer');
    const dotsContainer = document.getElementById('sliderDots');
    
    if (!sliderContainer || !dotsContainer) return;
    
    sliderContainer.innerHTML = '';
    dotsContainer.innerHTML = '';
    
    images.forEach((image, index) => {
        // Create image
        const img = document.createElement('img');
        img.src = image;
        img.alt = `Product image ${index + 1}`;
        img.className = index === 0 ? 'slider-image active' : 'slider-image';
        sliderContainer.appendChild(img);
        
        // Create dot
        const dot = document.createElement('span');
        dot.className = index === 0 ? 'dot active' : 'dot';
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });
}

// Load Related Products
async function loadRelatedProducts(currentProductId, category) {
    const container = document.getElementById('relatedProducts');
    if (!container) return;
    
    const products = JSON.parse(localStorage.getItem('sellerProducts')) || getMockProducts();
    const related = products
        .filter(p => p.id !== currentProductId && p.category === category)
        .slice(0, 4);
    
    container.innerHTML = '';
    
    related.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

// Mock Products Data
function getMockProducts() {
    return [
        {
            id: 'prod1',
            name: 'iPhone 15 Pro Max',
            category: 'electronics',
            price: 129999,
            stock: 15,
            description: 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system. Experience unmatched performance and durability.',
            images: [
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=iPhone+15+Pro',
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=iPhone+Back',
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=iPhone+Camera',
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=iPhone+Display',
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=iPhone+Package'
            ],
            status: 'active'
        },
        {
            id: 'prod2',
            name: 'AirPods Pro (2nd Gen)',
            category: 'accessories',
            price: 24999,
            stock: 50,
            description: 'Premium wireless earbuds with active noise cancellation, spatial audio, and adaptive transparency mode.',
            images: [
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=AirPods+Pro',
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=AirPods+Case',
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=AirPods+Use'
            ],
            status: 'active'
        },
        {
            id: 'prod3',
            name: 'MacBook Pro 14"',
            category: 'electronics',
            price: 199999,
            stock: 8,
            description: 'Powerful laptop with M3 Pro chip, stunning Liquid Retina XDR display, and all-day battery life.',
            images: [
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=MacBook+Pro',
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=MacBook+Display',
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=MacBook+Ports'
            ],
            status: 'active'
        },
        {
            id: 'prod4',
            name: 'Apple Watch Series 9',
            category: 'accessories',
            price: 39999,
            stock: 25,
            description: 'Advanced health and fitness tracking with always-on Retina display and double tap gesture.',
            images: [
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=Apple+Watch',
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=Watch+Face'
            ],
            status: 'active'
        },
        {
            id: 'prod5',
            name: 'iPad Air',
            category: 'electronics',
            price: 59999,
            stock: 20,
            description: 'Versatile tablet with M1 chip, stunning display, and support for Apple Pencil and Magic Keyboard.',
            images: [
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=iPad+Air',
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=iPad+Pencil'
            ],
            status: 'active'
        },
        {
            id: 'prod6',
            name: 'HomePod mini',
            category: 'home',
            price: 9999,
            stock: 40,
            description: 'Compact smart speaker with amazing sound, Siri integration, and smart home control.',
            images: [
                'https://via.placeholder.com/500x500/1E2340/E8ECFF?text=HomePod+mini'
            ],
            status: 'active'
        }
    ];
}

// Delay helper
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
