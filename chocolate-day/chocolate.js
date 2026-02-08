document.addEventListener('DOMContentLoaded', () => {
    // === Elements ===
    const clawContainer = document.getElementById('clawContainer');
    const clawBody = document.querySelector('.claw-body'); // For shake animation
    const clawOpen = document.querySelector('.claw-open');
    const clawClosed = document.querySelector('.claw-closed');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const btnGrab = document.getElementById('btnGrab');

    // Start Screen Logic
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const startTitle = document.getElementById('start-title');
    const overlay = document.getElementById('transition-overlay');

    // === Audio Manager Setup ===
    // Note: Sounds need to be added to assets folder to work
    // const audio = new AudioManager();
    // audio.loadSound('move', 'assets/audio/move.mp3');
    // audio.loadSound('grab', 'assets/audio/grab.mp3');
    // audio.loadSound('win', 'assets/audio/win.mp3');
    // audio.loadSound('troll', 'assets/audio/fail.mp3'); 

    // === Preload Images ===
    const prizeNames = ['5star', 'dairymilk', 'fuse', 'kitkat', 'cc', 'milkybar', 'kinderjoy', 'munch'];
    prizeNames.forEach(name => {
        const img = new Image();
        img.src = `assets/${name}.png`;
    });

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

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            // Audio unlock
            // audio.playBGM(); 

            // Exit animations for start screen
            startTitle.classList.add('title-exit');
            startBtn.classList.add('btn-exit');
            startScreen.classList.add('screen-exit');

            // Wait for start screen to exit before hiding
            setTimeout(() => {
                startScreen.classList.add('hidden');

                // Trigger Guide Character Appearance
                const char = document.querySelector('.guide-character');
                const bubble = document.querySelector('.guide-bubble');
                if (char) char.classList.add('visible');
                if (bubble) bubble.classList.add('visible');

            }, 800);
        });
    }

    // Popup Elements
    const attemptCounter = document.getElementById('attemptCounter');
    const attemptText = document.getElementById('attemptText');
    const prizePopup = document.getElementById('prizePopup');
    const popupTitle = document.getElementById('popupTitle');
    const popupSubtitle = document.getElementById('popupSubtitle');
    const prizeImage = document.getElementById('prizeImage');
    const attemptsLeft = document.getElementById('attemptsLeft');
    const actionBtn = document.getElementById('actionBtn');

    // Final Summary Elements
    const finalSummary = document.getElementById('finalSummary');
    const prizesGrid = document.querySelector('.prizes-grid'); // Container for prizes
    const calendarBtn = document.getElementById('calendarBtn');

    // === Game State ===
    let positionX = 50; // Percentage 0-100
    let isMovingLeft = false;
    let isMovingRight = false;
    let isActionable = true; // Block input during grab
    const SPEED = 0.165; // ORIGINAL SPEED maintained
    const MIN_X = 38; // Left limit boundaries
    const MAX_X = 62; // Right limit boundaries

    // === Prize System State ===
    let currentAttempt = 1;
    const MAX_ATTEMPTS = 5;

    // Available prizes
    const availablePrizes = ['5star', 'dairymilk', 'fuse', 'kitkat', 'milkybar', 'kinderjoy', 'munch'];
    // Shuffle the available prizes to ensure random unique order
    const shuffledPrizes = availablePrizes.sort(() => Math.random() - 0.5);

    const ccAttemptIndex = Math.floor(Math.random() * 3) + 2; // Random: 2, 3, or 4
    const wonPrizes = [];

    // === Movement Loop ===
    function updatePosition() {
        if (!isActionable) return;

        if (isMovingLeft) {
            positionX = Math.max(MIN_X, positionX - SPEED);
            clawContainer.classList.add('moving-left');
            clawContainer.classList.remove('moving-right');
        } else if (isMovingRight) {
            positionX = Math.min(MAX_X, positionX + SPEED);
            clawContainer.classList.add('moving-right');
            clawContainer.classList.remove('moving-left');
        } else {
            clawContainer.classList.remove('moving-left', 'moving-right');
        }

        clawContainer.style.left = `${positionX}%`;

        if (isMovingLeft || isMovingRight) {
            requestAnimationFrame(updatePosition);
        } else {
            // Stop sway when not moving
            clawContainer.classList.remove('moving-left', 'moving-right');
        }
    }

    // === Controls ===
    const startLeft = () => { if (isActionable) { isMovingLeft = true; updatePosition(); } };
    const stopLeft = () => { isMovingLeft = false; };
    const startRight = () => { if (isActionable) { isMovingRight = true; updatePosition(); } };
    const stopRight = () => { isMovingRight = false; };

    // Mouse
    btnLeft.addEventListener('mousedown', startLeft);
    btnLeft.addEventListener('mouseup', stopLeft);
    btnLeft.addEventListener('mouseleave', stopLeft);

    btnRight.addEventListener('mousedown', startRight);
    btnRight.addEventListener('mouseup', stopRight);
    btnRight.addEventListener('mouseleave', stopRight);

    // Touch
    btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); startLeft(); });
    btnLeft.addEventListener('touchend', stopLeft);
    btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); startRight(); });
    btnRight.addEventListener('touchend', stopRight);

    // Grab Button
    btnGrab.addEventListener('click', () => {
        if (!isActionable) return;
        attemptGrab();
    });

    // === Helper: Reset Claw ===
    function resetClaw() {
        clawOpen.classList.remove('hidden');
        clawClosed.classList.add('hidden');
        clawContainer.classList.remove('dropping');
        clawBody.classList.remove('shaking');
    }

    // === Prize Selection Logic ===
    function determinePrizeForCurrentAttempt() {
        if (currentAttempt === ccAttemptIndex) {
            return 'cc';
        }
        return shuffledPrizes.pop() || '5star';
    }

    // === Show Popup ===
    function showPrizePopup(prize) {
        // Enforce image update
        const imgSrc = `assets/${prize}.png`;
        prizeImage.src = imgSrc;

        // Debug check (optional)
        console.log(`Showing prize: ${prize} (${imgSrc})`);

        if (prize === 'cc') {
            // Troll message
            // audio.play('troll');
            popupTitle.textContent = 'Congr... Ooopss..';
            popupSubtitle.textContent = "It's still chocolate though";
        } else {
            // Normal congratulations
            // audio.play('win');
            popupTitle.textContent = 'Congratulations!!';
            popupSubtitle.textContent = 'You Got';
        }

        // Update attempts left
        const remaining = MAX_ATTEMPTS - currentAttempt;
        attemptsLeft.textContent = `Attempts Left: ${remaining}`;

        // Update button text
        if (currentAttempt === MAX_ATTEMPTS) {
            actionBtn.textContent = 'Finish';
        } else {
            actionBtn.textContent = 'Go Again';
        }

        // Show popup
        prizePopup.classList.remove('hidden');

        // Force reset claw while popup is showing
        resetClaw();
    }

    // === Grab Logic ===
    function attemptGrab() {
        isActionable = false; // Disable controls
        isMovingLeft = false;
        isMovingRight = false;
        // audio.play('move');

        // 1. Drop
        clawContainer.classList.add('dropping');

        // 2. Close Claw at bottom
        setTimeout(() => {
            clawOpen.classList.add('hidden');
            clawClosed.classList.remove('hidden');
            clawBody.classList.add('shaking'); // Add shake visual
            // audio.play('grab');
        }, 1000);

        // 3. Retract
        setTimeout(() => {
            clawContainer.classList.remove('dropping');
            clawBody.classList.remove('shaking'); // Stop shaking
        }, 1500);

        // 4. Reveal Prize
        setTimeout(() => {
            const prize = determinePrizeForCurrentAttempt();
            wonPrizes.push(prize);
            showPrizePopup(prize);
        }, 3000);
    }

    // === Action Button Handler ===
    actionBtn.addEventListener('click', () => {
        prizePopup.classList.add('hidden');
        resetClaw(); // Double check reset

        // Update Collection Box HERE (Delayed)
        const lastWonPrize = wonPrizes[wonPrizes.length - 1];
        const slot = document.getElementById(`slot-${wonPrizes.length}`);

        if (slot && lastWonPrize) {
            slot.innerHTML = `<img src="assets/${lastWonPrize}.png" alt="${lastWonPrize}">`;
            slot.style.border = "3px solid #d6336c"; // Highlight filled slot
            slot.style.background = "rgba(255, 255, 255, 0.9)";
            slot.style.transform = "scale(1.1)"; // Pop effect
            setTimeout(() => { slot.style.transform = "scale(1)"; }, 300);
        }

        if (currentAttempt >= MAX_ATTEMPTS) {
            showFinalSummary();
        } else {
            currentAttempt++;
            attemptText.textContent = `${currentAttempt}/${MAX_ATTEMPTS}`;
            isActionable = true;
        }
    });

    // === Final Summary ===
    function showFinalSummary() {
        prizesGrid.innerHTML = '';
        wonPrizes.forEach(prize => {
            const prizeWrapper = document.createElement('div');
            prizeWrapper.className = 'final-prize';
            const img = document.createElement('img');
            img.src = `assets/${prize}.png`;
            img.className = 'final-prize-img';
            img.alt = prize;
            prizeWrapper.appendChild(img);
            prizesGrid.appendChild(prizeWrapper);
        });
        finalSummary.classList.remove('hidden');
    }

    // === Calendar Button ===
    calendarBtn.addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    // Initial update
    attemptText.textContent = `${currentAttempt}/${MAX_ATTEMPTS}`;
});
