document.addEventListener('DOMContentLoaded', () => {
    // Select elements
    const characterAsset = document.getElementById('character-asset');
    // Start Screen Logic
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const startTitle = document.getElementById('start-title');

    const backgroundAsset = document.getElementById('background-asset');
    const textAsset = document.getElementById('text-asset');
    const yesBtn = document.getElementById('yes-btn');
    const noBtn = document.getElementById('no-btn');
    const overlay = document.getElementById('transition-overlay');

    // === Transition Sequence ===
    if (overlay) {
        // 1. Initial State: Overlay covers everything (handled by CSS)

        // 2. Trigger Fall Animation immediately
        overlay.classList.add('overlay-fall');

        // 3. Wait for fall to complete, then animate Start Screen
        setTimeout(() => {
            overlay.style.display = 'none'; // Cleanup

            if (startTitle) startTitle.classList.add('anim-title-enter');
            if (startBtn) startBtn.classList.add('anim-btn-enter');
        }, 1000); // 1.2s animation, trigger slightly early feels snappier
    } else {
        // Fallback if overlay missing
        if (startTitle) startTitle.classList.add('anim-title-enter');
        if (startBtn) startBtn.classList.add('anim-btn-enter');
    }

    const remoteControl = document.getElementById('remote-control');
    const guideCharacter = document.getElementById('minigame-guide');
    const textBubble = document.getElementById('text-bubble');

    // Initialize - wait for Start Click
    startBtn.addEventListener('click', () => {
        // Exit animations for start screen
        startTitle.classList.add('title-exit');
        startBtn.classList.add('btn-exit');
        startScreen.classList.add('screen-exit');

        // Wait for start screen to exit before starting page animations
        setTimeout(() => {
            startScreen.classList.add('hidden');

            // NEW FLOW: Show Remote Control AND Guide Character
            remoteControl.classList.add('remote-slide-up');
            if (guideCharacter) guideCharacter.classList.remove('hidden');

            // Show Text Bubble after a short delay (e.g., 500ms after character)
            setTimeout(() => {
                if (textBubble) textBubble.classList.remove('hidden');
            }, 500);

        }, 800); // Match start screen exit duration
    });

    // Remote Control Interaction
    let remoteClicked = false; // Flag to prevent multiple clicks
    if (remoteControl) {
        remoteControl.addEventListener('click', () => {
            if (remoteClicked) return; // Prevent multiple clicks
            remoteClicked = true;

            // 1. Slide down remote
            remoteControl.classList.remove('remote-slide-up');
            remoteControl.classList.add('remote-slide-down');

            // 2. Start TV Mini-game (after remote starts sliding down)
            setTimeout(() => {
                startTVMiniGame();
            }, 500);

            // 3. Switch Character & Bubble Assets (1s later)
            setTimeout(() => {
                const charImg = guideCharacter.querySelector('.character-img');
                if (charImg) charImg.src = '../assets/images/character/arn_think.png';

                if (textBubble) textBubble.src = 'assets/text_bubble_2.png';
            }, 1000);
        });
    }

    // ========== TV HIT MINI-GAME ==========
    const staticAsset = document.getElementById('static-asset');
    const signalBarContainer = document.getElementById('signal-bar-container');
    const signalBarFill = document.getElementById('signal-bar-fill');

    let signalLevel = 0;
    let isGameActive = false;
    let depleteInterval = null;
    const FILL_AMOUNT = 6; // % per click
    const DEPLETE_AMOUNT = 2; // % per 100ms
    const DEPLETE_INTERVAL = 100; // ms

    function startTVMiniGame() {
        isGameActive = true;

        // Show static with crtPowerOn animation
        staticAsset.style.animation = 'crtPowerOn 0.6s ease-out forwards';

        // Show signal bar after static appears and allow opacity control
        setTimeout(() => {
            staticAsset.style.animation = 'none'; // Remove animation to allow opacity control
            staticAsset.style.opacity = '1';
            signalBarContainer.style.display = 'flex';
        }, 600);

        // Start depletion timer
        depleteInterval = setInterval(() => {
            if (signalLevel > 0) {
                signalLevel = Math.max(0, signalLevel - DEPLETE_AMOUNT);
                updateSignalBar();
            }
        }, DEPLETE_INTERVAL);

        // Add click listener to static
        staticAsset.addEventListener('click', handleTVHit);
    }

    function handleTVHit() {
        if (!isGameActive) return;

        // Add signal
        signalLevel = Math.min(100, signalLevel + FILL_AMOUNT);
        updateSignalBar();

        // Shake effect
        staticAsset.classList.remove('tv-shake');
        void staticAsset.offsetWidth; // Trigger reflow to restart animation
        staticAsset.classList.add('tv-shake');

        // Pulse effect on bar
        signalBarContainer.classList.add('active');
        setTimeout(() => signalBarContainer.classList.remove('active'), 150);

        // Check for completion
        if (signalLevel >= 100) {
            completeMinigame();
        }
    }

    function updateSignalBar() {
        signalBarFill.style.width = signalLevel + '%';

        // Update static opacity (more signal = less static)
        staticAsset.style.opacity = 1 - (signalLevel / 100) * 0.9; // Keep minimum 10% opacity until complete
    }

    function completeMinigame() {
        isGameActive = false;
        clearInterval(depleteInterval);
        staticAsset.removeEventListener('click', handleTVHit);

        // Hide guide character
        const guideCharacter = document.getElementById('minigame-guide');
        if (guideCharacter) guideCharacter.classList.add('hidden');

        // Hide text bubble
        const textBubble = document.getElementById('text-bubble');
        if (textBubble) textBubble.classList.add('hidden');

        // Hide signal bar
        signalBarContainer.style.display = 'none';

        // Fade out static completely
        staticAsset.style.transition = 'opacity 0.3s ease';
        staticAsset.style.opacity = '0';

        // Start main TV sequence
        setTimeout(() => {
            startTVSequence();
        }, 300);
    }

    function startTVSequence() {
        // Start page animations sequence
        // 1. Background TV glitch (starts immediately)
        backgroundAsset.style.animation = 'crtPowerOn 0.6s ease-out forwards';

        // 2. Text TV glitch + floating (starts after background)
        setTimeout(() => {
            textAsset.style.animation = 'crtPowerOn 0.6s ease-out forwards 0s, floating 3s ease-in-out infinite 0.6s';
        }, 300);

        // 3. Character slide in (starts at 0.6s delay)
        setTimeout(() => {
            characterAsset.classList.add('intro-animation');

            // Switch to floating after intro finishes
            setTimeout(() => {
                characterAsset.classList.remove('intro-animation');
                characterAsset.classList.add('floating-animation');
            }, 1000); // Duration of slideInRight
        }, 600);

        // 4. Buttons slide up (starts at 1.8s delay)
        setTimeout(() => {
            yesBtn.style.animation = 'slideUpBtn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
            noBtn.style.animation = 'slideUpBtn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
        }, 1800);
    }

    // ========== CHARACTER POSITION CONTROLS ==========
    // Adjust these values to fine-tune vertical positions
    const characterPositions = {
        arn_flirt: 150,    // Base position (pixels from top)
        arn_shock: 165,    // Move down 30px
        arn_sad: 165,      // Move down 30px
        arn_upset: 165     // Move down 30px
    };
    // ==================================================

    // Game state
    let clickCount = 0;
    const maxClicks = 15;
    let currentCharacter = 'arn_flirt';
    const initialWidthPercentage = 20; // Matches CSS --no-width: 20%

    // 'No' Button Interaction
    noBtn.addEventListener('click', (e) => {
        // Increment click count
        clickCount++;

        // Check if game over
        if (clickCount >= maxClicks) {
            triggerFinalState();
            return;
        }

        // Update character based on click count
        updateCharacter();

        // Logic for shrinking and moving
        moveAndShrinkNoButton();
    });

    // 'Yes' Button Interaction - Show Success Popup
    yesBtn.addEventListener('click', () => {
        const popup = document.getElementById('success-popup');
        popup.classList.add('show');
    });

    // Calendar Button - Navigate to Main Page
    const calendarBtn = document.getElementById('calendar-btn');
    calendarBtn.addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    function updateCharacter() {
        let newCharacter = null;

        // Character transitions based on click count
        if (clickCount === 1 && currentCharacter === 'arn_flirt') {
            newCharacter = 'arn_shock';
        } else if (clickCount === 6 && currentCharacter === 'arn_shock') {
            newCharacter = 'arn_sad';
        } else if (clickCount === 11 && currentCharacter === 'arn_sad') {
            newCharacter = 'arn_upset';
        }

        // If character should change
        if (newCharacter) {
            currentCharacter = newCharacter;

            // Update the image source
            characterAsset.src = `../assets/images/character/${newCharacter}.png`;

            // Apply vertical position adjustment
            characterAsset.style.setProperty('--char-top', `${characterPositions[newCharacter]}px`);

            // Add bounce animation
            characterAsset.classList.add('character-bounce');

            // Remove animation class after it completes
            setTimeout(() => {
                characterAsset.classList.remove('character-bounce');
            }, 400); // Match animation duration
        }
    }

    function moveAndShrinkNoButton() {
        // --- 1. Movement Logic ---
        // Get current position
        const currentLeft = parseFloat(getComputedStyle(noBtn).getPropertyValue('--no-left') || noBtn.style.getPropertyValue('--no-left') || '55');
        const currentTop = parseFloat(getComputedStyle(noBtn).getPropertyValue('--no-top') || noBtn.style.getPropertyValue('--no-top') || '50');

        let randomLeft, randomTop, distance;
        const minDistance = 40; // Minimum distance to move (40% of viewport)

        // Keep trying until we find a position far enough away
        do {
            randomLeft = Math.floor(Math.random() * 75) + 5; // 5% to 80%
            randomTop = Math.floor(Math.random() * 80) + 10;  // 10% to 90%

            // Calculate Euclidean distance
            const dx = randomLeft - currentLeft;
            const dy = randomTop - currentTop;
            distance = Math.sqrt(dx * dx + dy * dy);
        } while (distance < minDistance);

        // Apply new position variables
        // We set --no-bottom to 'auto' to allow 'top' to control position
        noBtn.style.setProperty('--no-bottom', 'auto');
        noBtn.style.setProperty('--no-top', `${randomTop}%`);
        noBtn.style.setProperty('--no-left', `${randomLeft}%`);

        // --- 2. Shrinking Logic ---
        // Decrease size linearly or exponentially
        // Target: 0 width at maxClicks
        // Step size
        const shrinkFactor = initialWidthPercentage / maxClicks;
        const newWidth = initialWidthPercentage - (clickCount * shrinkFactor);

        // Ensure it doesn't go below 0 (though visual CSS might limits min-content)
        // We update the --no-width variable
        noBtn.style.setProperty('--no-width', `${Math.max(0, newWidth)}%`);
    }

    function triggerFinalState() {
        // Hide the No button
        noBtn.style.display = 'none';
        // Yes button stays at its original position and size
    }
});
