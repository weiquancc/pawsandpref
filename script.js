// Configuration
const TOTAL_CATS = 15;
const CATAAS_API = 'https://cataas.com/cat';

// State
let cats = [];
let currentIndex = 0;
let likedCats = [];
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let isDragging = false;
let isAnimating = false; // Prevent multiple button clicks during animation
let currentCard = null;
let currentOverlay = null;

// DOM Elements
const cardStack = document.getElementById('cardStack');
const loading = document.getElementById('loading');
const actionButtons = document.getElementById('actionButtons');
const likeBtn = document.getElementById('likeBtn');
const dislikeBtn = document.getElementById('dislikeBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const summaryModal = document.getElementById('summaryModal');
const summaryStats = document.getElementById('summaryStats');
const likedCatsGrid = document.getElementById('likedCatsGrid');
const restartBtn = document.getElementById('restartBtn');

// Initialize
async function init() {
    await loadCats();
    renderCards();
    setupEventListeners();
    updateProgress();
}

// Load cats from Cataas API
async function loadCats() {
    try {
        const promises = [];
        for (let i = 0; i < TOTAL_CATS; i++) {
            // Add random query to get different cats
            const url = `${CATAAS_API}?random=${Date.now()}-${i}`;
            promises.push(fetch(url).then(res => res.blob()));
        }
        
        const blobs = await Promise.all(promises);
        cats = blobs.map((blob, index) => ({
            id: index,
            url: URL.createObjectURL(blob),
            liked: false
        }));
        
        loading.style.display = 'none';
        actionButtons.style.display = 'flex';
    } catch (error) {
        console.error('Error loading cats:', error);
        loading.innerHTML = '<p>Error loading cats. Please refresh the page.</p>';
    }
}

// Render cards
function renderCards() {
    // Don't render if we're in the middle of a drag
    if (isDragging) return;
    
    cardStack.innerHTML = '';
    
    // Show up to 3 cards at a time
    const cardsToShow = Math.min(3, cats.length - currentIndex);
    
    for (let i = 0; i < cardsToShow; i++) {
        const catIndex = currentIndex + i;
        if (catIndex >= cats.length) break;
        
        const cat = cats[catIndex];
        const card = createCard(cat, i);
        cardStack.appendChild(card);
    }
    
    // Set currentCard to the top card (first one)
    currentCard = cardStack.querySelector('.cat-card');
    
    // Verify the overlay exists on the new currentCard and store reference
    if (currentCard) {
        currentOverlay = currentCard.querySelector('.cat-card-overlay');
        if (!currentOverlay && currentCard.children.length > 1) {
            const secondChild = currentCard.children[1];
            if (secondChild && secondChild.classList.contains('cat-card-overlay')) {
                currentOverlay = secondChild;
            }
        }
        if (!currentOverlay) {
            currentOverlay = document.createElement('div');
            currentOverlay.className = 'cat-card-overlay';
            currentCard.appendChild(currentOverlay);
        }
    } else {
        currentOverlay = null;
    }
}

// Create a card element
function createCard(cat, index) {
    const card = document.createElement('div');
    card.className = 'cat-card';
    card.style.zIndex = cats.length - currentIndex - index;
    card.style.transform = `scale(${1 - index * 0.05}) translateY(${index * 10}px)`;
    
    const img = document.createElement('img');
    img.src = cat.url;
    img.alt = 'Cat';
    img.className = 'cat-image';
    
    const overlay = document.createElement('div');
    overlay.className = 'cat-card-overlay';
    
    card.appendChild(img);
    card.appendChild(overlay);
    
    return card;
}

// Setup event listeners
function setupEventListeners() {
    // Button clicks
    likeBtn.addEventListener('click', () => handleLike());
    dislikeBtn.addEventListener('click', () => handleDislike());
    restartBtn.addEventListener('click', () => restart());
    
    // Touch events for mobile
    cardStack.addEventListener('touchstart', handleTouchStart, { passive: true });
    cardStack.addEventListener('touchmove', handleTouchMove, { passive: true });
    cardStack.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Mouse events for desktop
    cardStack.addEventListener('mousedown', handleMouseDown);
    cardStack.addEventListener('mousemove', handleMouseMove);
    cardStack.addEventListener('mouseup', handleMouseEnd);
    cardStack.addEventListener('mouseleave', handleMouseEnd);
}

// Touch handlers
function handleTouchStart(e) {
    // Get the current top card
    const topCard = cardStack.querySelector('.cat-card');
    if (!topCard || isDragging) return;
    
    currentCard = topCard;
    
    // Get or create overlay and store reference
    currentOverlay = currentCard.querySelector('.cat-card-overlay');
    if (!currentOverlay && currentCard.children.length > 1) {
        // Check if second child is the overlay
        const secondChild = currentCard.children[1];
        if (secondChild && secondChild.classList.contains('cat-card-overlay')) {
            currentOverlay = secondChild;
        }
    }
    if (!currentOverlay) {
        // Create overlay if missing
        currentOverlay = document.createElement('div');
        currentOverlay.className = 'cat-card-overlay';
        currentCard.appendChild(currentOverlay);
    }
    
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isDragging = true;
    currentCard.classList.add('dragging');
}

function handleTouchMove(e) {
    if (!isDragging) return;
    const touch = e.touches[0];
    currentX = touch.clientX - startX;
    currentY = touch.clientY - startY;
    updateCardPosition();
}

function handleTouchEnd(e) {
    if (!isDragging) return;
    handleSwipeEnd();
}

// Mouse handlers
function handleMouseDown(e) {
    // Get the current top card
    const topCard = cardStack.querySelector('.cat-card');
    if (!topCard || e.button !== 0 || isDragging) return;
    
    currentCard = topCard;
    
    // Get or create overlay and store reference
    currentOverlay = currentCard.querySelector('.cat-card-overlay');
    if (!currentOverlay && currentCard.children.length > 1) {
        // Check if second child is the overlay
        const secondChild = currentCard.children[1];
        if (secondChild && secondChild.classList.contains('cat-card-overlay')) {
            currentOverlay = secondChild;
        }
    }
    if (!currentOverlay) {
        // Create overlay if missing
        currentOverlay = document.createElement('div');
        currentOverlay.className = 'cat-card-overlay';
        currentCard.appendChild(currentOverlay);
    }
    
    startX = e.clientX;
    startY = e.clientY;
    isDragging = true;
    currentCard.classList.add('dragging');
    e.preventDefault();
}

function handleMouseMove(e) {
    if (!isDragging) return;
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
    updateCardPosition();
}

function handleMouseEnd(e) {
    if (!isDragging) return;
    handleSwipeEnd();
}

// Update card position during drag
function updateCardPosition() {
    // Ensure we have a valid card reference
    if (!currentCard || !currentCard.parentNode) {
        // If currentCard is invalid, get the top card
        currentCard = cardStack.querySelector('.cat-card');
        if (!currentCard) return;
        // Re-find overlay if card changed
        currentOverlay = currentCard.querySelector('.cat-card-overlay');
    }
    
    if (!currentOverlay) {
        // Try to find overlay again
        currentOverlay = currentCard.querySelector('.cat-card-overlay');
        if (!currentOverlay && currentCard.children.length > 1) {
            currentOverlay = currentCard.children[1];
        }
        if (!currentOverlay) {
            // Create if still not found
            currentOverlay = document.createElement('div');
            currentOverlay.className = 'cat-card-overlay';
            currentCard.appendChild(currentOverlay);
        }
    }
    
    const rotation = currentX * 0.1;
    const opacity = 1 - Math.abs(currentX) / 300;
    
    // Update card transform
    currentCard.style.transform = `translateX(${currentX}px) translateY(${currentY}px) rotate(${rotation}deg)`;
    currentCard.style.opacity = Math.max(0.5, opacity);
    
    // Update overlay based on swipe direction using stored reference
    if (currentOverlay) {
        // Reset classes
        currentOverlay.className = 'cat-card-overlay';
        currentOverlay.textContent = '';
        
        if (currentX > 50) {
            currentOverlay.classList.add('like');
            currentOverlay.textContent = 'LIKE';
        } else if (currentX < -50) {
            currentOverlay.classList.add('dislike');
            currentOverlay.textContent = 'PASS';
        }
    }
}

// Handle swipe end
function handleSwipeEnd() {
    // Ensure we have the current top card
    const topCard = cardStack.querySelector('.cat-card');
    if (!topCard) {
        isDragging = false;
        currentX = 0;
        currentY = 0;
        currentOverlay = null;
        return;
    }
    
    currentCard = topCard;
    
    const threshold = 100;
    const velocity = Math.abs(currentX);
    
    if (velocity > threshold) {
        if (currentX > 0) {
            handleSwipeLike();
        } else {
            handleSwipeDislike();
        }
    } else {
        // Snap back - restore to initial position (scale 1, no translate)
        currentCard.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        currentCard.style.transform = 'scale(1) translateY(0px)';
        currentCard.style.opacity = '';
        currentCard.classList.remove('dragging');
        
        // Reset overlay using stored reference
        if (currentOverlay) {
            currentOverlay.className = 'cat-card-overlay';
            currentOverlay.textContent = '';
        }
        
        // Remove transition after animation
        setTimeout(() => {
            if (currentCard) {
                currentCard.style.transition = '';
            }
        }, 300);
    }
    
    // Reset
    isDragging = false;
    currentX = 0;
    currentY = 0;
    currentOverlay = null;
}

// Handle swipe like (fast, no delay)
function handleSwipeLike() {
    if (currentIndex >= cats.length) return;
    
    const cat = cats[currentIndex];
    cat.liked = true;
    likedCats.push(cat);
    
    swipeCard('like');
    moveToNext();
}

// Handle swipe dislike (fast, no delay)
function handleSwipeDislike() {
    if (currentIndex >= cats.length) return;
    
    swipeCard('dislike');
    moveToNext();
}

// Handle like button click (with delay for visibility)
function handleLike() {
    // Prevent multiple clicks during animation
    if (isAnimating || currentIndex >= cats.length || isDragging) return;
    
    // Get current card and overlay
    const topCard = cardStack.querySelector('.cat-card');
    if (!topCard) return;
    
    // Set animating flag
    isAnimating = true;
    
    currentCard = topCard;
    currentOverlay = currentCard.querySelector('.cat-card-overlay');
    
    // If overlay not found, try to get it from children
    if (!currentOverlay && currentCard.children.length > 1) {
        const secondChild = currentCard.children[1];
        if (secondChild && secondChild.classList.contains('cat-card-overlay')) {
            currentOverlay = secondChild;
        }
    }
    
    // Create overlay if it doesn't exist
    if (!currentOverlay) {
        currentOverlay = document.createElement('div');
        currentOverlay.className = 'cat-card-overlay';
        currentCard.appendChild(currentOverlay);
    }
    
    // Ensure card is visible and reset any previous transforms
    currentCard.style.transition = '';
    currentCard.style.transform = '';
    currentCard.style.opacity = '';
    currentCard.classList.remove('dragging');
    
    // Show LIKE overlay first - force display
    currentOverlay.className = 'cat-card-overlay like';
    currentOverlay.textContent = 'LIKE';
    currentOverlay.style.display = 'flex'; // Ensure it's visible
    
    const cat = cats[currentIndex];
    cat.liked = true;
    likedCats.push(cat);
    
    // Wait a bit so user can see the overlay, then animate
    setTimeout(() => {
        // Verify card still exists before animating
        if (!currentCard || !currentCard.parentNode) {
            isAnimating = false;
            return;
        }
        
        // Animate card to the right with longer duration
        currentCard.style.transition = 'transform 0.6s ease, opacity 0.6s ease';
        currentCard.style.transform = 'translateX(150%) rotate(30deg)';
        currentCard.style.opacity = '0';
        
        // Wait for animation to complete, then remove card and move to next
        setTimeout(() => {
            if (currentCard && currentCard.parentNode) {
                currentCard.remove();
            }
            isAnimating = false;
            moveToNext();
        }, 600);
    }, 400);
}

// Handle dislike
function handleDislike() {
    // Prevent multiple clicks during animation
    if (isAnimating || currentIndex >= cats.length || isDragging) return;
    
    // Get current card and overlay
    const topCard = cardStack.querySelector('.cat-card');
    if (!topCard) return;
    
    // Set animating flag
    isAnimating = true;
    
    currentCard = topCard;
    currentOverlay = currentCard.querySelector('.cat-card-overlay');
    
    // If overlay not found, try to get it from children
    if (!currentOverlay && currentCard.children.length > 1) {
        const secondChild = currentCard.children[1];
        if (secondChild && secondChild.classList.contains('cat-card-overlay')) {
            currentOverlay = secondChild;
        }
    }
    
    // Create overlay if it doesn't exist
    if (!currentOverlay) {
        currentOverlay = document.createElement('div');
        currentOverlay.className = 'cat-card-overlay';
        currentCard.appendChild(currentOverlay);
    }
    
    // Ensure card is visible and reset any previous transforms
    currentCard.style.transition = '';
    currentCard.style.transform = '';
    currentCard.style.opacity = '';
    currentCard.classList.remove('dragging');
    
    // Show PASS overlay first - force display
    currentOverlay.className = 'cat-card-overlay dislike';
    currentOverlay.textContent = 'PASS';
    currentOverlay.style.display = 'flex'; // Ensure it's visible
    
    // Wait a bit so user can see the overlay, then animate
    setTimeout(() => {
        // Verify card still exists before animating
        if (!currentCard || !currentCard.parentNode) {
            isAnimating = false;
            return;
        }
        
        // Animate card to the left with longer duration
        currentCard.style.transition = 'transform 0.6s ease, opacity 0.6s ease';
        currentCard.style.transform = 'translateX(-150%) rotate(-30deg)';
        currentCard.style.opacity = '0';
        
        // Wait for animation to complete, then remove card and move to next
        setTimeout(() => {
            if (currentCard && currentCard.parentNode) {
                currentCard.remove();
            }
            isAnimating = false;
            moveToNext();
        }, 600);
    }, 400);
}

// Swipe card animation
function swipeCard(direction) {
    if (!currentCard) return;
    
    currentCard.classList.add(direction);
    
    setTimeout(() => {
        if (currentCard && currentCard.parentNode) {
            currentCard.remove();
        }
    }, 300);
}

// Move to next card
function moveToNext() {
    currentIndex++;
    updateProgress();
    
    // Reset drag and animation state
    isDragging = false;
    isAnimating = false;
    currentX = 0;
    currentY = 0;
    currentOverlay = null;
    currentCard = null;
    
    if (currentIndex >= cats.length) {
        setTimeout(() => showSummary(), 500);
    } else {
        setTimeout(() => {
            renderCards();
            // Ensure currentCard is set after rendering
            currentCard = cardStack.querySelector('.cat-card');
            if (currentCard) {
                currentOverlay = currentCard.querySelector('.cat-card-overlay');
            }
        }, 100);
    }
}

// Update progress
function updateProgress() {
    const progress = (currentIndex / cats.length) * 100;
    
    let progressFill = progressBar.querySelector('.progress-fill');
    if (!progressFill) {
        progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressBar.appendChild(progressFill);
    }
    progressFill.style.width = `${progress}%`;
    
    progressText.textContent = `${currentIndex} / ${cats.length}`;
}

// Show summary
function showSummary() {
    summaryStats.textContent = `You liked ${likedCats.length} out of ${cats.length} cats!`;
    
    likedCatsGrid.innerHTML = '';
    if (likedCats.length === 0) {
        likedCatsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">No cats were liked. Try again!</p>';
    } else {
        likedCats.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'liked-cat-item';
            const img = document.createElement('img');
            img.src = cat.url;
            img.alt = 'Liked cat';
            item.appendChild(img);
            likedCatsGrid.appendChild(item);
        });
    }
    
    summaryModal.classList.add('show');
}

// Restart
function restart() {
    currentIndex = 0;
    likedCats = [];
    isDragging = false;
    isAnimating = false;
    currentX = 0;
    currentY = 0;
    currentCard = null;
    currentOverlay = null;
    summaryModal.classList.remove('show');
    renderCards();
    updateProgress();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

