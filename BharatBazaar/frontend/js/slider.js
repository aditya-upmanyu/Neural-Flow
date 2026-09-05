/* ===================================
   IMAGE SLIDER MODULE
   Product Image Carousel with Dots
   =================================== */

let currentSlide = 0;
let totalSlides = 0;

// Initialize Slider
function initSlider() {
    const slides = document.querySelectorAll('.slider-image');
    totalSlides = slides.length;
    
    if (totalSlides > 0) {
        showSlide(0);
    }
}

// Show Specific Slide
function showSlide(index) {
    const slides = document.querySelectorAll('.slider-image');
    const dots = document.querySelectorAll('.dot');
    
    if (index >= totalSlides) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = totalSlides - 1;
    } else {
        currentSlide = index;
    }
    
    // Hide all slides
    slides.forEach(slide => {
        slide.classList.remove('active');
    });
    
    // Remove active from all dots
    dots.forEach(dot => {
        dot.classList.remove('active');
    });
    
    // Show current slide
    if (slides[currentSlide]) {
        slides[currentSlide].classList.add('active');
    }
    
    // Activate current dot
    if (dots[currentSlide]) {
        dots[currentSlide].classList.add('active');
    }
}

// Go to Specific Slide
function goToSlide(index) {
    showSlide(index);
}

// Next Slide
function nextSlide() {
    showSlide(currentSlide + 1);
}

// Previous Slide
function prevSlide() {
    showSlide(currentSlide - 1);
}

// Auto-play slider (optional)
function startAutoPlay(interval = 5000) {
    setInterval(() => {
        nextSlide();
    }, interval);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        prevSlide();
    } else if (e.key === 'ArrowRight') {
        nextSlide();
    }
});

// Touch/Swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}

function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
        nextSlide(); // Swipe left
    }
    if (touchEndX > touchStartX + 50) {
        prevSlide(); // Swipe right
    }
}

// Add touch listeners to slider
window.addEventListener('DOMContentLoaded', () => {
    const sliderContainer = document.getElementById('sliderContainer');
    if (sliderContainer) {
        sliderContainer.addEventListener('touchstart', handleTouchStart);
        sliderContainer.addEventListener('touchend', handleTouchEnd);
        initSlider();
    }
});
