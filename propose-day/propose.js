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

    // Initialize - wait for Start Click
    startBtn.addEventListener('click', () => {
        // Exit animations for start screen
        startTitle.classList.add('title-exit');
        startBtn.classList.add('btn-exit');
        startScreen.classList.add('screen-exit');

        // Wait for start screen to exit before starting page animations
        setTimeout(() => {
            startScreen.classList.add('hidden');

            // Start page animations sequence
            // 1. Background TV glitch (starts at 0.2s delay like original)
            setTimeout(() => {
                backgroundAsset.style.animation = 'crtPowerOn 0.6s ease-out forwards';
            }, 200);

            // 2. Text TV glitch + floating (starts at 0.5s delay like original)
            setTimeout(() => {
                textAsset.style.animation = 'crtPowerOn 0.6s ease-out forwards 0s, floating 3s ease-in-out infinite 0.6s';
            }, 500);

            // 3. Character slide in (starts at 0.8s delay like original)
            setTimeout(() => {
                characterAsset.classList.add('intro-animation');

                // Switch to floating after intro finishes
                setTimeout(() => {
                    characterAsset.classList.remove('intro-animation');
                    characterAsset.classList.add('floating-animation');
                }, 1000); // Duration of slideInRight
            }, 800);

            // 4. Buttons slide up (starts at 2s delay like original)
            setTimeout(() => {
                yesBtn.style.animation = 'slideUpBtn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
                noBtn.style.animation = 'slideUpBtn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
            }, 2000);
        }, 800); // Match start screen exit duration
    });

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
