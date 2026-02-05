// --- Configuration ---
const CONFIG = {
    gridSize: 3, // 3x3
    puzzles: [
        { id: 1, image: 'assets/us.png' },
        { id: 2, image: 'assets/us2.png' },
        { id: 3, image: 'assets/us3.png' }
    ]
};

// --- State ---
const puzzleState = {
    1: { pieces: [], completed: false },
    2: { pieces: [], completed: false },
    3: { pieces: [], completed: false }
};
let allCompleted = false;

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
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
            // Trigger Exit Animations
            startTitle.classList.add('title-exit');
            startBtn.classList.add('btn-exit');
            startScreen.classList.add('screen-exit');

            // Wait for animation to finish
            setTimeout(() => {
                startScreen.classList.add('hidden');
                // Init Puzzles
                CONFIG.puzzles.forEach(puzzle => {
                    initPuzzle(puzzle.id, puzzle.image);
                });
            }, 800);
        });
    }
});

// --- Floating Hearts Background (DISABLED) ---
// function initHearts() {
//     const container = document.getElementById('hearts-container');
//     const heartSymbols = ['💖', '❤️', '💕', '🥰', '🌸'];

//     // Create 20 hearts
//     for (let i = 0; i < 20; i++) {
//         createHeart(container, heartSymbols);
//     }
// }

// function createHeart(container, symbols) {
//     const el = document.createElement('div');
//     el.classList.add('floating-heart');
//     el.innerHTML = symbols[Math.floor(Math.random() * symbols.length)];

//     // Randomize
//     el.style.left = Math.random() * 100 + 'vw';
//     el.style.animationDuration = (10 + Math.random() * 10) + 's';
//     el.style.animationDelay = (Math.random() * 5) + 's';
//     el.style.fontSize = (15 + Math.random() * 20) + 'px';

//     container.appendChild(el);
// }


// --- Puzzle Logic ---
function initPuzzle(puzzleId, imageSrc) {
    const grid = document.getElementById(`puzzle-grid-${puzzleId}`);
    const size = CONFIG.gridSize;
    let index = 0;

    // Clear loading state
    grid.innerHTML = '';

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const el = document.createElement('div');
            el.classList.add('puzzle-piece');
            el.dataset.index = index;
            el.dataset.row = row;
            el.dataset.col = col;
            el.dataset.puzzleId = puzzleId;

            // Set Background Position
            const xPercent = col * (100 / (size - 1));
            const yPercent = row * (100 / (size - 1));
            el.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
            el.style.backgroundImage = `url('${imageSrc}')`;

            // Set initial rotation (only once)
            const initialRot = getRandomRotation();
            el.dataset.visualRot = initialRot; // Tracks actual degrees for transform

            // Apply Initial Transform
            updateTransform(el);

            // Start hidden for sequential appearance
            el.style.opacity = '0';
            el.style.transform = `rotate(${el.dataset.visualRot}deg) scale(0.5)`;

            // Click Event
            el.addEventListener('click', () => rotatePiece(el, puzzleId));

            grid.appendChild(el);
            puzzleState[puzzleId].pieces.push(el);

            // Animate piece appearance with staggered puzzle loading
            const baseDelay = (puzzleId - 1) * 200; // Stagger each puzzle start by 200ms
            const pieceDelay = index * 100; // Reduced from 150ms to 100ms per piece

            setTimeout(() => {
                requestAnimationFrame(() => {
                    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    el.style.opacity = '1';
                    el.style.transform = `rotate(${el.dataset.visualRot}deg) scale(1)`;

                    // After appearance animation, set proper rotation transition
                    setTimeout(() => {
                        el.style.transition = 'transform 0.3s ease';
                    }, 400);
                });
            }, baseDelay + pieceDelay);

            index++;
        }
    }

    // Show shadow after all pieces have appeared
    // Each puzzle starts 200ms apart, last piece in puzzle takes (8 * 100) = 800ms, plus 400ms animation
    const totalTime = (puzzleId - 1) * 200 + 800 + 400 + 100;
    setTimeout(() => {
        grid.classList.add('show-shadow');
    }, totalTime);
}

function getRandomRotation() {
    const options = [0, 90, 180, 270];
    return options[Math.floor(Math.random() * options.length)];
}

function rotatePiece(el, puzzleId) {
    if (puzzleState[puzzleId].completed) return;

    // Rotate by 90deg - keep incrementing to prevent anti-clockwise rotation
    let currentRot = parseInt(el.dataset.visualRot);
    currentRot = currentRot + 90;
    el.dataset.visualRot = currentRot;

    updateTransform(el);
    checkPuzzleComplete(puzzleId);
}

function updateTransform(el) {
    const rot = parseInt(el.dataset.visualRot);
    el.style.transform = `rotate(${rot}deg)`;
}

function checkPuzzleComplete(puzzleId) {
    const pieces = puzzleState[puzzleId].pieces;
    const allCorrect = pieces.every(p => parseInt(p.dataset.visualRot) % 360 === 0);

    if (allCorrect && !puzzleState[puzzleId].completed) {
        puzzleState[puzzleId].completed = true;
        winPuzzle(puzzleId);
        checkAllPuzzlesComplete();
    }
}

function winPuzzle(puzzleId) {
    // 1. Add celebration class to grid for animation
    const grid = document.getElementById(`puzzle-grid-${puzzleId}`);
    grid.classList.add('puzzle-complete');

    // 2. Update hint text
    const hintText = document.querySelector(`.hint-text[data-puzzle="${puzzleId}"]`);
    hintText.textContent = 'Complete! ✓';
    hintText.style.color = '#90EE90';
    hintText.style.fontWeight = 'bold';
}

function checkAllPuzzlesComplete() {
    const allDone = Object.values(puzzleState).every(p => p.completed);

    if (allDone && !allCompleted) {
        allCompleted = true;
        triggerSequentialFlip();
    }
}

function triggerSequentialFlip() {
    // Hide instruction text
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) subtitle.classList.add('hidden');

    // Flip puzzles one by one
    const delays = [0, 800, 1600]; // 800ms between each flip

    // Pre-load video to prevent jitter
    const video = document.getElementById('outro-video');
    if (video) video.load();

    CONFIG.puzzles.forEach((puzzle, index) => {
        setTimeout(() => {
            const wrapper = document.querySelector(`.puzzle-wrapper:nth-child(${index + 1})`);
            wrapper.classList.add('flipped');

            // Update hint text during flip
            const hintText = document.querySelector(`.hint-text[data-puzzle="${puzzle.id}"]`);
            hintText.style.opacity = '0';
        }, delays[index]);
    });

    // Start Video Outro after flips are done
    setTimeout(() => {
        playOutro();
    }, 4000); // 1600ms last delay + 800ms flip + buffer
}

function playOutro() {
    const videoOverlay = document.getElementById('video-overlay');
    const video = document.getElementById('outro-video');

    if (videoOverlay && video) {
        videoOverlay.classList.remove('hidden');
        video.play().catch(e => console.log("Autoplay prevented:", e));

        // Prevent interaction
        videoOverlay.style.pointerEvents = 'none';

        video.onended = () => {
            // Fade out video or just cut to black? User said "video comes to end, there will be a black screen"
            showFinalScreen();
        };
    }
}

function showFinalScreen() {
    const videoOverlay = document.getElementById('video-overlay');
    const outroScreen = document.getElementById('outro-screen');
    const outroText = document.querySelector('.outro-text');
    const outroBtn = document.querySelector('.outro-btn');

    // Hide video
    if (videoOverlay) videoOverlay.classList.add('hidden');

    // Show final screen
    if (outroScreen) {
        outroScreen.classList.remove('hidden');
    }

    // Typewriter Logic
    if (outroText && outroBtn) {
        const text = "Thank you for being a part of my life ❤️";
        outroText.textContent = ""; // Clear initial text

        let i = 0;
        function typeWriter() {
            if (i < text.length) {
                outroText.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100); // Typing speed
            } else {
                // Done typing
                outroText.classList.add('typing-done');
                // Show button
                setTimeout(() => {
                    outroBtn.classList.add('visible');
                }, 500);
            }
        }

        // Start typing after a short delay
        setTimeout(typeWriter, 1000);
    }
}
