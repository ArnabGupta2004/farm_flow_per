document.addEventListener('DOMContentLoaded', () => {
    // === Elements ===
    const clawContainer = document.getElementById('clawContainer');
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
            // Exit animations for start screen
            startTitle.classList.add('title-exit');
            startBtn.classList.add('btn-exit');
            startScreen.classList.add('screen-exit');

            // Wait for start screen to exit before hiding
            setTimeout(() => {
                startScreen.classList.add('hidden');
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
    const finalPrize1 = document.getElementById('finalPrize1');
    const finalPrize2 = document.getElementById('finalPrize2');
    const finalPrize3 = document.getElementById('finalPrize3');
    const calendarBtn = document.getElementById('calendarBtn');

    // === Game State ===
    let positionX = 50; // Percentage 0-100
    let isMovingLeft = false;
    let isMovingRight = false;
    let isActionable = true; // Block input during grab
    const SPEED = 0.165; // Movement speed (halved from 0.33)
    const MIN_X = 15; // Left limit boundaries
    const MAX_X = 85; // Right limit boundaries

    // === Prize System State ===
    let currentAttempt = 1;
    const MAX_ATTEMPTS = 3;
    const prizes = ['5star', 'dairymilk', 'fuse', 'kitkat'];
    const wonPrizes = [];

    // === Movement Loop ===
    function updatePosition() {
        if (!isActionable) return;

        if (isMovingLeft) {
            positionX = Math.max(MIN_X, positionX - SPEED);
        }
        if (isMovingRight) {
            positionX = Math.min(MAX_X, positionX + SPEED);
        }

        clawContainer.style.left = `${positionX}%`;

        if (isMovingLeft || isMovingRight) {
            requestAnimationFrame(updatePosition);
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

    // === Prize Selection Logic ===
    function selectPrize() {
        if (currentAttempt === 2) {
            return 'cc'; // Always troll prize on attempt 2
        }

        // For attempts 1 and 3
        if (currentAttempt === 1) {
            // Random prize
            return prizes[Math.floor(Math.random() * prizes.length)];
        } else {
            // Attempt 3: Exclude the prize from attempt 1
            const firstPrize = wonPrizes[0];
            const availablePrizes = prizes.filter(p => p !== firstPrize);
            return availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
        }
    }

    // === Show Popup ===
    function showPrizePopup(prize) {
        // Update popup content
        prizeImage.src = `assets/${prize}.png`;

        if (currentAttempt === 2) {
            // Troll message for cc prize
            popupTitle.textContent = 'Congr... Ooopss..';
            popupSubtitle.textContent = "It's still chocolate though";
        } else {
            // Normal congratulations
            popupTitle.textContent = 'Congratulations!!';
            popupSubtitle.textContent = 'You Got';
        }

        // Update attempts left
        const remaining = MAX_ATTEMPTS - currentAttempt;
        attemptsLeft.textContent = `Attempts Left: ${remaining}`;

        // Update button text
        if (currentAttempt === MAX_ATTEMPTS) {
            actionBtn.textContent = 'Next';
        } else {
            actionBtn.textContent = 'Go Again';
        }

        // Show popup
        prizePopup.classList.remove('hidden');
    }

    // === Grab Logic ===
    function attemptGrab() {
        isActionable = false; // Disable controls
        isMovingLeft = false;
        isMovingRight = false;

        // 1. Drop
        clawContainer.classList.add('dropping');

        // 2. Close Claw at bottom
        setTimeout(() => {
            clawOpen.classList.add('hidden');
            clawClosed.classList.remove('hidden');
        }, 1000); // Wait for drop (matches CSS transition)

        // 3. Retract
        setTimeout(() => {
            clawContainer.classList.remove('dropping');
        }, 1500); // 1s drop + 0.5s pause

        // 4. Keep claw closed for 5 seconds after retract, then show prize
        setTimeout(() => {
            // Select and store prize
            const prize = selectPrize();
            wonPrizes.push(prize);

            // Show popup
            showPrizePopup(prize);
        }, 3000); // 1.5s + 1s retract + 5s hold

        // 5. Open claw after popup is shown (visual only, doesn't affect gameplay)
        setTimeout(() => {
            clawOpen.classList.remove('hidden');
            clawClosed.classList.add('hidden');
        }, 3000); // Same timing as popup
    }

    // === Action Button Handler ===
    actionBtn.addEventListener('click', () => {
        prizePopup.classList.add('hidden');

        if (currentAttempt === MAX_ATTEMPTS) {
            // Show final summary
            showFinalSummary();
        } else {
            // Continue to next attempt
            currentAttempt++;
            attemptText.textContent = `${currentAttempt}/${MAX_ATTEMPTS}`;
            isActionable = true;
        }
    });

    // === Final Summary ===
    function showFinalSummary() {
        // Set prize images
        finalPrize1.src = `assets/${wonPrizes[0]}.png`;
        finalPrize2.src = `assets/${wonPrizes[1]}.png`;
        finalPrize3.src = `assets/${wonPrizes[2]}.png`;

        // Show final screen
        finalSummary.classList.remove('hidden');
    }

    // === Calendar Button ===
    calendarBtn.addEventListener('click', () => {
        window.location.href = '../index.html';
    });
});
