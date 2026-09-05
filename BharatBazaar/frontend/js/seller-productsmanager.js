/* ===================================
   SELLER PRODUCTS MANAGER MODULE
   Add, Edit, Delete Products with Auto-Update
   =================================== */

// Validate Product Form
function validateProductForm(formData) {
    const errors = [];
    
    if (!formData.name || formData.name.trim().length < 3) {
        errors.push('Product name must be at least 3 characters');
    }
    
    if (!formData.category) {
        errors.push('Please select a category');
    }
    
    if (!formData.price || formData.price <= 0) {
        errors.push('Please enter a valid price');
    }
    
    if (!formData.stock || formData.stock < 0) {
        errors.push('Please enter a valid stock quantity');
    }
    
    if (!formData.description || formData.description.trim().length < 10) {
        errors.push('Description must be at least 10 characters');
    }
    
    if (!formData.images || formData.images.length === 0) {
        errors.push('Please upload at least 1 product image');
    }
    
    return errors;
}

// Save Product to Backend (API Simulation)
async function saveProductToBackend(productData) {
    // In production, this would be an API call
    // const response = await fetch(`${API_BASE_URL}/products`, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${localStorage.getItem('userToken')}`
    //     },
    //     body: JSON.stringify(productData)
    // });
    
    // For now, save to localStorage
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                let products = JSON.parse(localStorage.getItem('sellerProducts')) || [];
                products.push(productData);
                localStorage.setItem('sellerProducts', JSON.stringify(products));
                
                // Trigger update event for other components
                window.dispatchEvent(new CustomEvent('productsUpdated', { 
                    detail: { products } 
                }));
                
                resolve({ success: true, productId: productData.id });
            } catch (error) {
                reject(error);
            }
        }, 1000);
    });
}

// Update Product
async function updateProduct(productId, updatedData) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                let products = JSON.parse(localStorage.getItem('sellerProducts')) || [];
                const index = products.findIndex(p => p.id === productId);
                
                if (index !== -1) {
                    products[index] = { ...products[index], ...updatedData };
                    localStorage.setItem('sellerProducts', JSON.stringify(products));
                    
                    // Trigger update event
                    window.dispatchEvent(new CustomEvent('productsUpdated', { 
                        detail: { products } 
                    }));
                    
                    resolve({ success: true });
                } else {
                    reject(new Error('Product not found'));
                }
            } catch (error) {
                reject(error);
            }
        }, 800);
    });
}

// Delete Product
async function deleteProduct(productId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                let products = JSON.parse(localStorage.getItem('sellerProducts')) || [];
                products = products.filter(p => p.id !== productId);
                localStorage.setItem('sellerProducts', JSON.stringify(products));
                
                // Trigger update event
                window.dispatchEvent(new CustomEvent('productsUpdated', { 
                    detail: { products } 
                }));
                
                resolve({ success: true });
            } catch (error) {
                reject(error);
            }
        }, 500);
    });
}

// Bulk Upload Products (CSV/JSON)
// Note: This function uses localStorage as a fallback. For production, use the backend API.
function bulkUploadProducts(productsArray) {
    let products = JSON.parse(localStorage.getItem('sellerProducts')) || [];
    
    productsArray.forEach(product => {
        const productData = {
            id: 'PROD' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            ...product,
            addedDate: new Date().toISOString(),
            status: 'active'
        };
        products.push(productData);
    });
    
    localStorage.setItem('sellerProducts', JSON.stringify(products));
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('productsUpdated', { 
        detail: { products } 
    }));
    
    return products.length;
}

// Export Products (JSON)
function exportProducts() {
    const products = JSON.parse(localStorage.getItem('sellerProducts')) || [];
    const dataStr = JSON.stringify(products, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products-export-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Get Product Statistics
function getProductStats() {
    const products = JSON.parse(localStorage.getItem('sellerProducts')) || [];
    
    return {
        total: products.length,
        active: products.filter(p => p.status === 'active').length,
        outOfStock: products.filter(p => p.stock === 0).length,
        lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
        categories: [...new Set(products.map(p => p.category))],
        totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
    };
}

// Search Products
function searchProducts(query) {
    const products = JSON.parse(localStorage.getItem('sellerProducts')) || [];
    const lowercaseQuery = query.toLowerCase();
    
    return products.filter(product => 
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.description.toLowerCase().includes(lowercaseQuery) ||
        product.category.toLowerCase().includes(lowercaseQuery)
    );
}

// Filter Products by Category
function filterProductsByCategory(category) {
    const products = JSON.parse(localStorage.getItem('sellerProducts')) || [];
    
    if (category === 'all') {
        return products;
    }
    
    return products.filter(p => p.category === category);
}

// Sort Products
function sortProducts(products, sortBy = 'name', order = 'asc') {
    const sorted = [...products].sort((a, b) => {
        let comparison = 0;
        
        switch(sortBy) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'price':
                comparison = a.price - b.price;
                break;
            case 'stock':
                comparison = a.stock - b.stock;
                break;
            case 'date':
                comparison = new Date(a.addedDate) - new Date(b.addedDate);
                break;
            default:
                comparison = 0;
        }
        
        return order === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
}

// Update Stock Level
function updateStockLevel(productId, newStock) {
    let products = JSON.parse(localStorage.getItem('sellerProducts')) || [];
    const product = products.find(p => p.id === productId);
    
    if (product) {
        product.stock = newStock;
        localStorage.setItem('sellerProducts', JSON.stringify(products));
        
        // Trigger update event
        window.dispatchEvent(new CustomEvent('productsUpdated', { 
            detail: { products } 
        }));
        
        return true;
    }
    
    return false;
}

// Generate Product Report
function generateProductReport() {
    const products = JSON.parse(localStorage.getItem('sellerProducts')) || [];
    const stats = getProductStats();
    
    const report = {
        generatedAt: new Date().toISOString(),
        summary: stats,
        products: products.map(p => ({
            name: p.name,
            category: p.category,
            price: p.price,
            stock: p.stock,
            value: p.price * p.stock,
            status: p.stock === 0 ? 'Out of Stock' : p.stock < 10 ? 'Low Stock' : 'In Stock'
        }))
    };
    
    return report;
}

// Listen for product updates
window.addEventListener('productsUpdated', (event) => {
    console.log('Products updated:', event.detail.products.length, 'products');
    
    // Auto-refresh product list if on products page
    if (window.location.pathname.includes('seller-products.html')) {
        if (typeof loadProducts === 'function') {
            loadProducts();
        }
    }
    
    // Update customer-facing product list
    if (window.location.pathname.includes('customer-home.html')) {
        if (typeof loadAllProducts === 'function') {
            loadAllProducts();
        }
    }
});
