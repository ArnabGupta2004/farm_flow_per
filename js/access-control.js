const AccessControl = {
    // Password Storage
    passwords: {
        'rose-day': 'R8H3X',
        'propose-day': 'P9K2L',
        'chocolate-day': 'C4M5N',
        'teddy-day': 'T7B1V',
        'promise-day': 'P3Q9Z',
        'hug-day': 'H2W8Y',
        'kiss-day': 'K5J4R',
        'valentines-day': 'V1L0E'
    },

    // Inject Styles for the Modal
    injectStyles: function () {
        if (document.getElementById('ac-modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'ac-modal-styles';
        style.innerHTML = `
            .ac-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2147483647;
                opacity: 0;
                transition: opacity 0.3s ease-out;
            }
            .ac-modal-visible {
                opacity: 1;
            }
            .ac-modal-box {
                background: linear-gradient(135deg, #fff0f5 0%, #fff 100%);
                padding: 0; 
                border-radius: 30px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.4);
                border: 4px solid #ff69b4;
                width: 90%;
                max-width: 650px; /* Wider for side-by-side */
                font-family: 'Love Ya Like A Sister', cursive;
                position: relative;
                transform: scale(0.8);
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                display: flex;
                flex-direction: row; /* Side by side */
                overflow: hidden;
            }
            .ac-modal-visible .ac-modal-box {
                transform: scale(1);
            }
            
            /* Left Side: Image */
            .ac-modal-left {
                width: 50%;
                background: #ffb7c5;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0px;
                border-right: 2px dashed #ff69b4;
            }
            .ac-modal-img {
                width: 100%;
                max-width: 200px;
                height: auto;
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            /* Right Side: Content */
            .ac-modal-right {
                width: 60%;
                padding: 30px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }

            .ac-modal-title {
                color: #d10056;
                font-size: 1.8rem;
                margin: 0 0 20px 0;
                text-shadow: 1px 1px 0px rgba(255,255,255,0.8);
            }
            .ac-input-group {
                width: 100%;
                margin-bottom: 15px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .ac-password-input {
                width: 100%;
                max-width: 250px;
                padding: 12px;
                border: 3px solid #ffb7c5;
                border-radius: 15px;
                font-size: 1.3rem;
                text-align: center;
                outline: none;
                transition: all 0.3s;
                color: #d10056;
                font-family: inherit;
                background: rgba(255, 255, 255, 0.8);
            }
            .ac-password-input:focus {
                border-color: #ff1493;
                box-shadow: 0 0 15px rgba(255, 20, 147, 0.2);
            }
            .ac-btn-group {
                display: flex;
                justify-content: center;
                gap: 15px;
                width: 100%;
                margin-top: 10px;
            }
            .ac-btn {
                padding: 12px 25px;
                border-radius: 20px;
                border: none;
                font-family: inherit;
                font-size: 1.1rem;
                cursor: pointer;
                transition: transform 0.2s, background 0.2s;
                font-weight: bold;
            }
            .ac-btn:active {
                transform: scale(0.95);
            }
            .ac-btn-submit {
                background: #ff1493;
                color: white;
                box-shadow: 0 4px 0 #c71585;
            }
            .ac-btn-submit:hover {
                background: #ff0080;
            }
            .ac-btn-cancel {
                background: #f0f0f0;
                color: #555;
                box-shadow: 0 4px 0 #ccc;
            }
            .ac-btn-cancel:hover {
                background: #e0e0e0;
            }
            .ac-error-msg {
                color: crimson;
                margin-top: 15px;
                font-size: 1rem;
                min-height: 1.5em;
                opacity: 0;
                transition: opacity 0.3s;
                font-weight: bold;
            }

            /* Responsive */
            @media (max-width: 600px) {
                .ac-modal-box {
                    flex-direction: column;
                    width: 85%;
                }
                .ac-modal-left, .ac-modal-right {
                    width: 100%;
                    border-right: none;
                }
                .ac-modal-left {
                    padding: 15px;
                    border-bottom: 2px dashed #ffb7c5;
                }
                .ac-modal-img {
                    max-width: 100px;
                }
                .ac-modal-right {
                    padding: 20px;
                }
            }

            @keyframes shake {
                0% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                50% { transform: translateX(5px); }
                75% { transform: translateX(-5px); }
                100% { transform: translateX(0); }
            }
            .shake-anim {
                animation: shake 0.4s ease-in-out;
            }
        `;
        document.head.appendChild(style);
    },

    // Prompt for Password
    promptPassword: function (folderName, onSuccessCallback) {
        console.log('[AccessControl] Appending Modal for:', folderName);
        this.injectStyles();

        const existing = document.querySelector('.ac-modal-overlay');
        if (existing) existing.remove();

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('dev') === 'true') {
            onSuccessCallback();
            return;
        }

        // --- DOM Creation ---

        const overlay = document.createElement('div');
        overlay.className = 'ac-modal-overlay';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                // Optional: Shake modal to indicate "Must enter password"
                const box = document.querySelector('.ac-modal-box');
                if (box) {
                    box.classList.remove('shake-anim');
                    void box.offsetWidth;
                    box.classList.add('shake-anim');
                }
                console.log('[AccessControl] Overlay clicked - Ignored');
            }
        });

        const box = document.createElement('div');
        box.className = 'ac-modal-box';

        // Left Side
        const leftSide = document.createElement('div');
        leftSide.className = 'ac-modal-left';

        const img = document.createElement('img');
        img.src = 'assets/images/character/arn_think.png';
        img.className = 'ac-modal-img';
        img.id = 'ac-character-img'; // ID for easy swapping
        img.alt = 'Character';

        leftSide.appendChild(img);

        // Right Side
        const rightSide = document.createElement('div');
        rightSide.className = 'ac-modal-right';

        const title = document.createElement('h3');
        title.className = 'ac-modal-title';
        title.textContent = 'Secret Password?';
        title.id = 'ac-modal-title';

        // Input Wrapper
        const inputGroup = document.createElement('div');
        inputGroup.className = 'ac-input-group';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'ac-password-input';
        input.placeholder = 'Type here...';
        input.autocomplete = 'off';

        inputGroup.appendChild(input);

        // Buttons
        const btnGroup = document.createElement('div');
        btnGroup.className = 'ac-btn-group';

        const submitBtn = document.createElement('button');
        submitBtn.className = 'ac-btn ac-btn-submit';
        submitBtn.textContent = 'Unlock';
        submitBtn.type = 'button';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'ac-btn ac-btn-cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.type = 'button';

        btnGroup.appendChild(cancelBtn);
        btnGroup.appendChild(submitBtn);

        // Error Message (Hidden by default)
        const errorMsg = document.createElement('div');
        errorMsg.className = 'ac-error-msg';
        errorMsg.textContent = 'Oops! Wrong password 🙈';
        errorMsg.id = 'ac-error-msg';

        rightSide.appendChild(title);
        rightSide.appendChild(inputGroup);
        rightSide.appendChild(btnGroup);
        rightSide.appendChild(errorMsg);

        // Assembly
        box.appendChild(leftSide);
        box.appendChild(rightSide);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.add('ac-modal-visible');
        });

        // --- Logic ---

        const close = (reason) => {
            console.log('[AccessControl] Closing Modal:', reason);
            overlay.classList.remove('ac-modal-visible');
            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 300);
        };

        const submit = (e) => {
            if (e) e.preventDefault();

            const val = input.value.trim().toUpperCase();
            const correct = this.passwords[folderName];

            console.log(`[AccessControl] Checking: ${val} vs ${correct}`);

            if (val === correct) {
                // SUCCESS STATE
                console.log('[AccessControl] Valid!');

                // 1. Change Character
                img.src = 'assets/images/character/arn_happy.png';
                img.style.transform = 'none';

                // 2. Change Text
                title.textContent = 'YAY! Correct! 🎉';
                title.style.color = '#ff1493';

                // 3. Hide Input/Error/Buttons to clean up (optional, but requested "same box")
                // Let's just visualize the success clearly
                input.style.borderColor = '#32cd32'; // Green border
                input.disabled = true;
                errorMsg.style.opacity = '0';

                submitBtn.style.display = 'none';
                cancelBtn.style.display = 'none';

                setTimeout(() => {
                    console.log('[AccessControl] Redirecting...');
                    close('Success');
                    onSuccessCallback();
                }, 600);

            } else {
                // ERROR STATE
                console.log('[AccessControl] Invalid!');

                box.classList.remove('shake-anim');
                void box.offsetWidth;
                box.classList.add('shake-anim');

                errorMsg.textContent = 'Oops! Try again 🙈';
                errorMsg.style.opacity = '1';

                input.style.borderColor = 'crimson';
                input.value = '';
                input.focus();
            }
        };

        submitBtn.onclick = submit;
        cancelBtn.onclick = () => close('Cancel Button');

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submit();
            }
        });

        // Focus delay
        setTimeout(() => {
            if (document.body.contains(input)) input.focus();
        }, 100);
    },

    isDeveloperMode: function () {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('dev') === 'true';
    }
};
