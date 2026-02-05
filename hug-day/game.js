const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const teddyOpen = document.getElementById('teddy-open');
const teddyClosed = document.getElementById('teddy-closed');

// --- Game State ---
let gameState = {
    isRunning: false, // Wait for start
    hugsCollected: 0,
    targetHugs: 10,
    hearts: [],
    particles: [],
    lastSpawnTime: 0,
    spawnInterval: 2500, // Increased to reduce heart density
    gameStartTime: 0,
    lastHugTime: 0, // For cooldown
    hugCooldown: 800, // Milliseconds between hugs
    isWon: false // Win state flag for animation
};

// --- Assets ---
const assets = {
    red: new Image(),
    gold: new Image(),
    broken: new Image()
};
assets.red.src = 'assets/heart_red.png';
assets.gold.src = 'assets/heart_gold.png';
assets.broken.src = 'assets/heart_broken.png';

// --- Constants ---
const GRAVITY = 0.1; // Slightly faster for responsiveness
const TERMINAL_VELOCITY = 3;

// --- Resize ---
function resize() {
    const gameArea = document.getElementById('game-area');
    canvas.width = gameArea.clientWidth;
    canvas.height = gameArea.clientHeight;
}
window.addEventListener('resize', resize);
resize();

// --- Input ---
// We click on the canvas (game area)
canvas.addEventListener('click', handleInput);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput(e);
});

function handleInput(e) {
    if (!gameState.isRunning) return;

    // Check cooldown
    const now = Date.now();
    if (now - gameState.lastHugTime < gameState.hugCooldown) {
        // Still on cooldown, ignore click
        return;
    }

    // Valid Click! Trigger animation immediately
    animateTeddyHug();
    gameState.lastHugTime = now;

    // Get click coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX || e.touches[0].clientX) - rect.left;
    const clickY = (e.clientY || e.touches[0].clientY) - rect.top;

    // Check collision with hearts
    // We'll iterate backwards to hit top-most heart if overlapping
    let hitIndex = -1;

    for (let i = gameState.hearts.length - 1; i >= 0; i--) {
        const h = gameState.hearts[i];
        const dist = Math.hypot(h.x - clickX, h.y - clickY);

        // Heart radius approx 25px (since drawn 50x50)
        // Give a very generous hit area so user can click anytime
        if (dist < 60) {
            hitIndex = i;
            break;
        }
    }

    if (hitIndex !== -1) {
        const heart = gameState.hearts[hitIndex];

        if (heart.type === 'broken') {
            triggerSadness();
            destroyHeart(hitIndex);
        } else {
            triggerHug(heart);
            destroyHeart(hitIndex);
        }
    }
}

function spawnHeart() {
    const rand = Math.random();
    let type = 'red';
    // 5% gold, 20% broken, 75% red
    if (rand > 0.95) type = 'gold';
    else if (rand > 0.75) type = 'broken';

    // Random X concentrated in the middle
    // 30% width spread in the center
    const spread = canvas.width * 0.3;
    const startX = (canvas.width - spread) / 2;
    const x = startX + Math.random() * spread;

    gameState.hearts.push({
        x: x,
        y: -50,
        type: type,
        speed: 0,
        active: true,
        rotation: (Math.random() - 0.5) * 0.5,
        rotSpeed: (Math.random() - 0.5) * 0.05
    });
}

function spawnFloatingHeart() {
    // Spawn at center-bottom of canvas
    const centerX = canvas.width / 2;
    const bottomY = canvas.height * 0.8;

    gameState.particles.push({
        x: centerX + (Math.random() - 0.5) * 80,
        y: bottomY + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * 2,
        life: 2.0,
        color: Math.random() > 0.5 ? '#ff4d4d' : '#ff69b4',
        isFloating: true
    });
}

// Separate function for teddy animation
function animateTeddyHug() {
    teddyOpen.style.display = 'none';
    teddyClosed.style.display = 'block';

    // Only revert back to open if NOT in won state
    setTimeout(() => {
        if (!gameState.isWon) {
            teddyOpen.style.display = 'block';
            teddyClosed.style.display = 'none';
        }
    }, 500);
}

function triggerHug(heart) {

    // Score
    let points = heart.type === 'gold' ? 2 : 1;
    gameState.hugsCollected = Math.min(gameState.targetHugs, gameState.hugsCollected + points);
    updateCounter();

    // Particles
    let particleCount = heart.type === 'gold' ? 15 : 8;
    for (let i = 0; i < particleCount; i++) {
        gameState.particles.push({
            x: heart.x,
            y: heart.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 1.0,
            color: heart.type === 'gold' ? '#FFD700' : '#FF69B4'
        });
    }

    if (gameState.hugsCollected >= gameState.targetHugs) {
        winGame();
    }
}

function triggerSadness() {
    // Screen Shake
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 500);
}

function destroyHeart(index) {
    gameState.hearts.splice(index, 1);
}

function updateCounter() {
    scoreEl.innerText = gameState.hugsCollected;
}

function winGame() {
    gameState.isRunning = false;
    gameState.isWon = true; // New flag for win state animation

    // 1. Force Teddy into Hugging State (Closed) and keep him there
    teddyOpen.style.display = 'none';
    teddyClosed.style.display = 'block';

    // 2. Clear falling hearts immediately (optional, or let them fall off)
    // Let's clear them to focus on floating
    gameState.hearts = [];

    // 3. Trigger Floating Hearts Effect (handled in loop or separate interval)
    // We'll let the loop handling floating hearts if isWon is true

    // 4. Delay Popup (4 seconds)
    setTimeout(() => {
        const popup = document.getElementById('win-screen');
        popup.classList.remove('hidden');
        popup.classList.add('show');
    }, 4000);
}

// --- Loop ---
function loop() {
    // If not running, check if we should keep looping (e.g. for particles) or stop
    if (!gameState.isRunning && gameState.gameStartTime === 0) {
        // Not started yet
        requestAnimationFrame(loop);
        return;
    }

    // If won, keep updating for floating hearts animation!
    if (!gameState.isRunning && !gameState.isWon && document.getElementById('win-screen').classList.contains('hidden')) {
        // Paused logic
    }
    // But we need to ensure we don't return early if isWon is true
    if (!gameState.isRunning && !gameState.isWon && gameState.gameStartTime !== 0) {
        // If simply paused and NOT won, return? 
        // Actually, our previous logic was checking if win screen is hidden.
        // If win screen is hidden AND we are NOT running AND NOT won... stop.
        requestAnimationFrame(loop);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();

    // Spawning (Only if running)
    if (gameState.isRunning) {
        if (now - gameState.lastSpawnTime > gameState.spawnInterval) {
            spawnHeart();
            gameState.lastSpawnTime = now;
            gameState.spawnInterval = Math.max(1200, 2500 - (gameState.hugsCollected * 120));
        }
    } else if (gameState.isWon) {
        // Floating Heart Spawning during Win State
        if (now - gameState.lastSpawnTime > 300) { // Frequent spawn
            spawnFloatingHeart();
            gameState.lastSpawnTime = now;
        }
    }

    // Update & Draw Hearts
    for (let i = gameState.hearts.length - 1; i >= 0; i--) {
        const h = gameState.hearts[i];

        // Only move if running
        if (gameState.isRunning) {
            h.speed += GRAVITY;
            if (h.speed > TERMINAL_VELOCITY) h.speed = TERMINAL_VELOCITY;
            h.y += h.speed;
            h.rotation += h.rotSpeed;
        }

        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rotation);
        let img = assets[h.type];
        if (img.complete) {
            if (h.type === 'gold') {
                ctx.shadowBlur = 15;
                ctx.shadowColor = 'gold';
            }
            ctx.drawImage(img, -25, -25, 50, 50);
            ctx.shadowBlur = 0;
        }
        ctx.restore();

        // OOB
        if (h.y > canvas.height + 50) {
            gameState.hearts.splice(i, 1);
        }
    }

    // Update & Draw Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.isFloating) {
            p.life -= 0.01; // Slower fade
            p.x += Math.sin(Date.now() / 200) * 0.5; // Wiggle
        } else {
            p.life -= 0.03;
            p.vy += 0.1;
        }

        if (p.life > 0) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();

            if (p.isFloating) {
                // Draw mini heart using asset
                let size = 30;
                if (assets.red.complete) {
                    ctx.drawImage(assets.red, p.x - size / 2, p.y - size / 2, size, size);
                }
            } else {
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;
        } else {
            gameState.particles.splice(i, 1);
        }
    }

    requestAnimationFrame(loop);
}


// --- Init Event ---
const startBtn = document.getElementById('start-btn');
const startTitle = document.getElementById('start-title');
const startScreen = document.getElementById('start-screen');
const overlay = document.getElementById('transition-overlay');

// === Transition Sequence ===
if (overlay) {
    overlay.classList.add('overlay-fall');
    setTimeout(() => {
        overlay.style.display = 'none';
        if (startTitle) startTitle.classList.add('anim-title-enter');
        if (startBtn) startBtn.classList.add('anim-btn-enter');
    }, 1000);
} else {
    if (startTitle) startTitle.classList.add('anim-title-enter');
    if (startBtn) startBtn.classList.add('anim-btn-enter');
}

const charGuide = document.getElementById('character-guide');
const textBubble = document.getElementById('text-bubble');

startBtn.addEventListener('click', () => {
    // Trigger Exit Animations
    startTitle.classList.add('title-exit');
    startBtn.classList.add('btn-exit');
    startScreen.classList.add('screen-exit');

    // Wait for animation to finish before hiding screen
    setTimeout(() => {
        startScreen.classList.add('hidden');
        document.getElementById('teddy-container').classList.remove('teddy-hidden'); // Slide in!

        // Reveal Guide and Bubble
        if (charGuide) charGuide.classList.remove('hidden');
        if (textBubble) textBubble.classList.remove('hidden');

        gameState.isRunning = true;
        gameState.gameStartTime = Date.now();
        gameState.hugsCollected = 0;
        gameState.hearts = [];
        gameState.particles = [];
        updateCounter();
        spawnHeart(); // Initial spawn
    }, 800); // Match animation duration (0.8s)
});

// Calendar button click
document.getElementById('calendar-btn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Start loop
resize();
updateCounter();
loop();
