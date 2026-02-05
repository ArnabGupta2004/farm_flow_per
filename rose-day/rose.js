// Rose Day Logic

document.addEventListener('DOMContentLoaded', () => {
    // === Variables ===
    const toggle = document.getElementById('dayNightToggle');
    const daySky = document.querySelector('.day-sky');
    const nightSky = document.querySelector('.night-sky');
    const sun = document.querySelector('.celestial.sun');
    const moon = document.querySelector('.celestial.moon');
    const body = document.body;

    // Start Screen Logic
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const startTitle = document.getElementById('start-title');
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

    if (startBtn) {
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

                // Show game hint with slight delay after character
                const gameHint = document.getElementById('game-hint');
                if (gameHint) {
                    setTimeout(() => {
                        gameHint.classList.remove('hidden');
                    }, 300); // 300ms delay after character appears
                }
            }, 800); // Match animation duration (0.8s)
        });
    }

    // Game Elements
    const seedItem = document.getElementById('seedItem');
    const waterCanItem = document.getElementById('waterCanItem');
    const dropZone = document.getElementById('dropZone');
    const plantedSeed = document.querySelector('.seed-planted');

    // Custom Ghost Elements
    const ghost = document.getElementById('custom-drag-ghost');
    const emptyDragImage = document.getElementById('empty-drag-image');

    // Game State
    let gameState = {
        seedPlanted: false,
        watered: false,
        sprouted: false,
        budGrown: false,
        roseBloomed: false
    };

    // Hint System with Character Switching
    const hintElement = document.getElementById('game-hint');
    const characterGuide = document.getElementById('character-guide');
    const characterImg = characterGuide ? characterGuide.querySelector('.character-img') : null;

    // Character mapping for each hint
    const characterMap = {
        "Plant the Seed...": "arn_point",
        "The seed is thirsty...": "arn_talk",
        "It needs energy to grow...": "arn_think",
        "Growing fast! It's thirsty again...": "arn_point",
        "It needs love & light to bloom!": "arn_think",
        "Happy Rose Day!": "arn_happy"
    };

    function updateHint(text, characterName = null) {
        if (hintElement) {
            // 1. Slide Up Out
            hintElement.classList.add('slide-up');

            setTimeout(() => {
                // 2. Update Text (while invisible)
                hintElement.textContent = text;

                // 3. Update Character Image if mapping exists
                if (characterImg) {
                    const newCharacter = characterName || characterMap[text];
                    if (newCharacter) {
                        characterImg.src = `../assets/images/character/${newCharacter}.png`;
                    }
                }

                // 4. Prepare for entry (move to bottom instantly)
                hintElement.style.transition = 'none';
                hintElement.classList.remove('slide-up');
                hintElement.classList.add('slide-from-bottom'); // Position at bottom

                // Force Reflow
                void hintElement.offsetWidth;

                // 5. Slide In from Bottom
                hintElement.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                hintElement.classList.remove('slide-from-bottom');
            }, 500); // Wait for exit animation
        }
    }

    // === Day/Night Toggle ===
    if (toggle) {
        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                // Night mode
                sun.classList.add('exit-down');
                sun.classList.remove('active');

                setTimeout(() => {
                    sun.classList.remove('exit-down');
                    moon.classList.add('active');
                }, 500);

                daySky.classList.remove('active');
                nightSky.classList.add('active');
                body.classList.add('night-mode');
            } else {
                // Day mode
                moon.classList.add('exit-down');
                moon.classList.remove('active');

                setTimeout(() => {
                    moon.classList.remove('exit-down');
                    sun.classList.add('active');
                }, 500);

                daySky.classList.add('active');
                nightSky.classList.remove('active');
                body.classList.remove('night-mode');

                // Game Logic: Sun triggers sprout if watered
                if (gameState.seedPlanted && gameState.watered && !gameState.sprouted) {
                    gameState.sprouted = true;
                    setTimeout(growSprout, 1000); // Wait for sun to come up
                } else if (gameState.budGrown && !gameState.roseBloomed) {
                    gameState.roseBloomed = true;
                    setTimeout(bloomRose, 1000);
                }
            }
        });
    }

    function bloomRose() {
        console.log("Blooming!");
        const bud = document.querySelector('.bud');
        const rose = document.querySelector('.rose');
        updateHint("Happy Rose Day!");

        // Morph Animation: Bud shrinks, Rose appears
        bud.animate([
            { transform: 'translate(-50%, 0) scale(1)', opacity: 1 },
            { transform: 'translate(-50%, 0) scale(0.8)', opacity: 0 }
        ], {
            duration: 1000,
            easing: 'ease-in',
            fill: 'forwards'
        });

        rose.classList.remove('hidden');
        rose.animate([
            { transform: 'translate(-50%, 0) scale(0.5)', opacity: 0 },
            { transform: 'translate(-50%, 0) scale(1)', opacity: 1 }
        ], {
            duration: 1000,
            easing: 'ease-out',
            fill: 'forwards'
        });

        // Start Petal Rain
        setTimeout(startPetalRain, 500);

        // Show Popup
        setTimeout(() => {
            const popup = document.getElementById('celebration-popup');
            popup.classList.remove('hidden');
            // Force reflow
            void popup.offsetWidth;
            popup.classList.add('visible');
        }, 6000); // USER: 5s delay after bloom (1s) = 6s total
    }

    function startPetalRain() {
        const petals = ['🌹', '🌸', '🏵️', '🌺'];
        const duration = 5000; // Rain for 5 seconds
        const interval = setInterval(() => {
            const petal = document.createElement('div');
            petal.classList.add('rose-petal');
            petal.textContent = petals[Math.floor(Math.random() * petals.length)];

            // Random position and animation properties
            petal.style.left = Math.random() * 100 + 'vw';
            petal.style.animationDuration = Math.random() * 3 + 2 + 's'; // 2-5s
            petal.style.fontSize = Math.random() * 20 + 20 + 'px';

            document.body.appendChild(petal);

            // Cleanup
            setTimeout(() => {
                petal.remove();
            }, 5000);
        }, 100);

        setTimeout(() => clearInterval(interval), duration);
    }

    function growSprout() {
        console.log("Sun is out! Sprouting...");
        plantedSeed.style.opacity = '1';
        updateHint("Growing fast! It's thirsty again...");

        // Fade out seed
        plantedSeed.animate([
            { opacity: 1 },
            { opacity: 0 }
        ], {
            duration: 800,
            fill: 'forwards'
        });

        const sprout = document.querySelector('.sprout');
        sprout.classList.remove('hidden');

        // Slide up sprout
        sprout.animate([
            { transform: 'translate(-50%, 100%)', opacity: 0 },
            { transform: 'translate(-50%, 0)', opacity: 1 }
        ], {
            duration: 3000, // Slower (3s)
            easing: 'ease-out',
            fill: 'forwards'
        });

        // Hide water can if visible (optional, but good for cleanup)
        // waterCanItem.classList.add('hidden');  // USER: Keep available
    }

    // === Custom Drag Handling ===
    let isDraggingWater = false;

    // Separate Document DragOver for smooth ghost movement
    document.addEventListener('dragover', (e) => {
        if (isDraggingWater && ghost) {
            e.preventDefault(); // Necessary
            // Move ghost to mouse position
            // Center is handled by CSS translate(-50%, -50%)
            ghost.style.top = `${e.clientY}px`;
            ghost.style.left = `${e.clientX}px`;
        }
    });

    // === Drag and Drop Logic ===

    setupDraggable(seedItem, 'seed');
    setupDraggable(waterCanItem, 'water');

    function setupDraggable(element, type) {
        if (!element) return;

        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', type);
            element.classList.add('dragging');

            if (type === 'water') {
                isDraggingWater = true;

                // Hide default ghost
                if (emptyDragImage) {
                    e.dataTransfer.setDragImage(emptyDragImage, 0, 0);
                }

                // Show custom ghost
                if (ghost) {
                    ghost.classList.remove('hidden');
                    // Set initial position
                    ghost.style.top = `${e.clientY}px`;
                    ghost.style.left = `${e.clientX}px`;
                }

                // Make original invisible (opacity 0) so user only sees ghost
                // But keep space occupied or position fixed
                setTimeout(() => {
                    element.style.opacity = '0';
                }, 0);
            } else {
                // Default transparency for seed
                setTimeout(() => {
                    element.style.opacity = '0.5';
                }, 0);
            }
        });

        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
            element.style.opacity = '1';

            if (type === 'water') {
                isDraggingWater = false;
                if (ghost) ghost.classList.add('hidden');
            }
        });
    }

    // Drop Zone Logic
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const data = e.dataTransfer.getData('text/plain');

            if (data === 'seed' && !gameState.seedPlanted) {
                plantSeed();
            } else if (data === 'water') {
                if (gameState.seedPlanted && !gameState.watered) {
                    waterPlant();
                } else if (gameState.sprouted && !gameState.budGrown) {
                    waterSprout();
                }
            }
        });
    }

    function plantSeed() {
        seedItem.style.display = 'none';
        plantedSeed.classList.remove('hidden');
        gameState.seedPlanted = true;
        updateHint("The seed is thirsty...");

        plantedSeed.animate([
            { transform: 'translate(-50%, -20px)', opacity: 0 },
            { transform: 'translate(-50%, 0)', opacity: 1 }
        ], {
            duration: 500,
            easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        });

        setTimeout(() => {
            waterCanItem.classList.remove('hidden');
            updateHint("The seed is thirsty...");
        }, 800);
        console.log("Seed planted!");
    }

    function waterPlant() {
        console.log("Plant watered!");
        gameState.watered = true;
        updateHint("It needs energy to grow...");

        dropZone.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.02)' },
            { transform: 'scale(1)' }
        ], {
            duration: 300
        });

        // Auto Switch to Night Mode after a short delay
        setTimeout(() => {
            if (toggle && !toggle.checked) {
                switchNight();
            }
        }, 1000);
    }

    function waterSprout() {
        console.log("Sprout watered!");
        gameState.budGrown = true;
        updateHint("It needs love & light to bloom!");

        dropZone.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.02)' },
            { transform: 'scale(1)' }
        ], {
            duration: 300
        });

        const sprout = document.querySelector('.sprout');
        const bud = document.querySelector('.bud');

        // Morph Animation: Sprout shrinks/fades, Bud grows/appears
        sprout.animate([
            { transform: 'translate(-50%, 0) scale(1)', opacity: 1 },
            { transform: 'translate(-50%, 0) scale(0.8)', opacity: 0 }
        ], {
            duration: 1000,
            easing: 'ease-in',
            fill: 'forwards'
        });

        bud.classList.remove('hidden');
        bud.animate([
            { transform: 'translate(-50%, 0) scale(0.5)', opacity: 0 },
            { transform: 'translate(-50%, 0) scale(1)', opacity: 1 }
        ], {
            duration: 1000,
            easing: 'ease-out',
            fill: 'forwards'
        });

        // Auto Switch to Night Mode after morph (1s + 1s delay)
        setTimeout(() => {
            if (toggle && !toggle.checked) {
                switchNight();
            }
        }, 2000);
    }

    function switchNight() {
        toggle.checked = true;

        // Trigger logic directly from toggle listener or manually if needed
        // Assuming toggle listener handles visual changes based on 'change' event
        // But programmatically setting .checked doesn't trigger 'change' event usually
        // So we dispatch it
        toggle.dispatchEvent(new Event('change'));
    }
});
