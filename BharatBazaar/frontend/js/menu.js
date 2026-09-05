/* ===================================
   HAMBURGER MENU MODULE
   Responsive Navigation Toggle
   =================================== */

// Toggle Mobile Menu
function toggleMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (navMenu && navMenu.classList.contains('active')) {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            toggleMenu();
        }
    }
});

// Close menu when clicking on a menu item
document.addEventListener('DOMContentLoaded', () => {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        const menuItems = navMenu.querySelectorAll('a');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    toggleMenu();
                }
            });
        });
    }
});

// Handle window resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const navMenu = document.getElementById('navMenu');
        const hamburger = document.querySelector('.hamburger');
        
        // Close menu on desktop view
        if (window.innerWidth > 768) {
            if (navMenu) navMenu.classList.remove('active');
            if (hamburger) hamburger.classList.remove('active');
            document.body.style.overflow = '';
        }
    }, 250);
});
