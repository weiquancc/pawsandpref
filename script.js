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
let currentCard = null;

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
    
    currentCard = cardStack.querySelector('.cat-card');
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
    if (!currentCard || isDragging) return;
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isDragging = true;
    currentCard.classList.add('dragging');
}

function handleTouchMove(e) {
    if (!isDragging || !currentCard) return;
    const touch = e.touches[0];
    currentX = touch.clientX - startX;
    currentY = touch.clientY - startY;
    updateCardPosition();
}

function handleTouchEnd(e) {
    if (!isDragging || !currentCard) return;
    handleSwipeEnd();
}

// Mouse handlers
function handleMouseDown(e) {
    if (!currentCard || e.button !== 0 || isDragging) return;
    startX = e.clientX;
    startY = e.clientY;
    isDragging = true;
    currentCard.classList.add('dragging');
    e.preventDefault();
}

function handleMouseMove(e) {
    if (!isDragging || !currentCard) return;
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
    updateCardPosition();
}

function handleMouseEnd(e) {
    if (!isDragging || !currentCard) return;
    handleSwipeEnd();
}

// Update card position during drag
function updateCardPosition() {
    if (!currentCard) return;
    
    const rotation = currentX * 0.1;
    const opacity = 1 - Math.abs(currentX) / 300;
    
    currentCard.style.transform = `translateX(${currentX}px) translateY(${currentY}px) rotate(${rotation}deg)`;
    currentCard.style.opacity = Math.max(0.5, opacity);
    
    // Show overlay based on direction
    const overlay = currentCard.querySelector('.cat-card-overlay');
    overlay.className = 'cat-card-overlay';
    
    if (currentX > 50) {
        overlay.classList.add('like');
        overlay.textContent = 'LIKE';
    } else if (currentX < -50) {
        overlay.classList.add('dislike');
        overlay.textContent = 'PASS';
    }
}

// Handle swipe end
function handleSwipeEnd() {
    if (!currentCard) return;
    
    const threshold = 100;
    const velocity = Math.abs(currentX);
    
    if (velocity > threshold) {
        if (currentX > 0) {
            handleLike();
        } else {
            handleDislike();
        }
    } else {
        // Snap back
        currentCard.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        currentCard.style.transform = '';
        currentCard.style.opacity = '';
        currentCard.classList.remove('dragging');
        const overlay = currentCard.querySelector('.cat-card-overlay');
        overlay.className = 'cat-card-overlay';
        
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
}

// Handle like
function handleLike() {
    if (currentIndex >= cats.length) return;
    
    const cat = cats[currentIndex];
    cat.liked = true;
    likedCats.push(cat);
    
    swipeCard('like');
    moveToNext();
}

// Handle dislike
function handleDislike() {
    if (currentIndex >= cats.length) return;
    
    swipeCard('dislike');
    moveToNext();
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
    
    if (currentIndex >= cats.length) {
        setTimeout(() => showSummary(), 500);
    } else {
        setTimeout(() => {
            renderCards();
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
    summaryModal.classList.remove('show');
    renderCards();
    updateProgress();
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

