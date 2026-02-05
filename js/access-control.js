const AccessControl = {
    // Configuration
    startDate: new Date('2026-02-07T00:00:00'), // Adjust year dynamically ideally, but set for next specific instance
    // For this dummy setup, we will just use 2024 or current year logic if needed, 
    // but user prompt says "7 February to 14 February". Let's assume current year or explicitly 2025/26.
    // Given the prompt context "The website should feel cute... for now those pages will be dummy placeholders",
    // and "access control... developer (you) should be able to open any day anytime",
    // I'll make it check against the current system date.

    isDeveloperMode: function () {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('dev') === 'true';
    },

    isDateAllowed: function (targetDateStr) {
        if (this.isDeveloperMode()) return true;

        const now = new Date();
        // Target date format expected: "YYYY-MM-DD"
        // Since the prompt asks for specific days 7-14 Feb, we need to be careful with the Year.
        // I will assume the current year for the target date constructed.
        const currentYear = now.getFullYear();
        const targetDate = new Date(`${currentYear}-${targetDateStr}`);

        // Reset times for accurate day comparison
        now.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        return now >= targetDate;
    },

    showModal: function (message) {
        // Remove existing modal if any
        const existing = document.querySelector('.ac-modal-overlay');
        if (existing) existing.remove();

        // Create Modal DOM
        const overlay = document.createElement('div');
        overlay.className = 'ac-modal-overlay';

        const box = document.createElement('div');
        box.className = 'ac-modal-box';

        const text = document.createElement('p');
        text.innerHTML = message; // Allow HTML for emojis

        const btn = document.createElement('button');
        btn.className = 'ac-modal-btn';
        btn.textContent = 'Close';
        btn.onclick = () => overlay.remove();

        box.appendChild(text);
        box.appendChild(btn);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    },

    redirectIfLocked: function (targetDateStr) {
        if (!this.isDateAllowed(targetDateStr)) {
            // For direct access to inner pages, just kick them back to home.
            // The modal is primarily for the calendar interaction.
            window.location.href = '../index.html';
        }
    },

    // New Helper for interactions
    handleLocked: function () {
        this.showModal("Be patient, sweetheart! This day hasn't arrived yet! 💖");
    }
};
