(function () {
    'use strict';

    const API_URL = window.location.origin + (window.location.pathname.includes('/masar') ? '/masar' : '');
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    const currentUserId = currentUser.phone || 'unknown';
    const currentVideoId = new URLSearchParams(window.location.search).get('videoId') || 'unknown';
    let violationCount = 0;

    // ─── Init ───
    document.addEventListener('DOMContentLoaded', async () => {
        if (!currentUser || !currentUser._id || !currentVideoId) {
            alert('يجب تسجيل الدخول لمشاهدة الامتحان.');
            window.location.href = 'index.html';
            return;
        }

        try {
            // Validate student subscription
            const res = await fetch(`${API_URL}/api/videos/${currentVideoId}`);
            const data = await res.json();
            
            if (!res.ok || !data.success) {
                alert('خطأ في جلب بيانات الامتحان.');
                window.location.href = 'index.html';
                return;
            }

            const video = data.video;
            if (!video.examLink) {
                alert('لا يوجد امتحان مضاف لهذه المحاضرة.');
                window.location.href = 'index.html';
                return;
            }

            // Check if subscribed or admin
            const isSubscribed = (currentUser.subscribedVideos || []).includes(currentVideoId);
            const isAdmin = currentUser.role === 'admin' || currentUser.phone === '01556448880' || currentUser.phone === '01234567890';
            
            if (!isSubscribed && !isAdmin) {
                alert('عذراً، يجب الاشتراك في المحاضرة وتفعيلها بالكود أولاً لدخول الامتحان.');
                window.location.href = `watch.html?videoId=${currentVideoId}&code=ALREADY_SUBSCRIBED`;
                return;
            }

            // Load iframe
            document.getElementById('examTitle').textContent = `امتحان محاضرة: ${video.title}`;
            document.getElementById('secureExamIframe').src = video.examLink;

            // Initialize all security guards
            initSecurityShield();
            initAntiCapture();
            initAntiDevTools();
            initCanvasProtection();
            initWatermark();
            initScreenRecordingDetection();
            showShieldIndicator();

        } catch (err) {
            console.error(err);
            alert('حدث خطأ في تحميل الامتحان.');
            window.location.href = 'index.html';
        }
    });

    // ─── Security Functions ───
    // Prevent F12, Ctrl+U, right click, PrintScreen
    function initSecurityShield() {
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('keydown', e => {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') || 
                (e.ctrlKey && e.shiftKey && e.key === 'C') || 
                (e.ctrlKey && e.shiftKey && e.key === 'J') || 
                (e.ctrlKey && e.key === 'u') ||
                e.key === 'PrintScreen') {
                e.preventDefault();
                reportViolation('keyboard_shortcut_blocked');
            }
        });
    }

    // DevTools Detection
    function initAntiDevTools() {
        let lastTime = Date.now();
        setInterval(() => {
            const start = Date.now();
            debugger;
            if (Date.now() - start > 100) {
                reportViolation('devtools_opened');
            }
        }, 1000);
    }

    // Watermark Drift
    function initWatermark() {
        const wm = document.getElementById('videoWatermark');
        if (!wm) return;
        
        const label = `${currentUser.firstName || 'طالب'} - ${currentUser.phone || ''} - مَسار مفعّل 🛡️`;
        wm.innerHTML = `
            <div class="watermark-text">${label}</div>
            <div class="watermark-text">${label}</div>
            <div class="watermark-text">${label}</div>
        `;
    }

    // Anti-Capture (Blackout on blur/tab-out)
    function initAntiCapture() {
        window.addEventListener('blur', () => {
            coverExamWithBlackout(true);
            reportViolation('tab_blurred_or_minimized');
        });
        window.addEventListener('focus', () => {
            coverExamWithBlackout(false);
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                coverExamWithBlackout(true);
                reportViolation('page_hidden');
            } else {
                coverExamWithBlackout(false);
            }
        });
    }

    // Screen recording detection
    function initScreenRecordingDetection() {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            const origGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
            navigator.mediaDevices.getDisplayMedia = function (...args) {
                reportViolation('screen_capture_api_invoked');
                coverExamWithBlackout(true);
                return Promise.reject(new Error('Screen capture is strictly prohibited on MASAR.'));
            };
        }
    }

    // Anti Canvas capture
    function initCanvasProtection() {
        HTMLCanvasElement.prototype.toDataURL = function () {
            reportViolation('canvas_todataurl_blocked');
            return '';
        };
    }

    // Violation report logic
    function reportViolation(type) {
        violationCount++;
        showViolationToast(`تنبيه أمني: حركة غير مصرح بها #${violationCount}`);
        updateViolationBadge();
        
        fetch(`${API_URL}/api/security/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser._id,
                studentName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`,
                studentPhone: currentUser.phone,
                type: `EXAM_${type}`,
                videoId: currentVideoId,
                timestamp: new Date()
            })
        }).catch(() => {});
    }

    // UI Helpers
    function showViolationToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position:fixed; top:78px; left:50%;
            transform:translateX(-50%);
            background:rgba(180,30,20,0.96);
            color:#fff;
            padding:13px 26px;
            border-radius:14px;
            font-size:0.88rem; font-weight:700;
            z-index:999998;
            backdrop-filter:blur(10px);
            border:1px solid rgba(255,100,80,0.4);
            box-shadow:0 8px 30px rgba(180,30,20,0.45);
            display:flex; align-items:center; gap:10px;
            font-family:sans-serif;
        `;
        toast.innerHTML = `⚠️ ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    function updateViolationBadge() {
        let badge = document.getElementById('violationBadge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'violationBadge';
            badge.className = 'violation-badge';
            document.body.appendChild(badge);
        }
        badge.className = 'violation-badge visible';
        badge.textContent = '⚠ مخالفات: ' + violationCount;
    }

    function coverExamWithBlackout(on) {
        const container = document.getElementById('examContainer');
        if (!container) return;
        let bl = document.getElementById('examBlackoutOverlay');
        if (!bl) {
            bl = document.createElement('div');
            bl.id = 'examBlackoutOverlay';
            bl.style.cssText = `
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: #0d0f12;
                color: #fff;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 12px;
                z-index: 999999;
                font-family: inherit;
                text-align: center;
            `;
            bl.innerHTML = `<span style="font-size:3rem;">🔒</span><h3 style="margin:0;">الامتحان محجوب أمنياً</h3><p style="margin:0; opacity:0.7;">غير مسموح بالخروج عن صفحة الامتحان أو التبديل للبرامج الأخرى.</p>`;
            bl.addEventListener('click', () => coverExamWithBlackout(false));
            container.appendChild(bl);
        }
        bl.style.display = on ? 'flex' : 'none';
    }

    function showShieldIndicator() {
        const ind = document.createElement('div');
        ind.className = 'shield-indicator';
        ind.innerHTML = '<span class="shield-dot"></span> الحماية مفعّلة';
        document.body.appendChild(ind);
    }

})();
