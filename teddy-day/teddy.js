document.addEventListener('DOMContentLoaded', () => {
    const factoryBg = document.getElementById('factory-bg');
    const conveyorBelt = document.getElementById('conveyor-belt');
    const teddy = document.getElementById('teddy');
    const teddySprite = document.querySelector('.teddy-sprite'); // New sprite element
    const gameContainer = document.getElementById('game-container');

    let isJumping = false;
    let gameRunning = false;
    let obstacleSpawnInterval;
    let gameTimerInterval;
    let difficultyInterval;
    let startTime;
    const WIN_TIME = 60000; // 60 seconds to win

    // Difficulty Variables
    // Difficulty Variables
    let difficultyMultiplier = 1.0;
    const MAX_DIFFICULTY = 1.9; // Max 1.9x speed (Was 1.6)
    const BASE_BELT_DURATION = 6.67; // Seconds for one belt cycle
    const BASE_SPAWN_MIN = 1600; // Was 2000
    const BASE_SPAWN_MAX = 2100; // Was 2500

    // Powerup State
    let hasShield = false;

    // Jump function
    function jump() {
        if (!isJumping && gameRunning) {
            isJumping = true;
            teddy.classList.add('jumping');

            // Adjust jump animation speed slightly based on difficulty
            // Cap jump speed increase so it doesn't become impossible
            const jumpDuration = 1.2 / Math.min(difficultyMultiplier, 1.4);
            teddy.style.animationDuration = `${jumpDuration}s`;

            // Remove playing class to revert to static first frame
            teddy.classList.remove('playing');

            // Use animationend for precise timing instead of setTimeout
            const onJumpEnd = () => {
                teddy.classList.remove('jumping');
                teddy.style.animationDuration = ''; // Reset

                // Resume running animation
                if (gameRunning) {
                    teddy.classList.add('playing');
                    // Ensure speed is restored immediately
                    if (teddySprite) setAnimationSpeed(teddySprite, difficultyMultiplier);
                }

                isJumping = false;
                teddy.removeEventListener('animationend', onJumpEnd);
            };

            teddy.addEventListener('animationend', onJumpEnd);
        }
    }

    // Spawn Object (Obstacle or Powerup)
    function spawnObject(type) {
        const obj = document.createElement('div');

        // Determine if powerup or obstacle
        if (type === 'shield') {
            obj.classList.add('powerup', 'shield');
        } else {
            obj.classList.add('obstacle');
            if (type === 'scissor') {
                obj.classList.add('scissor');
            }
        }

        gameContainer.appendChild(obj);

        const distance = window.innerWidth + 100;
        const baseDuration = (distance / 1333) * 6.67;
        const duration = baseDuration / difficultyMultiplier;

        // Apply movement animation
        // Use css variable or inline style for duration? 
        // We already have keyframes moveObstacle, let's reuse it for everything moving with belt
        obj.style.animation = `moveObstacle ${duration}s linear`;

        // If powerup, add float animation too? (handled in CSS via class)

        setTimeout(() => {
            if (obj.parentElement) {
                obj.remove();
            }
        }, duration * 1000 + 100);
    }

    // Random spawning logic
    function startObjectSpawning() {
        function scheduleNext() {
            if (!gameRunning) return;

            const currentMin = BASE_SPAWN_MIN / difficultyMultiplier;
            const currentMax = BASE_SPAWN_MAX / difficultyMultiplier;
            const safeMin = 900; // Was 1200
            const actualMin = Math.max(currentMin, safeMin);
            const actualMax = Math.max(currentMax, actualMin + 500);

            const randomDelay = Math.random() * (actualMax - actualMin) + actualMin;

            obstacleSpawnInterval = setTimeout(() => {
                if (gameRunning) {
                    const rand = Math.random();
                    let type;

                    // 15% Chance for Shield (if not already shielded)
                    if (rand < 0.15 && !hasShield) {
                        type = 'shield';
                    } else {
                        // Obstacles: 60% Crate, 40% Scissor 
                        type = Math.random() > 0.4 ? 'crate' : 'scissor';
                    }

                    spawnObject(type);
                    scheduleNext();
                }
            }, randomDelay);
        }
        scheduleNext();
    }

    // Add obstacle movement animation dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes moveObstacle {
            from {
                right: -100px;
            }
            to {
                right: 100%;
            }
        }
    `;
    document.head.appendChild(style);

    // Inject Progress Bar & Popups
    const uiHTML = `
        <div id="progress-container">
            <div id="progress-fill"></div>
        </div>
        
        <!-- Loss Popup (Dark Theme) -->
        <div id="game-over-popup">
            <h2 id="loss-title">Ouch!</h2>
            <p id="loss-message"></p>
            <button id="restart-btn">Try Again</button>
        </div>

        <!-- Win Popup (Propose Day Style) -->
        <div id="win-popup" class="popup-overlay">
            <div class="popup-container">
                <div class="popup-left">
                    <h2 class="popup-title">Happy Teddy Day!</h2>
                    <p class="popup-message">He crossed a whole world of miles to deliver this little moment of comfort.</p>
                    <button id="calendar-btn" class="calendar-button">Go to Calendar</button>
                </div>
                <div class="popup-right">
                    <img src="assets/gift.png" alt="Gift" class="popup-character">
                </div>
            </div>
        </div>

        <div id="gift"></div>
    `;
    gameContainer.insertAdjacentHTML('beforeend', uiHTML);

    // Elements
    const gameOverPopup = document.getElementById('game-over-popup'); // Loss
    const lossTitle = document.getElementById('loss-title');
    const lossMessage = document.getElementById('loss-message');
    const restartBtn = document.getElementById('restart-btn');

    const winPopup = document.getElementById('win-popup'); // Win
    const calendarBtn = document.getElementById('calendar-btn');

    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const gift = document.getElementById('gift');

    let collisionFrameId;

    // Helper to set playback rate for an element's animations
    function setAnimationSpeed(element, rate) {
        const animations = element.getAnimations();
        animations.forEach(anim => {
            anim.playbackRate = rate;
        });
    }

    // Shield Functions
    function activateShield() {
        hasShield = true;
        teddy.classList.add('shielded');
        // Optional: Play sound
    }

    function useShield(obstacle) {
        hasShield = false;
        teddy.classList.remove('shielded');
        // Optional: Play break sound

        // Visual feedback for break
        gameContainer.classList.add('shake', 'flash-red');
        setTimeout(() => gameContainer.classList.remove('shake', 'flash-red'), 400);

        // Blast effect on the obstacle
        if (obstacle) {
            obstacle.classList.add('blast');
            // Remove after blast animation
            setTimeout(() => obstacle.remove(), 400);
        }
    }

    // Update Difficulty Loop
    function updateDifficulty() {
        if (!gameRunning) return;

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / WIN_TIME, 1);

        // Linear increase from 1.0 to MAX_DIFFICULTY
        difficultyMultiplier = 1.0 + (progress * (MAX_DIFFICULTY - 1.0));

        // Update Animation Speeds
        // Factory BG (Parallax)
        setAnimationSpeed(factoryBg, difficultyMultiplier);

        // Conveyor Belt
        setAnimationSpeed(conveyorBelt, difficultyMultiplier);

        // Teddy (Run cycle - Check sprite)
        // Teddy (Jump - Check parent)
        setAnimationSpeed(teddy, difficultyMultiplier);
        if (teddySprite) setAnimationSpeed(teddySprite, difficultyMultiplier);

        // Existing Obstacles? 
        // Updating them might cause jumps, but let's try updating their playback rate too
        // so they don't look "detached" from the belt.
        document.querySelectorAll('.obstacle').forEach(obs => {
            setAnimationSpeed(obs, difficultyMultiplier);
        });
    }

    // Game Over Function (Loss)
    function gameOver() {
        gameRunning = false;
        clearInterval(gameTimerInterval);
        clearInterval(difficultyInterval);
        clearTimeout(obstacleSpawnInterval);
        cancelAnimationFrame(collisionFrameId);

        // Pause animations
        factoryBg.classList.add('paused');
        conveyorBelt.classList.add('paused');
        teddy.classList.add('paused');
        if (teddySprite) teddySprite.style.animationPlayState = 'paused';

        // Pause all existing obstacles and powerups
        document.querySelectorAll('.obstacle, .powerup').forEach(el => {
            el.style.animationPlayState = 'paused';
        });

        // Set Popup for Loss
        lossTitle.textContent = "Ouch!";
        lossTitle.style.color = "#ff7675";
        lossMessage.textContent = "Don't give up! Look out for those crates!";

        // Show Loss popup
        gameOverPopup.style.display = 'block';
        winPopup.classList.remove('show'); // Ensure win popup is hidden
    }

    // Cinematic Ending Sequence
    function startEndingSequence() {
        gameRunning = false; // Stop player inputs
        clearInterval(gameTimerInterval);
        clearInterval(difficultyInterval);
        clearTimeout(obstacleSpawnInterval);
        cancelAnimationFrame(collisionFrameId);

        // 1. Fade out obstacles and powerups
        document.querySelectorAll('.obstacle, .powerup').forEach(el => {
            el.classList.add('fade-out');
            setTimeout(() => el.remove(), 1000); // Remove after fade
        });

        // 2. Add Cozy Glow
        gameContainer.classList.add('cozy-glow');

        // Reset animation speeds to normal for the cinematic
        setAnimationSpeed(factoryBg, 1);
        setAnimationSpeed(conveyorBelt, 1);
        setAnimationSpeed(teddy, 1); // Only relevant if he was still running

        // 3. Bring in the gift
        const teddyRect = teddy.getBoundingClientRect();
        const targetRightPx = window.innerWidth - 120 - teddyRect.right + 20;

        // Reset gift state explicitly before showing
        gift.style.transition = 'none';
        gift.style.right = '-150px';
        gift.style.display = 'block';

        // Force Reflow ensures the browser paints the "start" position
        void gift.offsetHeight;

        // Enable Transition
        gift.style.transition = 'right 6s cubic-bezier(0.25, 1, 0.5, 1)';

        // Define onTransitionEnd function for cleanup
        function onGiftArrival(e) {
            if (e.propertyName === 'right') {
                gift.removeEventListener('transitionend', onGiftArrival);
                giftReached();
            }
        }

        gift.addEventListener('transitionend', onGiftArrival);

        // Trigger Animation
        requestAnimationFrame(() => {
            gift.style.right = `${targetRightPx}px`;
        });
    }

    function giftReached() {
        // Stop Everything
        factoryBg.classList.add('paused');
        conveyorBelt.classList.add('paused');
        teddy.classList.add('paused'); // Stop running animation
        if (teddySprite) teddySprite.style.animationPlayState = 'paused';

        // Hearts Explosion
        for (let i = 0; i < 20; i++) {
            createHeart();
        }

        // Delay popup slightly to enjoy hearts
        setTimeout(() => {
            winPopup.classList.add('show');
        }, 1000);
    }

    // Calendar Button Logic
    calendarBtn.addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    function createHeart() {
        const heart = document.createElement('div');
        heart.classList.add('heart');

        // Random position around Teddy/Gift
        const leftBase = window.innerWidth * 0.35;
        const randomOffset = (Math.random() - 0.5) * 300;

        heart.style.left = `${leftBase + randomOffset}px`;
        heart.style.bottom = `${170 + Math.random() * 100}px`;
        heart.style.animationDelay = `${Math.random() * 1}s`;

        gameContainer.appendChild(heart);

        // Cleanup
        setTimeout(() => heart.remove(), 2000);
    }

    // Trigger Win
    function gameWin() {
        startEndingSequence();
    }

    // Reset Game Function
    function resetGame() {
        // Clear all obstacles and powerups
        document.querySelectorAll('.obstacle, .powerup').forEach(el => el.remove());
        document.querySelectorAll('.heart').forEach(h => h.remove());

        // Reset classes
        factoryBg.classList.remove('paused');
        conveyorBelt.classList.remove('paused');
        teddy.classList.remove('paused', 'jumping');
        if (teddySprite) teddySprite.style.animationPlayState = ''; // Reset sprite state
        gameContainer.classList.remove('cozy-glow');
        gameOverPopup.classList.remove('final-win');

        // Reset Gift
        gift.style.display = 'none';
        gift.style.transition = 'none';
        gift.style.right = '-150px';

        // Reset Progress Bar
        progressFill.style.width = '0%';
        progressContainer.style.display = 'none';

        // Hide popup & Show Start Screen
        gameOverPopup.style.display = 'none';
        winPopup.classList.remove('show');


        // Reset State
        isJumping = false;
        gameRunning = true;
        difficultyMultiplier = 1.0; // Reset difficulty

        // Reset animation speeds
        setAnimationSpeed(factoryBg, 1);
        setAnimationSpeed(conveyorBelt, 1);
        setAnimationSpeed(teddy, 1);

        // Start factory background animation
        factoryBg.classList.add('playing');

        // Start conveyor belt animation
        conveyorBelt.classList.add('playing');

        // Start teddy run animation
        teddy.classList.add('playing');

        // Start spawning
        startObjectSpawning();

        // Start checking collisions
        checkCollision();


        // Start Timer
        startGameTimer();
    }

    restartBtn.addEventListener('click', resetGame);

    // Timer Logic
    function startGameTimer() {
        startTime = Date.now();
        progressContainer.style.display = 'block';

        gameTimerInterval = setInterval(() => {
            if (!gameRunning) return;

            const elapsed = Date.now() - startTime;
            const percentage = Math.min((elapsed / WIN_TIME) * 100, 100);

            progressFill.style.width = `${percentage}%`;

            if (elapsed >= WIN_TIME) {
                gameWin();
            }
        }, 100);

        // Separate Interval for Difficulty Updates (e.g., every 500ms)
        difficultyInterval = setInterval(updateDifficulty, 500);
    }

    // Collision Detection
    function checkCollision() {
        if (!gameRunning) return;

        const teddyRect = teddy.getBoundingClientRect();
        // Shrink teddy hitbox significantly for fairness
        const teddyHitbox = {
            top: teddyRect.top + 30, // Keep top margin
            bottom: teddyRect.bottom - 20, // Keep bottom margin
            left: teddyRect.left + 32, // Adjusted for 124px width (was 70 for 200px)
            right: teddyRect.right - 32 // Adjusted for 124px width
        };

        // Check Obstacles & Powerups
        const objects = document.querySelectorAll('.obstacle, .powerup');
        objects.forEach(obj => {
            const objRect = obj.getBoundingClientRect();
            // Shrink hitbox
            const objHitbox = {
                top: objRect.top + 15,
                bottom: objRect.bottom - 10,
                left: objRect.left + 35,
                right: objRect.right - 35
            };

            if (
                teddyHitbox.left < objHitbox.right &&
                teddyHitbox.right > objHitbox.left &&
                teddyHitbox.top < objHitbox.bottom &&
                teddyHitbox.bottom > objHitbox.top
            ) {
                // Collision Detected!
                if (obj.classList.contains('powerup')) {
                    // Handle Powerup Collection
                    if (obj.classList.contains('shield')) {
                        activateShield();
                    }
                    obj.remove();
                } else {
                    // Handle Obstacle Collision
                    if (hasShield) {
                        // Shield protects!
                        useShield(obj);
                        // obj.remove(); // Handled in useShield after blast
                    } else {
                        gameOver();
                    }
                }
            }
        });

        collisionFrameId = requestAnimationFrame(checkCollision);
    }

    // Begin game
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
            startScreen.classList.add('hidden');

            // Show character guide
            const characterGuide = document.getElementById('character-guide');
            if (characterGuide) {
                characterGuide.classList.remove('hidden');
            }

            // Show text bubble with slight delay
            const textBubble = document.getElementById('text-bubble');
            if (textBubble) {
                setTimeout(() => {
                    textBubble.classList.remove('hidden');
                }, 300); // 300ms delay after character
            }



            gameRunning = true;
            difficultyMultiplier = 1.0;

            // Reset animations to running state
            factoryBg.classList.remove('paused');
            conveyorBelt.classList.remove('paused');

            // Start factory background animation
            factoryBg.classList.add('playing');

            // Start conveyor belt animation
            conveyorBelt.classList.add('playing');

            // Start teddy run animation
            teddy.classList.add('playing');
            if (teddySprite) teddySprite.style.animationPlayState = 'running';

            // Reset Shield
            hasShield = false;
            teddy.classList.remove('shielded');

            // Start spawning
            startObjectSpawning();

            // Start checking collisions
            checkCollision();

            // Start Timer
            startGameTimer();
        }, 800); // 0.8s Delay
    });

    // Jump controls: Spacebar or Click
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            jump();
        }
    });

    document.addEventListener('click', (e) => {
        if (gameRunning && e.target.id !== 'restart-btn' && e.target.id !== 'calendar-btn' && e.target.id !== 'start-btn') {
            jump();
        }
    });
});
