document.addEventListener('DOMContentLoaded', () => {
    const factoryBg = document.getElementById('factory-bg');
    const conveyorBelt = document.getElementById('conveyor-belt');
    const teddy = document.getElementById('teddy');
    const gameContainer = document.getElementById('game-container');

    let isJumping = false;
    let gameRunning = false;
    let obstacleSpawnInterval;
    let gameTimerInterval;
    let startTime;
    const WIN_TIME = 30000; // 30 seconds to win

    // Jump function
    function jump() {
        if (!isJumping && gameRunning) {
            isJumping = true;
            teddy.classList.add('jumping');

            setTimeout(() => {
                teddy.classList.remove('jumping');
                isJumping = false;
            }, 1200); // Match animation duration
        }
    }

    // Spawn obstacle
    function spawnObstacle(type) {
        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle');
        if (type === 'scissor') {
            obstacle.classList.add('scissor');
        }
        gameContainer.appendChild(obstacle);

        // Calculate movement speed to match belt
        // Belt moves 1333px in 6.67s = 199.85px/s
        // Screen width + obstacle width to fully cross
        const distance = window.innerWidth + 100;
        const duration = (distance / 1333) * 6.67; // Scale duration based on distance

        obstacle.style.animation = `moveObstacle ${duration}s linear`;

        // Remove obstacle after animation completes
        setTimeout(() => {
            if (obstacle.parentElement) {
                obstacle.remove();
            }
        }, duration * 1000);
    }

    // Random obstacle spawning
    function startObstacleSpawning() {
        function scheduleNextObstacle() {
            // Min delay 1500ms > Jump Duration 1200ms ensures player always hits ground before next obstacle
            const randomDelay = Math.random() * 2000 + 1500; // 1.5-3.5 seconds
            obstacleSpawnInterval = setTimeout(() => {
                if (gameRunning) {
                    // 60% Crate, 40% Scissor
                    const type = Math.random() > 0.4 ? 'crate' : 'scissor';
                    spawnObstacle(type);
                    scheduleNextObstacle();
                }
            }, randomDelay);
        }
        scheduleNextObstacle();
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
                    <p class="popup-message">“This teddy ran through everything just to reach you.”</p>
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

    // Game Over Function (Loss)
    function gameOver() {
        gameRunning = false;
        clearInterval(gameTimerInterval);
        clearTimeout(obstacleSpawnInterval);
        cancelAnimationFrame(collisionFrameId);

        // Pause animations
        factoryBg.classList.add('paused');
        conveyorBelt.classList.add('paused');
        teddy.classList.add('paused');

        // Pause all existing obstacles
        document.querySelectorAll('.obstacle').forEach(obs => {
            obs.style.animationPlayState = 'paused';
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
        clearTimeout(obstacleSpawnInterval);
        cancelAnimationFrame(collisionFrameId);

        // 1. Fade out obstacles
        document.querySelectorAll('.obstacle').forEach(obs => {
            obs.classList.add('fade-out');
            setTimeout(() => obs.remove(), 1000); // Remove after fade
        });

        // 2. Add Cozy Glow
        gameContainer.classList.add('cozy-glow');

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
        // Clear all obstacles
        document.querySelectorAll('.obstacle').forEach(obs => obs.remove());
        document.querySelectorAll('.heart').forEach(h => h.remove());

        // Reset classes
        factoryBg.classList.remove('paused');
        conveyorBelt.classList.remove('paused');
        teddy.classList.remove('paused', 'jumping');
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

        // Start factory background animation
        factoryBg.classList.add('playing');

        // Start conveyor belt animation
        conveyorBelt.classList.add('playing');

        // Start teddy run animation
        teddy.classList.add('playing');

        // Start spawning obstacles
        startObstacleSpawning();

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
    }

    // Collision Detection
    function checkCollision() {
        if (!gameRunning) return;

        const teddyRect = teddy.getBoundingClientRect();
        // Shrink teddy hitbox significantly for fairness
        const teddyHitbox = {
            top: teddyRect.top + 30,
            bottom: teddyRect.bottom - 20,
            left: teddyRect.left + 70,
            right: teddyRect.right - 70
        };

        const obstacles = document.querySelectorAll('.obstacle');
        obstacles.forEach(obs => {
            const obsRect = obs.getBoundingClientRect();
            // Shrink obstacle hitbox
            const obsHitbox = {
                top: obsRect.top + 15,
                bottom: obsRect.bottom - 10,
                left: obsRect.left + 35,
                right: obsRect.right - 35
            };

            if (
                teddyHitbox.left < obsHitbox.right &&
                teddyHitbox.right > obsHitbox.left &&
                teddyHitbox.top < obsHitbox.bottom &&
                teddyHitbox.bottom > obsHitbox.top
            ) {
                gameOver();
            }
        });

        collisionFrameId = requestAnimationFrame(checkCollision);
    }

    // Begin game
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

            // Reset animations to running state
            factoryBg.classList.remove('paused');
            conveyorBelt.classList.remove('paused');

            // Start factory background animation
            factoryBg.classList.add('playing');

            // Start conveyor belt animation
            conveyorBelt.classList.add('playing');

            // Start teddy run animation
            teddy.classList.remove('paused');
            teddy.classList.add('playing');

            // Start spawning obstacles
            startObstacleSpawning();

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
        if (gameRunning && e.target !== beginBtn && e.target !== restartBtn) {
            jump();
        }
    });
});
