/* ===================================
   AUTHENTICATION MODULE
   Login, Signup, Logout, Role-Based Redirect
   =================================== */

// Handle Login Form Submission
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.querySelector('input[name="role"]:checked').value;
    
    // Show loading
    showButtonLoader('btnText', 'btnLoader');
    
    try {
        // In production, make API call to backend
        // const response = await fetch(`${API_BASE_URL}/auth/login`, {...});
        
        // Simulate API call
        await delay(1000);
        
        // Mock authentication (replace with real API)
        if (password.length >= 6) {
            // Store user data
            const userData = {
                email: email,
                role: role,
                token: 'mock_token_' + Date.now(),
                userName: email.split('@')[0],
                userPhone: '+91 98765 43210'
            };
            
            localStorage.setItem('userToken', userData.token);
            localStorage.setItem('userRole', userData.role);
            localStorage.setItem('userName', userData.userName);
            localStorage.setItem('userEmail', userData.email);
            localStorage.setItem('userPhone', userData.userPhone);
            
            showMessage('Login successful! Redirecting...', 'success');
            
            // Role-based redirect
            setTimeout(() => {
                redirectBasedOnRole(role);
            }, 1000);
        } else {
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        hideButtonLoader('btnText', 'btnLoader');
        showMessage(error.message || 'Login failed. Please try again.', 'error');
    }
}

// Handle Signup Form Submission
async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.querySelector('input[name="role"]:checked').value;
    
    // Validation
    if (password !== confirmPassword) {
        showMessage('Passwords do not match!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Show loading
    showButtonLoader('btnText', 'btnLoader');
    
    try {
        // In production, make API call to backend
        // const response = await fetch(`${API_BASE_URL}/auth/signup`, {...});
        
        // Simulate API call
        await delay(1500);
        
        // Store user data
        const userData = {
            name: name,
            email: email,
            phone: phone,
            role: role,
            token: 'mock_token_' + Date.now()
        };
        
        localStorage.setItem('userToken', userData.token);
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userName', userData.name);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userPhone', userData.phone);
        
        showMessage('Account created successfully! Redirecting...', 'success');
        
        // Role-based redirect
        setTimeout(() => {
            redirectBasedOnRole(role);
        }, 1000);
    } catch (error) {
        hideButtonLoader('btnText', 'btnLoader');
        showMessage(error.message || 'Signup failed. Please try again.', 'error');
    }
}

// Role-Based Redirect
function redirectBasedOnRole(role) {
    switch(role) {
        case 'customer':
            window.location.href = 'customer-home.html';
            break;
        case 'seller':
            window.location.href = 'seller-dashboard.html';
            break;
        case 'salesperson':
            window.location.href = 'salesperson-dashboard.html';
            break;
        default:
            window.location.href = 'index.html';
    }
}

// Check Authentication
function checkAuth() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Check Role Authorization
function checkRole(requiredRole) {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== requiredRole) {
        alert('Unauthorized access!');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Logout Function
function logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');
    window.location.href = 'login.html';
}

// Show Message
function showMessage(message, type) {
    const successDiv = document.getElementById('successMessage');
    const errorDiv = document.getElementById('errorMessage');
    
    if (type === 'success' && successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        errorDiv.style.display = 'none';
    } else if (type === 'error' && errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
    }
}

// Button Loader Helpers
function showButtonLoader(textId, loaderId) {
    const textEl = document.getElementById(textId);
    const loaderEl = document.getElementById(loaderId);
    if (textEl) textEl.style.display = 'none';
    if (loaderEl) loaderEl.style.display = 'inline-block';
}

function hideButtonLoader(textId, loaderId) {
    const textEl = document.getElementById(textId);
    const loaderEl = document.getElementById(loaderId);
    if (textEl) textEl.style.display = 'inline-block';
    if (loaderEl) loaderEl.style.display = 'none';
}

// Delay Helper
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize auth check on protected pages
window.addEventListener('DOMContentLoaded', () => {
    const protectedPages = [
        'customer-home.html',
        'product-detail.html',
        'cart.html',
        'checkout.html',
        'seller-dashboard.html',
        'seller-products.html',
        'seller-links.html',
        'seller-queue.html',
        'seller-rooms.html',
        'seller-analytics.html',
        'salesperson-dashboard.html',
        'live-room.html'
    ];
    
    const currentPage = window.location.pathname.split('/').pop();
    if (protectedPages.includes(currentPage)) {
        checkAuth();
    }
});
