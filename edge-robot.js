/**
 * ════════════════════════════════════════════════════════════════
 * 🤖 ROBOT "EDGE" — THE OFFICIAL SMART AI ASSISTANT LAUNCHER
 * ════════════════════════════════════════════════════════════════
 * Robot EDGE serves as the interactive AI Smart Assistant mascot
 * for EDGE Academy. Tapping him opens the conversational AI helper.
 */

(function () {
    if (window._edgeRobotLoaded) return;
    window._edgeRobotLoaded = true;

    // Avoid loading inside admin panel or video player
    if (window.location.pathname.includes('/admin') || window.location.pathname.includes('/watch')) return;

    // If initMasarChatbot hasn't run yet, invoke it safely
    function ensureChatbot() {
        if (!document.getElementById('masarChatbotBtn') && typeof initMasarChatbot === 'function') {
            const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
            initMasarChatbot(user);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureChatbot);
    } else {
        ensureChatbot();
    }
})();
