const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameArea = document.getElementById('game-area');
const ship = document.getElementById('player-ship');

// --- Game Configuration & State ---
const WAVES = [
    "I promise to care for you",
    "I promise to stand by you always",
    "I promise to choose you every day and be there in every moment"
];

let gameState = {
    wave: 0,
    activeWords: [],
    particles: [],
    lasers: [],
    destroyedLog: { 0: [], 1: [], 2: [] },
    isWaveActive: false,
    targetWordIndex: -1
};

// Resize Canvas to match container resolution
function resize() {
    canvas.width = gameArea.clientWidth;
    canvas.height = gameArea.clientHeight;
}
window.addEventListener('resize', resize);
resize(); // Init

// --- Classes ---

class Word {
    constructor(text) {
        this.text = text;
        this.x = Math.random() * (canvas.width - 100) + 50;
        this.y = -30;
        this.typedIndex = 0;
        this.speed = 0.8 + (gameState.wave * 0.3); // Slower speed for smaller box
        this.markedForDeletion = false;

        // Visuals
        this.color = '#ffd1dc';
        this.matchedColor = '#ff69b4';

        // Track individual letters for letter-by-letter destruction
        this.letters = text.split('').map((char, i) => ({
            char: char,
            visible: true,
            index: i
        }));
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height + 50) {
            // Loop or Respawn logic?
            // User requested "random spawning". 
            // If it falls off, let's respawn it at top to be forgiving.
            this.y = -50;
            this.x = Math.random() * (canvas.width - 100) + 50;
        }
    }

    draw() {
        ctx.font = "bold 16px monospace"; // Smaller font for smaller box
        ctx.textAlign = 'center';

        // Highlight if targeted
        if (gameState.activeWords.indexOf(this) === gameState.targetWordIndex) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.matchedColor;
        } else {
            ctx.shadowBlur = 0;
        }

        // Draw each letter individually
        const charWidth = ctx.measureText('M').width; // Use monospace average
        const totalWidth = this.text.length * charWidth;
        const startX = this.x - (totalWidth / 2);

        this.letters.forEach((letter, i) => {
            if (letter.visible) {
                if (i < this.typedIndex) {
                    ctx.fillStyle = this.matchedColor;
                } else {
                    ctx.fillStyle = this.color;
                }
                ctx.fillText(letter.char, startX + (i * charWidth), this.y);
            }
        });
    }

    getRemainingText() {
        return this.letters.filter(l => l.visible).map(l => l.char).join('');
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.color = color;
        this.markedForDeletion = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.05;
        if (this.life <= 0) this.markedForDeletion = true;
    }

    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class Laser {
    constructor(startX, startY, targetX, targetY) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.angle = Math.atan2(targetY - startY, targetX - startX);
        this.speed = 12;
        this.markedForDeletion = false;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        const dist = Math.hypot(this.targetX - this.x, this.targetY - this.y);
        if (dist < 10) {
            this.markedForDeletion = true;
        }
    }

    draw() {
        ctx.strokeStyle = '#ff4d6d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - Math.cos(this.angle) * 8, this.y - Math.sin(this.angle) * 8);
        ctx.stroke();
    }
}

// --- Logic ---

function getShipPos() {
    // Ship is DOM element centered at bottom.
    // We need coordinates relative to canvas.
    const rect = ship.getBoundingClientRect();
    const gameRect = gameArea.getBoundingClientRect();

    // Center of ship relative to game area
    return {
        x: (rect.left - gameRect.left) + (rect.width / 2),
        y: (rect.top - gameRect.top) // Top of ship is better for laser origin
    };
}

function spawnWave() {
    const sentence = WAVES[gameState.wave];
    let words = sentence.split(' ');

    // Shuffle
    for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
    }

    let i = 0;
    let interval = setInterval(() => {
        if (i >= words.length) {
            clearInterval(interval);
            return;
        }
        gameState.activeWords.push(new Word(words[i]));
        i++;
    }, 1200);

    gameState.isWaveActive = true;
    updateUI();
}

function updateUI() {
    document.getElementById('waveNum').innerText = gameState.wave + 1;
}

function rotateShip(targetX, targetY) {
    const pos = getShipPos(); // Actually we need center for rotation
    // Center of ship is ~ width/2, height/2
    // But getShipPos gave top center.
    // Let's just assume ship is at bottom center of canvas for simple calculation
    const shipX = canvas.width / 2;
    const shipY = canvas.height - 40;

    const angle = Math.atan2(targetY - shipY, targetX - shipX);
    // Convert to degrees and add 90 because ship points up?
    // Assuming ship.gif points UP by default.
    const deg = (angle * 180 / Math.PI) + 90;

    ship.style.transform = `translateX(-50%) rotate(${deg}deg)`;
}

function handleInput(key) {
    if (!gameState.isWaveActive) return;

    // Check locked target
    if (gameState.targetWordIndex !== -1) {
        // Validation: Does target still exist?
        if (!gameState.activeWords[gameState.targetWordIndex]) {
            gameState.targetWordIndex = -1;
            return;
        }

        const target = gameState.activeWords[gameState.targetWordIndex];
        const remainingText = target.getRemainingText();
        const nextChar = remainingText[0];

        if (nextChar && key.toLowerCase() === nextChar.toLowerCase()) {
            // Find the first visible letter and hide it
            const letterIndex = target.letters.findIndex(l => l.visible);
            if (letterIndex !== -1) {
                target.letters[letterIndex].visible = false;

                // Calculate letter position for particles
                const charWidth = ctx.measureText('M').width;
                const totalWidth = target.text.length * charWidth;
                const startX = target.x - (totalWidth / 2);
                const letterX = startX + (letterIndex * charWidth);

                // Create particles at letter position
                for (let i = 0; i < 5; i++) {
                    gameState.particles.push(new Particle(letterX, target.y, '#ff69b4'));
                }
            }

            target.typedIndex++;

            // Interaction visual
            const shipPos = getShipPos();
            gameState.lasers.push(new Laser(shipPos.x, shipPos.y, target.x, target.y));
            rotateShip(target.x, target.y);

            // Check if all letters are destroyed
            if (target.letters.every(l => !l.visible)) {
                destroyWord(gameState.targetWordIndex);
                gameState.targetWordIndex = -1;
                // Reset rotation
                ship.style.transform = `translateX(-50%) rotate(0deg)`;
            }
        }
    } else {
        // Find new target
        const candidates = gameState.activeWords
            .map((w, i) => ({ word: w, index: i }))
            .filter(item => {
                const remaining = item.word.getRemainingText();
                return remaining.length > 0 && remaining[0].toLowerCase() === key.toLowerCase();
            });

        if (candidates.length > 0) {
            // Pick lowest Y (closest to bottom)
            candidates.sort((a, b) => b.word.y - a.word.y);
            const choice = candidates[0];

            gameState.targetWordIndex = choice.index;
            const target = choice.word;

            // Find the first visible letter and hide it
            const letterIndex = target.letters.findIndex(l => l.visible);
            if (letterIndex !== -1) {
                target.letters[letterIndex].visible = false;

                // Calculate letter position for particles
                const charWidth = ctx.measureText('M').width;
                const totalWidth = target.text.length * charWidth;
                const startX = target.x - (totalWidth / 2);
                const letterX = startX + (letterIndex * charWidth);

                // Create particles at letter position
                for (let i = 0; i < 5; i++) {
                    gameState.particles.push(new Particle(letterX, target.y, '#ff69b4'));
                }
            }

            target.typedIndex++;

            // Interaction visual
            const shipPos = getShipPos();
            gameState.lasers.push(new Laser(shipPos.x, shipPos.y, target.x, target.y));
            rotateShip(target.x, target.y);

            // Check if all letters are destroyed
            if (target.letters.every(l => !l.visible)) {
                destroyWord(gameState.targetWordIndex);
                gameState.targetWordIndex = -1;
                ship.style.transform = `translateX(-50%) rotate(0deg)`;
            }
        }
    }
}

function destroyWord(index) {
    const word = gameState.activeWords[index];
    gameState.destroyedLog[gameState.wave].push(word.text);

    // Particles
    for (let i = 0; i < 8; i++) {
        gameState.particles.push(new Particle(word.x, word.y, '#ff69b4'));
    }

    gameState.activeWords.splice(index, 1);
    checkWaveStatus();
}

function checkWaveStatus() {
    const requiredLength = WAVES[gameState.wave].split(' ').length;
    if (gameState.destroyedLog[gameState.wave].length === requiredLength) {
        endWave();
    }
}

function endWave() {
    gameState.isWaveActive = false;
    if (gameState.wave < 2) {
        document.getElementById('nextWaveBtn').classList.remove('hidden');
    } else {
        document.getElementById('reportBtn').classList.remove('hidden');
    }
}

// --- Loop ---
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update/Draw Words
    gameState.activeWords.forEach(w => {
        w.update();
        w.draw();
    });

    // Update/Draw Lasers
    gameState.lasers.forEach((l, i) => {
        l.update();
        l.draw();
        if (l.markedForDeletion) gameState.lasers.splice(i, 1);
    });

    // Update/Draw Particles
    gameState.particles.forEach((p, i) => {
        p.update();
        p.draw();
        if (p.markedForDeletion) gameState.particles.splice(i, 1);
    });

    requestAnimationFrame(loop);
}

// --- Events ---
document.addEventListener('keydown', e => {
    if (e.key.length === 1 && e.key.match(/[a-z]/i)) handleInput(e.key);
});

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

        spawnWave();
    }, 800); // Match animation duration (0.8s)
});

document.getElementById('nextWaveBtn').addEventListener('click', () => {
    document.getElementById('nextWaveBtn').classList.add('hidden');
    gameState.wave++;
    spawnWave();
});

document.getElementById('reportBtn').addEventListener('click', () => {
    document.getElementById('reportBtn').classList.add('hidden');
    document.getElementById('missionModal').classList.remove('hidden');
    generateReport();
});

document.getElementById('revealBtn').addEventListener('click', () => {
    document.getElementById('revealBtn').classList.add('hidden');
    document.getElementById('revealBtn').classList.remove('fade-in');

    const title = document.getElementById('reportTitle');
    title.classList.remove('hidden');
    title.classList.add('elegant-reveal');

    animateRearrange();
});

document.getElementById('calendarBtn').addEventListener('click', () => {
    window.location.href = '../index.html';
});

// --- Report Logic ---
function generateReport() {
    const container = document.getElementById('reportContainer');
    container.innerHTML = '';
    // Hide title initially
    document.getElementById('reportTitle').classList.add('hidden');

    let waveIndex = 0;

    function typeLine() {
        if (waveIndex >= 3) {
            // All lines done, show Reveal button
            setTimeout(() => {
                const btn = document.getElementById('revealBtn');
                btn.classList.remove('hidden');
                btn.classList.add('fade-in');
            }, 500);
            return;
        }

        const div = document.createElement('div');
        div.className = 'report-line';

        // Header part "WAVE X ANALYSIS:"
        const headerDiv = document.createElement('div');
        headerDiv.style.color = '#888';
        headerDiv.style.marginBottom = '5px'; // Margin bottom for spacing between header and text
        headerDiv.style.display = 'block';
        headerDiv.style.width = '100%';
        div.appendChild(headerDiv);

        // Word container
        const wordBox = document.createElement('div');
        wordBox.style.position = 'relative';
        wordBox.style.height = 'auto'; // Auto height to fit text
        wordBox.style.minHeight = '25px'; // Minimum height to prevent collapse
        wordBox.style.width = '100%';
        div.appendChild(wordBox);

        container.appendChild(div);

        // Type "WAVE X ANALYSIS:" char by char
        const text = `WAVE ${waveIndex + 1} ANALYSIS:`;
        let charIndex = 0;

        function typeChar() {
            if (charIndex < text.length) {
                headerDiv.innerText += text[charIndex];
                charIndex++;
                setTimeout(typeChar, 50);
            } else {
                // Done typing header, now append words one by one
                headerDiv.innerText += " "; // Space
                showWords(waveIndex, wordBox, () => {
                    waveIndex++;
                    setTimeout(typeLine, 300); // Delay before next line
                });
            }
        }

        typeChar();
    }

    function showWords(wIdx, box, callback) {
        const words = gameState.destroyedLog[wIdx];
        let w = 0;

        function nextWord() {
            if (w < words.length) {
                const s = document.createElement('span');
                s.className = 'word-span';
                s.innerText = words[w];
                s.dataset.word = words[w];
                box.appendChild(s);
                w++;
                setTimeout(nextWord, 150); // Delay between words
            } else {
                callback();
            }
        }
        nextWord();
    }

    typeLine(); // Start
}

function animateRearrange() {
    for (let w = 0; w < 3; w++) {
        const correctSentence = WAVES[w].split(' ');
        const reportLines = document.querySelectorAll('.report-line');
        if (!reportLines[w]) continue;

        const allDivs = reportLines[w].querySelectorAll('div');
        let wordBox = null;
        // Find the div with position style (wordBox)
        for (let div of allDivs) {
            if (div.style.position === 'relative') {
                wordBox = div;
                break;
            }
        }
        if (!wordBox) continue;

        const currentSpans = Array.from(wordBox.children);
        if (currentSpans.length === 0) continue;

        // Step 1: Record starting positions
        const elementsData = currentSpans.map(span => ({
            element: span,
            word: span.dataset.word,
            startRect: span.getBoundingClientRect()
        }));

        // Step 2: Create correct order
        const orderedData = [];
        const availableElements = [...elementsData];

        correctSentence.forEach(word => {
            const foundIndex = availableElements.findIndex(data => data.word === word);
            if (foundIndex !== -1) {
                orderedData.push(availableElements[foundIndex]);
                availableElements.splice(foundIndex, 1);
            }
        });

        // Step 3: Reorder DOM
        wordBox.innerHTML = '';
        orderedData.forEach(data => {
            wordBox.appendChild(data.element);
        });

        // Step 4: Immediately get new positions and apply transform (Synchronous FLIP)
        orderedData.forEach(data => {
            const endRect = data.element.getBoundingClientRect();
            const deltaX = data.startRect.left - endRect.left;
            const deltaY = data.startRect.top - endRect.top;

            // Apply starting position instantly
            data.element.style.transition = 'none';
            data.element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        });

        // Force reflow
        document.body.offsetHeight;

        // Step 5: Animate to final position
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                orderedData.forEach(data => {
                    data.element.style.transition = 'transform 2.5s cubic-bezier(0.25, 0.1, 0.25, 1)';
                    data.element.style.transform = 'translate(0, 0)';
                    data.element.classList.add('rearranging');
                });
            });
        });
    }

    setTimeout(() => {
        const calBtn = document.getElementById('calendarBtn');
        calBtn.classList.remove('hidden');
        calBtn.classList.add('fade-in');
    }, 3000); // Increased delay to match slower animation
}

// Start animation loop (but don't spawn wave yet)
loop();
