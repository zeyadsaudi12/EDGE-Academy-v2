/**
 * ============================================
 * MASAR Video Security System v5.0 (Active Lockout)
 * نظام حماية الفيديو النشط والإغلاق التلقائي - مسار
 * ============================================
 */

(function () {
    'use strict';

    // ─── Config ───
    const API_URL       = window.location.origin + (window.location.pathname.includes('/masar') ? '/masar' : '');
    const currentUser   = JSON.parse(localStorage.getItem('currentUser')) || {};
    const currentUserId = currentUser.phone || 'unknown';
    const currentVideoId = new URLSearchParams(window.location.search).get('videoId') || 'unknown';
    const VISIBILITY_GRACE_MS = 3000;

    let violationCount = 0;
    let blurCount      = 0; 
    let videoElement   = null;
    let isPlaying      = false;
    let lastValidTime  = 0;
    let hiddenTimestamp = null;
    let visibilityGraceTimer = null;
    let pendingVisibilityViolation = false;
    let blobUrl        = null;
    let activePlayerType = 'html5';
    let ytPlayer       = null;

    let blackoutEl     = null;
    let isBlackedOut   = false;
    let isLockedOut    = false; 

    let blackCanvas    = null;
    let blackCanvasCtx = null;
    let _recordingActive = false;
    let flashTimer     = null;

    // ============================================
    // INIT
    // ============================================
    document.addEventListener('DOMContentLoaded', async () => {
        videoElement = document.getElementById('secureVideo');
        if (!videoElement) return;

        createBlackoutOverlay();
        createBlackCanvas();

        initSecurityShield();
        initCustomControls();

        // تفعيل الإجراءات الأمنية المتطورة
        initDynamicWatermark();
        initTamperProtection();
        initPerformanceMonitor();
        initVideoDisruptor();

        // ── التحقق من حالة الحظر مع السيرفر ──
        const sessionLocked = sessionStorage.getItem('masar_video_locked_' + currentVideoId) === 'true';
        if (sessionLocked) {
            try {
                const phone = currentUser.phone || '';
                const res   = await fetch(
                    `${API_URL}/api/security/check-lock?phone=${encodeURIComponent(phone)}&videoId=${encodeURIComponent(currentVideoId)}`
                );
                const data  = await res.json();
                if (data.locked === false) {
                    sessionStorage.removeItem('masar_video_locked_' + currentVideoId);
                } else {
                    triggerAdministrativeLockout('session_locked_previously');
                    return;
                }
            } catch (_) {
                triggerAdministrativeLockout('session_locked_previously');
                return;
            }
        }

        if (currentUser && currentUser._id) {
            const sendPing = () => {
                const deviceId = localStorage.getItem('masar_device_id') || '';
                fetch(`${API_URL}/api/users/ping`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUser._id, deviceId })
                })
                .then(async res => {
                    if (res.status === 403) {
                        alert('❌ تم إلغاء ربط هذا الجهاز أو تم تسجيل الدخول من جهاز آخر. سيتم تسجيل خروجك الآن.');
                        localStorage.removeItem('currentUser');
                        window.location.href = 'login.html';
                    }
                })
                .catch(() => {});
            };
            sendPing();
            setInterval(sendPing, 30000);
        }

        initScreenRecordBlock();
        initAntiCapture();
        initAntiDevTools();
        initAntiSeeking();
        initMediaKeysBlock();
        initCanvasProtection();
        showShieldIndicator();
    });

    // ============================================
    // SYSTEM LOCKOUT & ADMIN REPORTING
    // ============================================
    function triggerAdministrativeLockout(reason) {
        if (isLockedOut) return;
        isLockedOut = true;

        pauseVideo();
        showBlackout();

        sessionStorage.setItem('masar_video_locked_' + currentVideoId, 'true');
        reportToAdmin(reason, true);

        document.querySelector('.security-overlay')?.remove();
        const lockOverlay = document.createElement('div');
        lockOverlay.className = 'security-overlay';
        lockOverlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: #090f0d;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2147483647;
            backdrop-filter: blur(20px);
            font-family: 'Cairo', sans-serif;
            direction: rtl;
        `;

        lockOverlay.innerHTML = `
            <div class="warning-box" style="border: 2px solid #e74c3c; background: #130707; max-width: 500px; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
                <span style="font-size: 4rem; display: block; margin-bottom: 15px; animation: shakeIcon 0.5s infinite alternate;">🚨</span>
                <h2 style="color: #ff4d4d; font-size: 1.45rem; margin-bottom: 15px; font-weight: 800;">تم حظر المشاهدة وإيقاف المحاضرة</h2>
                <p style="color: #f7f3e8; font-size: 0.95rem; line-height: 1.7; margin-bottom: 20px;">
                    مرحباً <b>${currentUser.firstName || 'طالب مَسار'}</b>، لقد تم رصد سلوك غير مصرح به ونشاط يهدد أمن المنصة (<b>محاولة تصوير شاشة أو استخدام برنامج تسجيل خارجي</b>).
                </p>
                <div style="background: rgba(0,0,0,0.4); padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(231,76,60,0.25);">
                    <p style="margin: 0; font-size: 0.85rem; color: #ffb3b3; text-align: right;"><b>تفاصيل تقرير المخالفة:</b></p>
                    <p style="margin: 6px 0 0; font-size: 0.82rem; color: #ccc; text-align: right;">• الاسم المسجل: ${currentUser.firstName || ''} ${currentUser.lastName || ''}</p>
                    <p style="margin: 3px 0 0; font-size: 0.82rem; color: #ccc; text-align: right;">• رقم هاتف الطالب: ${currentUser.phone || '—'}</p>
                    <p style="margin: 3px 0 0; font-size: 0.82rem; color: #ccc; text-align: right;">• كود المحاولة المرصودة: ${reason}</p>
                    <p style="margin: 3px 0 0; font-size: 0.82rem; color: #ccc; text-align: right;">• التوقيت الفعلي: ${new Date().toLocaleTimeString('ar-EG')}</p>
                </div>
                <p style="color: #ff8080; font-size: 0.82rem; font-weight: 700; margin-bottom: 20px; line-height: 1.5;">
                    تم إرسال هذا البلاغ تلقائياً مصحوباً ببيانات حسابك والجهاز المستخدم إلى لوحة تحكم الإدارة لمراجعته يدوياً مع المشرفين.
                </p>
                <button onclick="window.location.href='index.html'" style="
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    color: #fff;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 50px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(231,76,60,0.3);
                    transition: all 0.2s;
                    font-family: inherit;
                ">العودة للصفحة الرئيسية</button>
            </div>
        `;
        document.body.appendChild(lockOverlay);
    }

    // ============================================
    // PROACTIVE BLACKOUT FLASH FOR KEYBOARD COMBOS
    // ============================================
    function flashBlackout(durationMs) {
        showBlackout();
        if (flashTimer) clearTimeout(flashTimer);
        flashTimer = setTimeout(() => {
            if (!isRecordingDetected() && !isLockedOut) {
                hideBlackout();
            }
        }, durationMs);
    }

    // ============================================
    // VIDEO DISRUPTOR LAYER
    // ============================================
    function initVideoDisruptor() {
        const container = document.getElementById('videoContainer');
        if (!container) return;
        
        let disruptor = container.querySelector('.video-disruptor-layer');
        if (!disruptor) {
            disruptor = document.createElement('div');
            disruptor.className = 'video-disruptor-layer';
            container.appendChild(disruptor);
        }
    }

    // ============================================
    // DYNAMIC PERSONALIZED WATERMARK
    // ============================================
    function initDynamicWatermark() {
        const watermarkContainer = document.getElementById('videoWatermark');
        if (!watermarkContainer) return;

        const name = ((currentUser.firstName || '') + ' ' + (currentUser.lastName || '') + ' ' + (currentUser.username || '')).trim() || currentUser.name || 'طالب';
        const password = currentUser.password || currentUser.pass || '';
        const watermarkText = password ? `${name} | ${password}` : name;

        watermarkContainer.innerHTML = '';

        // ── طبقة الـ watermark الثابتة بالمنتصف (حجم أصغر وأهدأ) ──
        const staticEl = document.createElement('div');
        staticEl.style.cssText = `
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            color: #ffffff;
            opacity: 0.35;
            font-size: clamp(0.72rem, 1.8vw, 0.95rem);
            font-weight: 700;
            white-space: nowrap;
            pointer-events: none;
            user-select: none;
            z-index: 99998;
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            text-align: center;
            text-shadow: none;
            letter-spacing: 0.5px;
        `;
        staticEl.textContent = watermarkText;
        watermarkContainer.appendChild(staticEl);

        // ── watermarks متحركة بحجم أصغر وحركة هادئة جداً ──
        const count = 5;
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'secure-moving-watermark';
            el.style.cssText = `
                position: absolute;
                color: #ffffff;
                opacity: 0.28;
                font-size: clamp(0.62rem, 1.3vw, 0.8rem);
                font-weight: 600;
                white-space: nowrap;
                pointer-events: none;
                user-select: none;
                z-index: 99999;
                font-family: 'Cairo', sans-serif;
                direction: rtl;
                text-shadow: none;
                letter-spacing: 0.5px;
            `;
            el.textContent = watermarkText;
            watermarkContainer.appendChild(el);
            animateWatermarkElement(el, i, count);
        }
    }

    function animateWatermarkElement(el, index, total) {
        let x = Math.random() * 75;
        let y = (index * (88 / total)) + 5 + (Math.random() * 8);

        // حركة بطيئة جداً وهادئة
        let dx = (0.012 + Math.random() * 0.014) * (Math.random() > 0.5 ? 1 : -1);
        let dy = (0.007 + Math.random() * 0.010) * (Math.random() > 0.5 ? 1 : -1);

        function step() {
            if (!el.parentNode) return;
            x += dx;
            y += dy;

            if (x < 1 || x > 84) dx = -dx;
            if (y < 2 || y > 92) dy = -dy;

            el.style.left = x + '%';
            el.style.top  = y + '%';

            requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }


    // ============================================
    // DOM TAMPER PROTECTION (MUTATION OBSERVER)
    // ============================================
    function initTamperProtection() {
        const container = document.getElementById('videoContainer');
        const watermark = document.getElementById('videoWatermark');
        if (!container) return;

        const observer = new MutationObserver((mutations) => {
            let tampered = false;

            for (let mutation of mutations) {
                if (watermark && !container.contains(watermark)) {
                    tampered = true;
                }

                if (watermark && mutation.target === watermark && mutation.type === 'childList') {
                    if (watermark.children.length < 2) {
                        tampered = true;
                    }
                }

                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const target = mutation.target;
                    
                    if (target === watermark || target.classList.contains('secure-moving-watermark')) {
                        const style = window.getComputedStyle(target);
                        if (
                            style.display === 'none' || 
                            style.visibility === 'hidden' || 
                            parseFloat(style.opacity) < 0.01
                        ) {
                            tampered = true;
                        }
                    }

                    if (target === container) {
                        const style = window.getComputedStyle(container);
                        if (style.display === 'none') {
                            tampered = true;
                        }
                    }
                }
            }

            if (tampered) {
                triggerAdministrativeLockout('dom_tampering_attempt');
            }
        });

        observer.observe(container, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['style', 'class']
        });
    }

    // ============================================
    // PERFORMANCE MONITOR
    // ============================================
    function initPerformanceMonitor() {}

    // ============================================
    // BLACK CANVAS
    // ============================================
    function createBlackCanvas() {
        blackCanvas    = document.createElement('canvas');
        blackCanvas.width  = screen.width  || 1920;
        blackCanvas.height = screen.height || 1080;
        blackCanvasCtx = blackCanvas.getContext('2d');
        paintBlackCanvas();
        setInterval(paintBlackCanvas, 1000);
    }

    function paintBlackCanvas() {
        if (!blackCanvasCtx) return;
        const w = blackCanvas.width;
        const h = blackCanvas.height;
        blackCanvasCtx.fillStyle = '#000';
        blackCanvasCtx.fillRect(0, 0, w, h);
        blackCanvasCtx.font      = 'bold 32px Arial';
        blackCanvasCtx.fillStyle = '#333';
        blackCanvasCtx.textBaseline = 'middle';
        blackCanvasCtx.textAlign = 'center';
        blackCanvasCtx.fillText('🚫 المحتوى محمي', w / 2, h / 2);
    }

    // ============================================
    // BLACKOUT OVERLAY
    // ============================================
    function createBlackoutOverlay() {
        const container = document.getElementById('videoContainer');
        if (!container) return;

        blackoutEl = document.createElement('div');
        blackoutEl.id = 'masarBlackout';
        blackoutEl.style.cssText = `
            position: absolute;
            inset: 0;
            background: #000;
            z-index: 999999;
            display: none;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 16px;
            color: #dda852;
            font-family: 'Cairo', sans-serif;
            border-radius: inherit;
            cursor: pointer;
        `;
        blackoutEl.innerHTML = `
            <span style="font-size:3rem;">🔒</span>
            <span style="font-size:1.1rem; color:#f7f3e8; font-weight:700;">المحتوى محمي ومؤمّن ضد التسجيل والالتقاط</span>
            <span style="font-size:0.82rem; color:rgba(247, 243, 232, 0.65);">يرجى تعطيل برامج التسجيل والتقاط الشاشة لتتمكن من المتابعة</span>
        `;
        blackoutEl.addEventListener('click', () => {
            if (!isRecordingDetected() && !isLockedOut) {
                hideBlackout();
            }
        });
        container.appendChild(blackoutEl);
    }

    function showBlackout() {
        if (isBlackedOut) return;
        isBlackedOut = true;
        pauseVideo();
        if (blackoutEl) {
            blackoutEl.style.display = 'flex';
        }
        document.body.classList.add('recording-detected');
        const container = document.getElementById('videoContainer');
        if (container) container.classList.add('recording-detected');

        showFullPageBlackout(true);
    }

    function hideBlackout() {
        if (!isBlackedOut) return;
        isBlackedOut = false;
        if (blackoutEl) {
            blackoutEl.style.display = 'none';
        }
        document.body.classList.remove('recording-detected');
        const container = document.getElementById('videoContainer');
        if (container) container.classList.remove('recording-detected');

        showFullPageBlackout(false);
    }

    function showFullPageBlackout(on) {
        let overlay = document.getElementById('masarFullBlackout');
        if (on) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'masarFullBlackout';
                overlay.style.cssText = `
                    position: fixed;
                    inset: 0;
                    background: #000;
                    z-index: 2147483647;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 14px;
                    cursor: pointer;
                `;
                overlay.innerHTML = `
                    <span style="font-size:3rem;">🔒</span>
                    <span style="font-size:1.1rem; color:#dda852; font-weight:700; font-family:'Cairo';">المحتوى محمي ضد محاولات البث والتسجيل</span>
                `;
                overlay.addEventListener('click', () => {
                    if (!isRecordingDetected() && !isLockedOut) {
                        hideBlackout();
                        overlay.remove();
                    }
                });
                document.body.appendChild(overlay);
            }
        } else {
            overlay?.remove();
        }
    }

    function isRecordingDetected() {
        return _recordingActive;
    }

    function triggerBlackout(reason) {
        _recordingActive = true;
        reportToAdmin('screen_record_' + reason);
        showBlackout();
        if (reason !== 'getDisplayMedia') {
            setTimeout(() => {
                _recordingActive = false;
            }, 5000);
        }
    }

    // ============================================
    // 1. SCREEN RECORDING BLOCK
    // ============================================
    function initScreenRecordBlock() {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            const _orig = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);

            navigator.mediaDevices.getDisplayMedia = async function (...args) {
                triggerAdministrativeLockout('browser_screen_share_activated');

                try {
                    if (blackCanvas && blackCanvas.captureStream) {
                        const blackStream = blackCanvas.captureStream(1);
                        setTimeout(() => {
                            blackStream.getTracks().forEach(t => t.stop());
                            _recordingActive = false;
                        }, 30000);
                        return blackStream;
                    }
                } catch (_) {}

                try {
                    return await _orig(...args);
                } catch (e) {
                    throw e;
                }
            };
        }

        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.addEventListener('devicechange', async () => {
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const hasCapture = devices.some(d =>
                        d.kind === 'videoinput' &&
                        (d.label.toLowerCase().includes('screen') ||
                         d.label.toLowerCase().includes('capture') ||
                         d.label.toLowerCase().includes('display'))
                    );
                    if (hasCapture) triggerAdministrativeLockout('physical_capture_device_plugged');
                } catch (_) {}
            });
        }

        if (window.screen && 'isExtended' in window.screen) {
            window.screen.addEventListener('change', () => {
                if (window.screen.isExtended) {
                    triggerAdministrativeLockout('extended_display_detected');
                }
            });
        }

        if (videoElement) {
            videoElement.addEventListener('enterpictureinpicture', () => {
                triggerAdministrativeLockout('picture_in_picture_forced');
                document.exitPictureInPicture && document.exitPictureInPicture();
            });

            // Enforce inline playback & block native iOS player fullscreen (which strips HTML overlays)
            videoElement.setAttribute('playsinline', 'true');
            videoElement.setAttribute('webkit-playsinline', 'true');
            videoElement.setAttribute('x5-playsinline', 'true');

            // Handle iOS webkitBeginFullScreen
            videoElement.addEventListener('webkitbeginfullscreen', (e) => {
                e.preventDefault();
                videoElement.webkitExitFullscreen();
                showSoftToast('🔒 وضع ملء الشاشة الافتراضي غير مدعوم لحماية المحاضرة');
            });
        }

        setInterval(() => {
            if (document.fullscreenElement && document.hidden) {
                triggerAdministrativeLockout('fullscreen_background_switch');
            }
        }, 1500);
    }

    // ============================================
    // 2. Anti Capture (Focus / Visibility) - Mobile Enhanced
    // ============================================
    function initAntiCapture() {
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                             || ('ontouchstart' in window);

        let _internalClick = false;
        let _mobileBlackoutUntil = 0; // حماية: لا تفتح الشاشة قبل انتهاء هذا الوقت

        // ── تتبع الكليك الداخلي (Desktop: mouse | Mobile: touch) ──
        document.addEventListener('mousedown',  () => { _internalClick = true; });
        document.addEventListener('mouseup',    () => { setTimeout(() => { _internalClick = false; }, 300); });
        document.addEventListener('touchstart', () => { _internalClick = true;  }, { passive: true });
        document.addEventListener('touchend',   () => { setTimeout(() => { _internalClick = false; }, 500); }, { passive: true });

        // ── Blur: فقدان التركيز (Desktop + Mobile) ──
        window.addEventListener('blur', () => {
            if (_internalClick) return;
            if (!isLockedOut) {
                pauseVideo();
                showBlackout();
                if (isMobileDevice) {
                    // على الموبايل: اقفل لمدة 5 ثوانٍ على الأقل
                    _mobileBlackoutUntil = Date.now() + 5000;
                }
            }
        });

        window.addEventListener('focus', () => {
            if (isLockedOut) return;
            if (isMobileDevice) {
                // على الموبايل: لا تفتح تلقائياً — انتظر انتهاء الكولداون
                if (Date.now() < _mobileBlackoutUntil) return;
            }
            hideBlackout();
        });

        // ── Visibility Change: الصفحة تروح للخلفية ──
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // الصفحة اختفت → قفل فوري
                pauseVideo();
                showBlackout();
                if (isMobileDevice) {
                    _mobileBlackoutUntil = Date.now() + 5000;
                }
            } else {
                // الصفحة رجعت
                if (isLockedOut) return;
                if (isMobileDevice) {
                    // على الموبايل: لو رجعت خلال 5 ثوانٍ → سجل مخالفة تسجيل شاشة
                    if (Date.now() < _mobileBlackoutUntil) {
                        reportToAdmin('mobile_background_switch_during_playback', false);
                        // ابقَ مقفولاً — المستخدم لازم يضغط زرار لفتح الشاشة
                        if (blackoutEl) {
                            // أضف رسالة للـ blackout تطلب نقرة للمتابعة
                            const existingMsg = blackoutEl.querySelector('.mobile-unlock-msg');
                            if (!existingMsg) {
                                const msg = document.createElement('button');
                                msg.className = 'mobile-unlock-msg';
                                msg.textContent = 'اضغط هنا للمتابعة ▶';
                                msg.style.cssText = `
                                    margin-top: 16px;
                                    background: #dda852;
                                    color: #000;
                                    border: none;
                                    padding: 12px 28px;
                                    border-radius: 50px;
                                    font-size: 1rem;
                                    font-weight: 700;
                                    cursor: pointer;
                                    font-family: 'Cairo', sans-serif;
                                `;
                                msg.addEventListener('click', () => {
                                    _mobileBlackoutUntil = 0;
                                    hideBlackout();
                                    msg.remove();
                                });
                                blackoutEl.appendChild(msg);
                            }
                        }
                        return;
                    }
                }
                hideBlackout();
            }
        });

        // ── Mobile: تغيير الاتجاه أثناء التشغيل قد يكون محاولة تسجيل ──
        if (isMobileDevice) {
            window.addEventListener('orientationchange', () => {
                if (isPlaying) {
                    pauseVideo();
                    showBlackout();
                    _mobileBlackoutUntil = Date.now() + 3000;
                    setTimeout(() => {
                        if (!isLockedOut && Date.now() >= _mobileBlackoutUntil) {
                            hideBlackout();
                        }
                    }, 3100);
                }
            });

            // ── Mobile Screen Capture API (Android Chrome 94+) ──
            if (navigator.mediaDevices) {
                // اكتشاف أي محاولة capture عبر MediaDevices
                const origGetUserMedia = navigator.mediaDevices.getUserMedia?.bind(navigator.mediaDevices);
                if (origGetUserMedia) {
                    navigator.mediaDevices.getUserMedia = async function(...args) {
                        const constraints = args[0] || {};
                        if (constraints.video &&
                            typeof constraints.video === 'object' &&
                            (constraints.video.mediaSource === 'screen' ||
                             constraints.video.mediaSource === 'window' ||
                             constraints.video.displaySurface)) {
                            triggerAdministrativeLockout('mobile_getUserMedia_screen_capture');
                            throw new Error('Not allowed');
                        }
                        return origGetUserMedia(...args);
                    };
                }
            }

            // ── iOS Safari: منع AirPlay & Screen Mirroring ──
            if (videoElement) {
                videoElement.addEventListener('webkitplaybacktargetavailabilitychanged', (e) => {
                    if (e.availability === 'available') {
                        triggerAdministrativeLockout('airplay_screen_mirror_detected');
                    }
                });
            }
        }


        document.addEventListener('copy',        e => e.preventDefault());
        document.addEventListener('paste',       e => e.preventDefault());
        document.addEventListener('cut',         e => e.preventDefault());
        document.addEventListener('contextmenu', e => { e.preventDefault(); showSoftToast('🔒 غير مسموح'); });

        function clearClipboardBuffer() {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText('');
                }
            } catch (_) {}
        }

        window.addEventListener('keyup', e => {
            if (e.key === 'PrintScreen') {
                clearClipboardBuffer();
                triggerAdministrativeLockout('printscreen_keyup_detected');
            }
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                clearClipboardBuffer();
                triggerAdministrativeLockout('printscreen_detected');
                return;
            }
            if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                triggerAdministrativeLockout('snipping_tool_detected');
                return;
            }
            if (e.metaKey && e.altKey && e.key.toLowerCase() === 'r') {
                e.preventDefault();
                triggerAdministrativeLockout('game_bar_record_detected');
                return;
            }
            if (e.metaKey && e.key.toLowerCase() === 'g') {
                e.preventDefault();
                flashBlackout(2000);
                return;
            }
            if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                return;
            }
            if (e.key === 'F12') {
                e.preventDefault();
                pauseVideo();
                showSoftToast('⚠️ أدوات المطور غير مسموحة');
                reportToAdmin('devtools_f12', false);
                return;
            }
            if (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase())) {
                e.preventDefault();
                pauseVideo();
                showSoftToast('⚠️ غير مسموح');
                reportToAdmin('devtools_shortcut', false);
                return;
            }
            if (e.ctrlKey && e.key.toLowerCase() === 'u') { e.preventDefault(); return; }
            if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); return; }
        });
    }

    // ============================================
    // 3. Anti Seeking
    // ============================================
    function initAntiSeeking() {
        if (!videoElement) return;
        videoElement.addEventListener('loadedmetadata', () => { videoElement.controls = false; });
        videoElement.addEventListener('timeupdate', () => {
            lastValidTime = videoElement.currentTime;
            updateProgressBar();
            updateTimeDisplay();
        });
        videoElement.addEventListener('play',  () => { isPlaying = true;  updatePlayButton(); document.getElementById('videoContainer')?.classList.remove('paused'); });
        videoElement.addEventListener('pause', () => { isPlaying = false; updatePlayButton(); document.getElementById('videoContainer')?.classList.add('paused'); });
        videoElement.addEventListener('ended', () => { isPlaying = false; updatePlayButton(); });
    }

    // ============================================
    // 4. Media Keys Block
    // ============================================
    function initMediaKeysBlock() {
        try {
            navigator.mediaSession.setActionHandler('seekforward',  () => {});
            navigator.mediaSession.setActionHandler('seekbackward', () => {});
            navigator.mediaSession.setActionHandler('nexttrack',    () => {});
            navigator.mediaSession.setActionHandler('previoustrack',() => {});
        } catch (_) {}
    }

    // ============================================
    // 5. Canvas / Blob Protection
    // ============================================
    function initCanvasProtection() {
        const origToBlob = HTMLCanvasElement.prototype.toBlob;
        let lastBlobTime = 0;
        HTMLCanvasElement.prototype.toBlob = function (...a) {
            const now = Date.now();
            if (now - lastBlobTime < 1000) { triggerAdministrativeLockout('canvas_to_blob_capture'); return; }
            lastBlobTime = now;
            return origToBlob.apply(this, a);
        };
        HTMLCanvasElement.prototype.toDataURL = function () {
            triggerAdministrativeLockout('canvas_to_dataurl_capture');
            return '';
        };
    }

    // ============================================
    // 6. Anti DevTools
    // ============================================
    function initAntiDevTools() {
        const check = () => {
            // Detect if the device is mobile/tablet to bypass false-positive screen dimension checks
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);
            if (isMobile) return;

            const w = window.outerWidth  - window.innerWidth  > 160;
            const h = window.outerHeight - window.innerHeight > 160;
            if (w || h) { 
                pauseVideo(); 
                triggerAdministrativeLockout('devtools_inspector_opened'); 
            }
        };
        setInterval(check, 2500);

        const trap = new Image();
        Object.defineProperty(trap, 'id', { get: () => { triggerAdministrativeLockout('devtools_console_tampering'); } });
        setInterval(() => { console.log('%c', trap); console.clear(); }, 3500);
    }

    // ============================================
    // 7. Security Shield Init
    // ============================================
    function initSecurityShield() {
        document.body.classList.add('secure-video-page');
        document.querySelectorAll('img, video').forEach(el => {
            el.setAttribute('draggable', 'false');
            el.addEventListener('dragstart', e => e.preventDefault());
        });
    }

    // ============================================
    // 0. Video Loading
    // ============================================
    function getYoutubeId(url) {
        const m = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
        return (m && m[2].length === 11) ? m[2] : null;
    }

    function getGoogleDriveEmbedUrl(url) {
        return url.replace(/\/view\b/, '/preview').replace(/\/edit\b/, '/preview');
    }

    function setupIframePlayer(url) {
        activePlayerType = 'iframe';
        if (videoElement) videoElement.style.display = 'none';
        document.querySelector('.custom-video-controls')?.style.setProperty('display', 'none');
        const container = document.getElementById('videoContainer');
        if (!container) return;
        let iframe = document.getElementById('secureVideoIframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'secureVideoIframe';
            iframe.style.cssText = `
                width:100%; height:calc(100% + 120px);
                border:none; position:absolute; top:-60px; left:0; z-index:1;
            `;
            container.appendChild(iframe);
        }
        iframe.src = url;
        document.getElementById('loadingOverlay')?.style.setProperty('display','none');
        document.getElementById('videoWatermark')?.style.setProperty('z-index','5');
    }

    function setupYoutubePlayer(videoId) {
        activePlayerType = 'youtube';
        if (videoElement) videoElement.style.display = 'none';
        const container = document.getElementById('videoContainer');
        if (!container) return;

        // ── إذا الـ Player موجود بالفعل، استخدمه مباشرة ──
        if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
            try {
                ytPlayer.loadVideoById({ videoId, suggestedQuality: 'hd1080' });
                const ph = document.getElementById('ytPlayerPlaceholder');
                if (ph) ph.style.display = 'block';
                const blocker = document.getElementById('videoBlockerOverlay');
                if (blocker) blocker.style.display = 'block';
                document.getElementById('loadingOverlay')?.style.setProperty('display','none');
                return;
            } catch (_) {
                // لو فشل، نكمل ونعمل player جديد
                ytPlayer = null;
            }
        }
        
        let ph = document.getElementById('ytPlayerPlaceholder');
        if (!ph) {
            ph = document.createElement('div');
            ph.id = 'ytPlayerPlaceholder';
            ph.style.cssText = `
                width: 100%;
                height: 118%;
                position: absolute;
                top: -9%;
                left: 0;
                z-index: 1;
                pointer-events: none;
            `;
            container.appendChild(ph);
        }
        ph.style.display = 'block';

        let blocker = document.getElementById('videoBlockerOverlay');
        if (!blocker) {
            blocker = document.createElement('div');
            blocker.id = 'videoBlockerOverlay';
            blocker.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;z-index:9;background:rgba(0,0,0,0);cursor:pointer;`;
            container.appendChild(blocker);
            blocker.addEventListener('click', e => { e.stopPropagation(); togglePlay(); });
            blocker.addEventListener('dblclick', e => {
                e.stopPropagation();
                document.fullscreenElement ? document.exitFullscreen() : container.requestFullscreen().catch(()=>{});
            });
        }
        blocker.style.display = 'block';

        const initPlayer = () => {
            ytPlayer = new YT.Player('ytPlayerPlaceholder', {
                height:'100%', width:'100%', videoId,
                playerVars: { 
                    autoplay: 1, 
                    controls: 0, 
                    disablekb: 1, 
                    fs: 0, 
                    modestbranding: 1, 
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    autohide: 1,
                    vq: 'hd1080'
                },
                events: {
                    onReady: e => { 
                        e.target.loadVideoById({
                            videoId: videoId,
                            suggestedQuality: 'hd1080'
                        });
                        const loader = document.getElementById('loadingOverlay');
                        if (loader) loader.style.display = 'none';
                    },
                    onStateChange: e => {
                        isPlaying = (e.data === 1);
                        updatePlayButton();
                        document.getElementById('videoContainer')?.classList.toggle('paused', e.data !== 1);
                    }
                }
            });
        };
        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            if (!window.YT) {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                document.head.appendChild(tag);
            }
            window.onYouTubeIframeAPIReady = initPlayer;
        }
        setInterval(() => {
            if (activePlayerType === 'youtube' && ytPlayer?.getCurrentTime) {
                const t = ytPlayer.getCurrentTime(), d = ytPlayer.getDuration() || 0;
                document.getElementById('progressFill')?.style.setProperty('width', d ? (t/d*100)+'%' : '0');
                const disp = document.getElementById('timeDisplay');
                if (disp) disp.textContent = fmt(t) + ' / ' + fmt(d);
            }
        }, 500);
    }

    // =========================================================
    // تم تعديل وتحسين هذه الدالة لدعم البث المباشر الفوري (Streaming)
    // ومنع تحميل الملف بالكامل في الذاكرة لتجنب التعليق
    // =========================================================
    let _secureLoaderReady = false;
    async function loadVideoSecurely(videoUrl) {
        if (!videoElement) videoElement = document.getElementById('secureVideo');
        if (!videoUrl) return;

        const ytId = getYoutubeId(videoUrl);
        if (ytId) { setupYoutubePlayer(ytId); return; }
        if (videoUrl.includes('drive.google.com')) { setupIframePlayer(getGoogleDriveEmbedUrl(videoUrl)); return; }
        if (!videoElement) return;

        // إعادة ظهور عنصر الفيديو لو كان مخفياً من iframe/yt سابق
        videoElement.style.display = '';

        // إضافة listeners مرة واحدة فقط
        if (!_secureLoaderReady) {
            _secureLoaderReady = true;

            const hideLoader = () => {
                const loader = document.getElementById('loadingOverlay');
                if (loader) loader.style.setProperty('display', 'none');
            };
            videoElement.addEventListener('loadedmetadata', hideLoader);
            videoElement.addEventListener('loadeddata', hideLoader);
            videoElement.addEventListener('canplay', hideLoader);
            videoElement.addEventListener('play', hideLoader);

            videoElement.addEventListener('error', (e) => {
                console.error("Video Loading Error: ", e);
                const loader = document.getElementById('loadingOverlay');
                if (loader) {
                    loader.innerHTML = `
                        <div style="text-align:center; padding:20px; color:#e74c3c; font-family:'Cairo';">
                            <i class="fas fa-exclamation-triangle" style="font-size:2rem; margin-bottom:10px;"></i>
                            <p style="font-weight:bold; margin:0;">تعذر تشغيل الفيديو</p>
                            <p style="font-size:0.8rem; opacity:0.8; margin:5px 0 0;">يرجى التحقق من اتصال الإنترنت أو صلاحية الملف</p>
                        </div>
                    `;
                }
            });
        }

        // تشغيل مباشر وتدريجي (Progressive Streaming / Range-Based) لمنع التعليق
        videoElement.src = videoUrl;
        videoElement.load();
    }

    window.MasarSecurity = {
        loadVideoSecurely,
        pauseVideo,
        showWarning,
        showSoftToast,
        reportToAdmin,
        coverVideoWithBlackout: (on) => on ? showBlackout() : hideBlackout()
    };

    // ============================================
    // Custom Controls
    // ============================================
    function initCustomControls() {
        if (!videoElement) return;
        const container = document.getElementById('videoContainer');
        if (!container) return;

        document.getElementById('playBtn')?.addEventListener('click', togglePlay);
        container.addEventListener('click', e => {
            if (e.target.closest('.custom-video-controls,.quality-menu,iframe,#ytPlayerPlaceholder')) return;
            togglePlay();
        });

        const pw = document.querySelector('.video-progress-wrapper');
        if (pw) {
            pw.style.pointerEvents = 'auto';
            pw.style.cursor = 'pointer';
            pw.addEventListener('click', e => {
                const rect = pw.getBoundingClientRect();
                const pct  = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
                if (activePlayerType === 'html5' && videoElement?.duration) {
                    videoElement.currentTime = pct * videoElement.duration;
                    lastValidTime = videoElement.currentTime;
                    updateProgressBar(); updateTimeDisplay();
                } else if (activePlayerType === 'youtube' && ytPlayer?.getDuration) {
                    const d = ytPlayer.getDuration();
                    ytPlayer.seekTo(pct * d, true);
                    document.getElementById('progressFill')?.style.setProperty('width', (pct*100)+'%');
                    const disp = document.getElementById('timeDisplay');
                    if (disp) disp.textContent = fmt(pct*d) + ' / ' + fmt(d);
                }
            });
        }

        document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
            if (document.fullscreenElement || document.webkitFullscreenElement || container.classList.contains('fake-fullscreen')) {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
                container.classList.remove('fake-fullscreen');
            } else {
                if (container.requestFullscreen) {
                    container.requestFullscreen().catch(() => {
                        container.classList.add('fake-fullscreen');
                    });
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                } else {
                    container.classList.add('fake-fullscreen');
                }
            }
        });

        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                container.classList.remove('fake-fullscreen');
            }
        });
        document.addEventListener('webkitfullscreenchange', () => {
            if (!document.webkitFullscreenElement) {
                container.classList.remove('fake-fullscreen');
            }
        });

        const volSlider = document.getElementById('volumeSlider');
        const volBtn    = document.getElementById('volumeBtn');
        volSlider?.addEventListener('input', e => {
            if (activePlayerType === 'html5') videoElement.volume = e.target.value;
            else if (activePlayerType === 'youtube' && ytPlayer?.setVolume) ytPlayer.setVolume(e.target.value * 100);
            updateVolumeIcon();
        });
        volBtn?.addEventListener('click', () => {
            if (activePlayerType === 'html5') {
                videoElement.muted = !videoElement.muted;
                if (volSlider) volSlider.value = videoElement.muted ? 0 : videoElement.volume;
            } else if (activePlayerType === 'youtube' && ytPlayer?.isMuted) {
                ytPlayer.isMuted() ? ytPlayer.unMute() : ytPlayer.mute();
                if (volSlider) volSlider.value = ytPlayer.isMuted() ? 0 : 1;
            }
            updateVolumeIcon();
        });

        const speedBtn  = document.getElementById('speedBtn');
        const speedMenu = document.getElementById('speedMenu');
        const qualMenu  = document.getElementById('qualityMenu');
        speedBtn?.addEventListener('click', e => { e.stopPropagation(); speedMenu?.classList.toggle('active'); qualMenu?.classList.remove('active'); });
        document.getElementById('qualityBtn')?.addEventListener('click', e => { e.stopPropagation(); qualMenu?.classList.toggle('active'); });
        document.addEventListener('click', () => { speedMenu?.classList.remove('active'); qualMenu?.classList.remove('active'); });
        speedMenu?.querySelectorAll('.quality-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const spd = parseFloat(opt.dataset.speed);
                if (activePlayerType === 'html5' && videoElement) videoElement.playbackRate = spd;
                else if (activePlayerType === 'youtube' && ytPlayer?.setPlaybackRate) ytPlayer.setPlaybackRate(spd);
                if (speedBtn) speedBtn.textContent = spd === 1 ? '1x' : spd + 'x';
                speedMenu.querySelectorAll('.quality-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
            });
        });

        document.addEventListener('keydown', e => {
    const tag = e.target.tagName;
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || e.target.isContentEditable;
    if (e.code === 'Space' && !isTyping) {
        e.preventDefault(); togglePlay();
    }
});
    }

    function togglePlay() {
        if (activePlayerType === 'html5') {
            if (!videoElement) return;
            videoElement.paused ? videoElement.play().catch(()=>{}) : videoElement.pause();
        } else if (activePlayerType === 'youtube' && ytPlayer?.getPlayerState) {
            ytPlayer.getPlayerState() === 1 ? ytPlayer.pauseVideo() : ytPlayer.playVideo();
        }
    }

    function pauseVideo() {
        if (activePlayerType === 'html5') { videoElement && !videoElement.paused && videoElement.pause(); }
        else if (activePlayerType === 'youtube' && ytPlayer?.pauseVideo) ytPlayer.pauseVideo();
    }

    function updatePlayButton()  { const b = document.getElementById('playBtn'); if (b) b.textContent = isPlaying ? '⏸' : '▶'; }
    function updateProgressBar() {
        const fill = document.getElementById('progressFill');
        if (!fill) return;
        if (activePlayerType === 'html5' && videoElement?.duration)
            fill.style.width = (videoElement.currentTime / videoElement.duration * 100) + '%';
    }
    function updateTimeDisplay() {
        const d = document.getElementById('timeDisplay');
        if (d && activePlayerType === 'html5' && videoElement)
            d.textContent = fmt(videoElement.currentTime) + ' / ' + fmt(videoElement.duration || 0);
    }
    function updateVolumeIcon() {
        const b = document.getElementById('volumeBtn');
        if (!b) return;
        let muted = false, vol = 1;
        if (activePlayerType === 'html5' && videoElement) { muted = videoElement.muted; vol = videoElement.volume; }
        else if (activePlayerType === 'youtube' && ytPlayer?.isMuted) { muted = ytPlayer.isMuted(); vol = ytPlayer.getVolume() / 100; }
        b.textContent = (muted || vol === 0) ? '🔇' : vol < 0.5 ? '🔉' : '🔊';
    }
    function fmt(s) {
        if (!s || isNaN(s)) return '00:00';
        const m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
    }

    // ============================================
    // Reporting
    // ============================================
    function reportToAdmin(reason, isCritical = false) {
        violationCount++;
        updateViolationBadge();

        const report = {
            action: 'security_violation',
            reason: reason,
            timestamp: new Date().toISOString(),
            userId: currentUser._id || 'unknown',
            studentPhone: currentUser.phone || 'unknown',
            studentName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'طالب مجهول',
            videoId: currentVideoId,
            videoTitle: document.getElementById('videoTitle')?.textContent || 'محاضرة مَسار',
            violationCount: violationCount,
            userAgent: navigator.userAgent,
            screenSize: `${screen.width}x${screen.height}`,
            url: window.location.href,
            isCritical: isCritical
        };

        fetch(API_URL + '/api/security/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report)
        }).catch(() => {
            try { localStorage.setItem('pending_report_' + Date.now(), JSON.stringify(report)); } catch (_) {}
        });

        if (violationCount >= 5 && !isLockedOut) {
            triggerAdministrativeLockout('excessive_violations_threshold');
        }
    }

    function showWarning(message) {
        document.querySelector('.security-overlay')?.remove();
        const overlay = document.createElement('div');
        overlay.className = 'security-overlay';
        overlay.innerHTML = `
            <div class="warning-box">
                <span class="warning-icon">🛡️</span>
                <h2>⚠️ تحذير أمني هام</h2>
                <p>${message}</p>
                <p class="report-note">تم قيد المحاولة والتقرير متاح لدى الإدارة لمراجعته مع حساب الطالب.</p>
                <button class="warning-dismiss-btn" id="dismissWarning">موافق</button>
            </div>`;
        document.body.appendChild(overlay);
        document.getElementById('dismissWarning').addEventListener('click', () => overlay.remove());
    }

    function showSoftToast(message) {
        document.getElementById('masarSoftToast')?.remove();
        const t = document.createElement('div');
        t.id = 'masarSoftToast';
        t.style.cssText = `
            position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
            background:rgba(19,32,28,0.93);color:#f7f3e8;padding:11px 22px;
            border-radius:28px;font-size:0.87rem;font-weight:700;z-index:999998;
            backdrop-filter:blur(10px);border:1px solid rgba(221,168,82,0.3);
            box-shadow:0 8px 30px rgba(0,0,0,0.35);white-space:nowrap;
            font-family:'Segoe UI',Tahoma,sans-serif;
        `;
        t.textContent = message;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity='0'; setTimeout(() => t.remove(), 300); }, 3000);
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
        badge.textContent = '⚠ تنبيهات أمنية: ' + violationCount;
    }

    function showShieldIndicator() {
        const container = document.getElementById('videoContainer');
        const target = container || document.body;
        
        if (document.querySelector('.shield-indicator')) return;

        const ind = document.createElement('div');
        ind.className = 'shield-indicator';
        ind.innerHTML = '<span class="shield-dot"></span> الحماية مفعّلة';
        target.appendChild(ind);
    }

})();