const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Configuration ---
const CONFIG = {
    laneCount: 3,
    gameDuration: 30, // seconds
    obstacleSpeed: 5,
    obstacleSpawnRate: 1500, // ms
    playerX: 350, // Moved right to ensure Left-to-Right intro flow
};

// --- Assets ---
const assets = {
    boy: document.getElementById('asset-boy'),
    girl: document.getElementById('asset-girl'),
    heart: document.getElementById('asset-heart'),
    clouds: [
        document.getElementById('asset-cloud1'),
        document.getElementById('asset-cloud2'),
        document.getElementById('asset-cloud3'),
        document.getElementById('asset-cloud4'),
    ],
    sky: document.getElementById('asset-sky')
};

// --- State Management ---
const STATES = {
    LOADING: 0,
    INTRO: 1,
    PLAYING: 2,
    GAMEOVER: 3,
    WIN: 4
};

let gameState = {
    current: STATES.LOADING,
    timer: 0,
    score: 0,
    frames: 0,
    obstacles: [],
    particles: [], // Array for particle effects
    laneHeight: 0,
    lanes: [], // Y-coordinates of the 3 lanes
    introTime: 0,
    winTime: 0,

    // Camera System
    camera: {
        x: 0,
        y: 0,
        zoom: 1,
        targetZoom: 1
    },
    introParticlesTriggered: false
};

// --- Input Handling ---
let currentLane = 1; // 0, 1, 2 (Top, Center, Bottom)

window.addEventListener('keydown', (e) => {
    if (gameState.current !== STATES.PLAYING) return;

    if (e.key === 'ArrowUp') {
        movePlayer(-1);
    } else if (e.key === 'ArrowDown') {
        movePlayer(1);
    }
});

// Touch controls
canvas.addEventListener('touchstart', (e) => {
    if (gameState.current !== STATES.PLAYING) return;
    const rect = canvas.getBoundingClientRect();
    const touchY = e.touches[0].clientY - rect.top;

    if (touchY < canvas.height / 2) {
        movePlayer(-1); // Tap top -> Up
    } else {
        movePlayer(1); // Tap bottom -> Down
    }
    e.preventDefault();
});

function movePlayer(direction) {
    currentLane += direction;
    if (currentLane < 0) currentLane = 0;
    if (currentLane > 2) currentLane = 2;
}

// --- Game Objects ---

// Particle Class for Effects
class Particle {
    constructor(x, y, color, speed, size, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
        this.size = size;
        this.life = life;
        this.maxLife = life;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
        this.size *= 0.95; // Shrink
    }

    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Player {
    constructor() {
        this.y = gameState.lanes[1];
        this.targetY = gameState.lanes[1];
        // Read from CSS
        const style = getComputedStyle(document.documentElement);
        this.baseHeight = parseInt(style.getPropertyValue('--heart-size')) || 60;
    }

    update() {
        this.targetY = gameState.lanes[currentLane];
        // Smooth lerp for movement
        this.y += (this.targetY - this.y) * 0.2;
    }

    draw() {
        // Draw Heart
        ctx.globalAlpha = 1;
        // Float effect
        const floatY = Math.sin(Date.now() / 200) * 5;

        let width = this.baseHeight;
        let height = this.baseHeight;

        if (assets.heart.naturalWidth) {
            const aspect = assets.heart.naturalWidth / assets.heart.naturalHeight;
            width = this.baseHeight * aspect;
        }

        ctx.drawImage(
            assets.heart,
            CONFIG.playerX - width / 2,
            this.y - height / 2 + floatY,
            width,
            height
        );
        this.width = width; // Store for collision
        this.height = height;
    }
}

class Obstacle {
    constructor() {
        // Random lane
        this.laneIndex = Math.floor(Math.random() * 3);
        this.y = gameState.lanes[this.laneIndex];
        this.x = canvas.width + 100;
        this.speed = CONFIG.obstacleSpeed + (Math.random() * 2);
        this.img = assets.clouds[Math.floor(Math.random() * assets.clouds.length)];
        this.baseHeight = 80; // Fixed height, width will adjust
        this.active = true;
    }

    update() {
        this.x -= this.speed;
        if (this.x < -100) this.active = false;
    }

    draw() {
        let width = this.baseHeight;
        let height = this.baseHeight;

        if (this.img.naturalWidth) {
            const aspect = this.img.naturalWidth / this.img.naturalHeight;
            width = this.baseHeight * aspect;
        }

        ctx.drawImage(this.img, this.x - width / 2, this.y - height / 2, width, height);
        this.width = width;
        this.height = height;
    }

    checkCollision(player) {
        // Simple collision using stored dimensions
        // Box collision
        const pLeft = CONFIG.playerX - (player.width || 60) / 2;
        const pRight = CONFIG.playerX + (player.width || 60) / 2;
        const pTop = player.y - (player.height || 60) / 2;
        const pBottom = player.y + (player.height || 60) / 2;

        const oLeft = this.x - (this.width || 80) / 2 + 10; // Margin
        const oRight = this.x + (this.width || 80) / 2 - 10;
        const oTop = this.y - (this.height || 80) / 2 + 10;
        const oBottom = this.y + (this.height || 80) / 2 - 10;

        return (pLeft < oRight && pRight > oLeft && pTop < oBottom && pBottom > oTop);
    }
}

// --- Core Functions ---
let player;

function init() {
    resize();
    window.addEventListener('resize', resize);

    player = new Player();

    // UI Event Listeners
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

    startBtn.addEventListener('click', () => {
        // Trigger Exit Animations
        startTitle.classList.add('title-exit');
        startBtn.classList.add('btn-exit');
        startScreen.classList.add('screen-exit');

        // Wait for animation to finish before hiding screen
        setTimeout(() => {
            startIntro();
        }, 800);
    });
    document.getElementById('restart-btn').addEventListener('click', resetGame);
    document.getElementById('calendar-btn').addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    gameState.current = STATES.LOADING; // Wait for user start
    loop();
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Calculate Lanes (Top: 30%, Center: 50%, Bottom: 70%)
    gameState.laneHeight = canvas.height / 3;
    gameState.lanes = [
        canvas.height * 0.3,
        canvas.height * 0.5,
        canvas.height * 0.7
    ];
}

function startIntro() {
    document.getElementById('start-screen').classList.add('hidden');
    gameState.current = STATES.INTRO;
    gameState.introTime = Date.now();
    gameState.introParticlesTriggered = false; // Reset for new intro
}

function startGame() {
    gameState.current = STATES.PLAYING;
    gameState.timer = CONFIG.gameDuration;
    gameState.lastSpawnTime = 0;
    gameState.obstacles = [];
    currentLane = 1;
    player.y = gameState.lanes[1];

    document.getElementById('hud').classList.remove('hidden');
    updateProgress();
}

function resetGame() {
    document.getElementById('game-over-screen').classList.add('hidden');
    startGame();
}

function winGame() {
    gameState.current = STATES.WIN;
    gameState.winTime = Date.now();
    document.getElementById('hud').classList.add('hidden');

    // Show Popup after delay
    setTimeout(() => {
        document.getElementById('win-screen').classList.remove('hidden');
        document.getElementById('win-screen').classList.add('show');
    }, 4000); // 4s cinematic Outro
}

function gameOver() {
    gameState.current = STATES.GAMEOVER;
    document.getElementById('game-over-screen').classList.remove('hidden');

    // Shake effect
    canvas.style.transform = 'translate(5px, 5px)';
    setTimeout(() => canvas.style.transform = 'translate(-5px, -5px)', 50);
    setTimeout(() => canvas.style.transform = 'translate(5px, -5px)', 100);
    setTimeout(() => canvas.style.transform = 'none', 150);
}

// --- Loop ---
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

function update() {
    const now = Date.now();

    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.update();
        if (p.life <= 0) gameState.particles.splice(i, 1);
    }

    if (gameState.current === STATES.INTRO) {
        const elapsed = now - gameState.introTime;
        const duration = 4500; // Updated duration for new intro cinematic
        const t = Math.min(1, elapsed / duration);

        // Cinematic Camera Zoom (still applies, but less prominent)
        gameState.camera.zoom = 1 + Math.sin(t * Math.PI) * 0.1; // Reduced zoom effect
        gameState.camera.x = canvas.width / 2 * (1 - gameState.camera.zoom);
        gameState.camera.y = canvas.height / 2 * (1 - gameState.camera.zoom);

        // Trigger Particles when heart appears (at t ~ 0.5)
        if (elapsed > 1500 && !gameState.introParticlesTriggered) { // Trigger after boy slides in
            gameState.introParticlesTriggered = true;
            // Spawn Burst (this will be handled by the heart flow now)
        }

        if (elapsed > duration) {
            // Reset Camera
            gameState.camera.zoom = 1;
            gameState.camera.x = 0;
            gameState.camera.y = 0;
            startGame();
        }
    }

    if (gameState.current === STATES.PLAYING) {
        // Timer
        gameState.frames++;

        // Decrement timer every frame based on approximate delta time (1/60s)
        gameState.timer -= 0.016;

        // Continuous Progress Update
        updateProgress();

        // Occasional updates for Difficulty (every 60 frames ~ 1 sec)
        if (gameState.frames % 60 === 0) {
            // Increase difficulty slightly
            if (gameState.timer < 15) CONFIG.obstacleSpeed = 7;
        }

        if (gameState.timer <= 0) {
            winGame();
            return; // Stop updating play state
        }

        player.update();

        // Trail particles for player
        if (gameState.frames % 5 === 0) {
            gameState.particles.push(new Particle(
                CONFIG.playerX, player.y,
                'rgba(255, 255, 255, 0.5)',
                2, 3, 0.5
            ));
        }

        // Spawn Obstacles
        if (now - gameState.lastSpawnTime > CONFIG.obstacleSpawnRate) {
            gameState.obstacles.push(new Obstacle());
            gameState.lastSpawnTime = now;
            // Spawn rate increases slightly
            CONFIG.obstacleSpawnRate = Math.max(800, 1500 - (30 - gameState.timer) * 20);
        }

        // Update Obstacles & Collision
        for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
            const obs = gameState.obstacles[i];
            obs.update();

            if (obs.checkCollision(player)) {
                gameOver();
            }

            if (!obs.active) {
                gameState.obstacles.splice(i, 1);
            }
        }
    }

    if (gameState.current === STATES.WIN) {
        // Outro cinematic logic
        // Move heart to girl
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context for camera
    ctx.save();

    // Apply Camera Transform
    if (gameState.camera.zoom !== 1) {
        ctx.translate(gameState.camera.x, gameState.camera.y);
        ctx.scale(gameState.camera.zoom, gameState.camera.zoom);
    }

    // Background (Sky)
    ctx.drawImage(assets.sky, 0, 0, canvas.width, canvas.height);

    // Draw Lanes (Visual Guide - Faint lines)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 20]);

    gameState.lanes.forEach(y => {
        // Only draw separator lines between lanes roughly
        // Top lane center is y. Separator should be between y and next y.
        // Let's just draw horizontal lines
        // Drawing lines at Y doesn't make sense if Y is center of lane.
        // Let's draw lines between lane centers
    });

    // Draw 3 "Road" paths? Or just keep it airy sky theme?
    // User said "Clouds" - implying sky. Let's keep it clean.

    if (gameState.current === STATES.INTRO) {
        const now = Date.now();
        const elapsed = now - gameState.introTime;

        // --- Cinematic Timing ---
        // 0s - 1.5s: Boy Slides In
        // 1.5s - 3.5s: Heart Flows to Start Position
        // 3.5s - 4.5s: Boy Slides Out (Exit)
        // 4.5s: Start Game

        const style = getComputedStyle(document.documentElement);
        let bHeight = parseInt(style.getPropertyValue('--boy-size')) || 350;
        let bFinalX = parseInt(style.getPropertyValue('--boy-x')) || 40;
        let bYVal = style.getPropertyValue('--boy-y').trim();
        let bY = (bYVal === 'bottom') ? (canvas.height - bHeight) : (parseInt(bYVal) || (canvas.height / 2 - bHeight / 2));

        // Calculate dynamic width
        let bWidth = bHeight;
        if (assets.boy.naturalWidth) bWidth = bHeight * (assets.boy.naturalWidth / assets.boy.naturalHeight);

        // 1. Boy Slide In Logic
        let curBoyX = bFinalX;
        if (elapsed < 1500) {
            const t = easeOutCubic(elapsed / 1500);
            curBoyX = -bWidth + (bFinalX + bWidth) * t;
        } else if (elapsed > 3500) {
            // 3. Boy Slide Out Logic (Exit Left)
            const t = Math.min(1, (elapsed - 3500) / 1000);
            const ease = t * t; // Ease in
            curBoyX = bFinalX - (bWidth + bFinalX + 50) * ease;
        }

        ctx.drawImage(assets.boy, curBoyX, bY, bWidth, bHeight);

        // 2. Heart Flow Logic
        if (elapsed > 1500 && elapsed < 4500) {
            const flowDuration = 2000;
            const t = Math.min(1, (elapsed - 1500) / flowDuration);

            // Source: Fixed Point from Boy's position
            const xOffset = parseInt(style.getPropertyValue('--heart-intro-x-offset')) || 100;
            const yOffset = parseInt(style.getPropertyValue('--heart-intro-y-offset')) || -50;
            const srcX = bFinalX + bWidth / 2 + xOffset;
            const srcY = bY + bHeight / 3 + yOffset;

            const destX = CONFIG.playerX;
            const destY = gameState.lanes[1];

            // Movement: Ease Out Quad (Start smooth)
            // "Flowy" means continuous, fluid motion. Not snappy.
            const ease = easeInOutQuad(t); // Smooth start and end

            // Path: Gentle S-curve or Arc
            // We want it to look like it's floating on a breeze
            const flowX = Math.sin(t * Math.PI) * 20; // Slight horizontal expansion
            const curX = srcX + (destX - srcX) * ease + flowX;

            // Vertical: Moves to target but with a wave
            // Sin(PI * 2 * t) is one full up-down cycle. 
            // We want a gentle arc + wave. 
            const arcY = -Math.sin(t * Math.PI) * 50; // Main arc up
            const waveY = Math.sin(t * Math.PI * 3) * 10; // Subtle ripple
            const curY = srcY + (destY - srcY) * ease + arcY + waveY;

            // Scale: Smooth grow, no elastic bounce
            let spawnScale = 1;
            if (t < 0.2) {
                spawnScale = t / 0.2; // Linear fade in over first 20%
            }

            // Draw Intro Heart
            const hBaseSize = parseInt(style.getPropertyValue('--heart-intro-size')) || 60;
            const hAspect = assets.heart.naturalWidth / assets.heart.naturalHeight;
            const renderSize = hBaseSize * spawnScale;

            // Rotation: Gentle swaying based on the wave
            // Tilt with the vertical movement velocity
            const rotation = Math.cos(t * Math.PI * 3) * 0.2;

            ctx.save();
            ctx.translate(curX, curY);
            ctx.rotate(rotation);
            ctx.drawImage(
                assets.heart,
                - (renderSize * hAspect) / 2,
                - renderSize / 2,
                renderSize * hAspect,
                renderSize
            );
            ctx.restore();

            // Particles trail (Delayed slightly so it doesn't obscure spawn)
            // Commented out to remove particle effect on heart
            // if (t > 0.1 && gameState.frames % 5 === 0) {
            //     gameState.particles.push(new Particle(curX, curY, `rgba(255, 100, 100, 0.5)`, 2, 4, 0.8));
            // }
        }

        // Spotlight Vignette
        ctx.restore(); // Reset camera for overlay
        const grad = ctx.createRadialGradient(
            curBoyX + bWidth / 2 * gameState.camera.zoom, // Use curBoyX for dynamic position
            bY + bHeight / 3 * gameState.camera.zoom,
            100 * gameState.camera.zoom,
            canvas.width / 2,
            canvas.height / 2,
            canvas.width
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.5, 'rgba(0,0,0,0.1)');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save(); // Restore camera state if we were to draw more
    }

    else if (gameState.current === STATES.PLAYING || gameState.current === STATES.GAMEOVER) {
        // Draw Obstacles
        gameState.obstacles.forEach(obs => obs.draw());

        // Draw Player
        player.draw();
    }

    else if (gameState.current === STATES.WIN) {
        const now = Date.now();
        const elapsed = now - gameState.winTime;

        // --- Fading Out Game Elements (Clouds) ---
        // Extend fade to 2000ms for smoother exit
        if (elapsed < 2000) {
            ctx.save();
            ctx.globalAlpha = 1 - (elapsed / 2000);
            gameState.obstacles.forEach(obs => obs.draw());
            ctx.restore();
        }

        // --- Outro Cinematic ---
        // 1. Girl Slides In
        // 2. Heart Flows to Girl
        // 3. Contact -> Burst -> Popup

        const style = getComputedStyle(document.documentElement);
        let gHeight = parseInt(style.getPropertyValue('--girl-size')) || 350;
        let gRight = parseInt(style.getPropertyValue('--girl-right')) || 50;
        let gYVal = style.getPropertyValue('--girl-y').trim();
        let gY = (gYVal === 'bottom') ? (canvas.height - gHeight) : (parseInt(gYVal) || (canvas.height / 2 - gHeight / 2));

        let gWidth = gHeight;
        if (assets.girl.naturalWidth) gWidth = gHeight * (assets.girl.naturalWidth / assets.girl.naturalHeight);

        const finalGirlX = canvas.width - gWidth - gRight;
        let curGirlX = finalGirlX;

        // Slide In Animation (0 - 1s)
        if (elapsed < 1000) {
            const t = easeOutCubic(elapsed / 1000);
            curGirlX = canvas.width + 50 - (canvas.width + 50 - finalGirlX) * t;
        }

        ctx.drawImage(assets.girl, curGirlX, gY, gWidth, gHeight);

        // Heart Flow (starts after 500ms, but drawn continuously)
        const flowDelay = 500;
        const flowDuration = 2000;
        const absorbDuration = 500; // New Absorption Phase

        // Define Start/End positions
        const startX = CONFIG.playerX;
        // Use player.y for continuity from where the player was at the win moment
        const startY = player.y;
        const endX = finalGirlX + gWidth / 2; // Center of girl
        const endY = gY + gHeight / 3;      // Face height

        let curX = startX;
        let curY = startY;
        let scale = 1;
        let opacity = 1;

        // Calculate Animation State
        if (elapsed <= flowDelay) {
            // PHASE 0: Waiting (Draw static heart at last known position)
            curX = startX;
            curY = startY;
            // No opacity change, full visibility
        }
        else if (elapsed > flowDelay) {
            // 1. Flow Phase
            if (elapsed < flowDelay + flowDuration) {
                const flowT = (elapsed - flowDelay) / flowDuration; // 0 to 1
                const ease = easeInOutQuad(flowT);

                curX = startX + (endX - startX) * ease;
                curY = startY + (endY - startY) * ease + Math.sin(flowT * Math.PI * 3) * 30 * (1 - flowT); // Damping wave

                // Trail (only during movement)
                gameState.particles.push(new Particle(curX, curY, `rgba(255, 182, 193, 0.6)`, 2, 4, 0.5));
            }
            // 2. Absorption Phase (At Destination)
            else {
                curX = endX;
                curY = endY;

                // Calculate Absorption Progress (0 to 1)
                const absorbT = Math.min(1, (elapsed - (flowDelay + flowDuration)) / absorbDuration);

                // Scale Up: 1.0 -> 2.5
                scale = 1 + (absorbT * 1.5);

                // Fade Out: 1.0 -> 0.0
                opacity = 1 - absorbT;

                // Subtle absorption particles (imploding or glowing)
                if (gameState.frames % 5 === 0 && opacity > 0.2) {
                    gameState.particles.push(new Particle(
                        curX + (Math.random() - 0.5) * 50,
                        curY + (Math.random() - 0.5) * 50,
                        `rgba(255, 255, 255, ${opacity * 0.5})`,
                        1, 2, 0.3
                    ));
                }
            }
        }

        // Draw Heart (if opacity > 0)
        // ALWAYS draw if opacity > 0 (covers Phase 0, 1, and 2)
        if (opacity > 0) {
            const hAspect = assets.heart.naturalWidth / assets.heart.naturalHeight;
            const hSize = 60 * scale; // Apply Scale

            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.drawImage(assets.heart, curX - (hSize * hAspect) / 2, curY - hSize / 2, hSize * hAspect, hSize);
            ctx.restore();
        }

        // Burst Trigger
        if (!gameState.introParticlesTriggered) {
            // Trigger when absorption is nearly done (overlapping slightly for impact)
            if (elapsed > flowDelay + flowDuration + absorbDuration - 50) {
                gameState.introParticlesTriggered = true; // Mark as triggered

                // Huge Burst
                for (let i = 0; i < 80; i++) {
                    const hue = Math.random() * 60 + 330; // Pink/Red range
                    const speed = 10 + Math.random() * 15;
                    const angle = Math.random() * Math.PI * 2;
                    const burstX = endX;
                    const burstY = endY;

                    const p = new Particle(burstX, burstY, `hsl(${hue}, 100%, 60%)`, speed, 5 + Math.random() * 10, 2.5);
                    p.vx = Math.cos(angle) * speed;
                    p.vy = Math.sin(angle) * speed;
                    // Add some drag/physics to particle class if needed, but standard update is linear shrinking
                    // Let's customize velocity in the Loop if we want explosion physics, 
                    // but current Particle class has random velocity in constructor. 
                    // We need to override it for directional burst.

                    // The Particle constructor sets vx/vy to random: 
                    // this.vx = (Math.random() - 0.5) * speed;
                    // So passing speed helps, but it's box-random, not radial.
                    // Let's manually override limits for better burst shape if possible, 
                    // or just trust the random chaos which looks like an explosion too.
                    // To make it look like a blast, we overwrite the random vx/vy immediately:
                    p.vx = (Math.random() - 0.5) * speed * 2;
                    p.vy = (Math.random() - 0.5) * speed * 2;
                    gameState.particles.push(p);
                }

                // Add Flash
                gameState.particles.push(new Particle(endX, endY, 'rgba(255, 255, 255, 1)', 0, 150, 0.2));
            }
        }
    }

    // Draw Particles (Global)
    gameState.particles.forEach(p => p.draw());

    ctx.restore();
}

// Helper Easing Functions
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOutQuad(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function elasticOut(t) {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
}

function updateProgress() {
    const percent = ((CONFIG.gameDuration - gameState.timer) / CONFIG.gameDuration) * 100;
    document.getElementById('progress-bar').style.width = `${Math.min(100, percent)}%`;
}

// Start
init();
