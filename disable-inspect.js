/**
 * MASAR Platform Ultimate Protection Script
 * Disables Inspect Element, Developer Tools, Right-Click, and Keyboard Shortcuts (Windows & Mac)
 * Includes Proactive Debugger Loop, Layout Shift Blocking & Full Mobile Protection
 */
(function() {
    'use strict';

    // ─── كشف نوع الجهاز ───────────────────────────────────────────────────────
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);

    // Do not interfere with native touch scrolling, taps, zoom, form controls,
    // or accessibility gestures. Browser-side "anti-inspect" code cannot stop
    // determined copying and was preventing normal mobile use across the site.
    if (isMobileDevice) return;

    // ─── حقن CSS لمنع تحديد النصوص وسحب المحتوى على جميع الأجهزة ──────────
    (function injectProtectionCSS() {
        const style = document.createElement('style');
        style.textContent = `
            img, video {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
                pointer-events: none !important;
            }
            /* السماح بالتشغيل للفيديوهات مع منع القائمة */
            video {
                pointer-events: auto !important;
                -webkit-touch-callout: none !important;
            }
            body {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                user-select: none !important;
            }
        `;
        document.head.appendChild(style);
    })();

    // 1. تعطيل القائمة المنسدلة للزر الأيمن للماوس والضغط الطويل على الموبايل
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // ─── حماية الموبايل: منع الضغط الطويل (Long Press) لحفظ الصور والفيديو ──
    if (isMobileDevice) {
        let longPressTimer = null;

        // منع الضغط الطويل على الصور والفيديوهات
        document.addEventListener('touchstart', function(e) {
            const target = e.target;
            if (target.nodeName === 'IMG' || target.nodeName === 'VIDEO' || target.nodeName === 'A') {
                longPressTimer = setTimeout(function() {
                    e.preventDefault();
                }, 300);
            }
        }, { passive: false });

        document.addEventListener('touchend', function() {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        document.addEventListener('touchmove', function() {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        // منع تحميل الصور والفيديو عبر الضغط الطويل
        document.addEventListener('touchforcechange', function(e) {
            e.preventDefault();
        }, { passive: false });

        // منع قائمة "حفظ الصورة" على iOS Safari
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        }, { passive: false });

        // منع "Open in new tab" و "Save image" على الأندرويد/iOS
        document.querySelectorAll('img, video').forEach(function(el) {
            el.addEventListener('contextmenu', function(e) { e.preventDefault(); return false; });
            el.addEventListener('touchstart', function(e) { e.preventDefault(); }, { passive: false });
        });

        // مراقبة العناصر المضافة لاحقاً (Dynamic Content)
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        const mediaEls = node.querySelectorAll ? node.querySelectorAll('img, video') : [];
                        mediaEls.forEach(function(el) {
                            el.addEventListener('contextmenu', function(e) { e.preventDefault(); return false; });
                            el.addEventListener('touchstart', function(e) { e.preventDefault(); }, { passive: false });
                        });
                        if (node.nodeName === 'IMG' || node.nodeName === 'VIDEO') {
                            node.addEventListener('contextmenu', function(e) { e.preventDefault(); return false; });
                            node.addEventListener('touchstart', function(e) { e.preventDefault(); }, { passive: false });
                        }
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // منع Screenshot عبر مراقبة تغيير الـ visibility (Android Chrome)
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                // الصفحة في الخلفية - ممكن يكون بيعمل screenshot
                document.querySelectorAll('video').forEach(function(v) {
                    if (!v.paused) v.pause();
                });
            }
        });
    }

    // 2. حظر جميع اختصارات لوحة المفاتيح للمطورين (ويندوز وماك وسافاري)
    document.addEventListener('keydown', function(e) {
        const isCmdOrCtrl = e.ctrlKey || e.metaKey; // Ctrl لويندوز و Cmd لماك
        const isOptionOrShift = e.altKey || e.shiftKey; // Alt/Option لماك و Shift لويندوز

        if (
            // F12
            e.key === 'F12' ||
            // عرض السورس كود: Ctrl+U أو Cmd+Option+U
            (isCmdOrCtrl && (e.key === 'u' || e.key === 'U')) ||
            (isCmdOrCtrl && e.altKey && (e.key === 'u' || e.key === 'U')) ||
            // حفظ الصفحة: Ctrl+S أو Cmd+S
            (isCmdOrCtrl && (e.key === 's' || e.key === 'S')) ||
            // فتح أدوات الفحص:
            // Ctrl+Shift+I أو Cmd+Option+I
            (isCmdOrCtrl && isOptionOrShift && (e.key === 'i' || e.key === 'I')) ||
            // Ctrl+Shift+J أو Cmd+Option+J (الكونسول المباشر)
            (isCmdOrCtrl && isOptionOrShift && (e.key === 'j' || e.key === 'J')) ||
            // Ctrl+Shift+C أو Cmd+Option+C (محدد العناصر)
            (isCmdOrCtrl && isOptionOrShift && (e.key === 'c' || e.key === 'C')) ||
            // كونسول متصفح فايرفوكس: Ctrl+Shift+K
            (isCmdOrCtrl && e.shiftKey && (e.key === 'k' || e.key === 'K'))
        ) {
            e.preventDefault();
            return false;
        }
    });

    // 3. منع سحب وحفظ الصور والفيديوهات لحماية المحتوى التعليمي
    document.addEventListener('dragstart', function(e) {
        if (e.target.nodeName === 'IMG' || e.target.nodeName === 'VIDEO') {
            e.preventDefault();
        }
    });

    // 4. تصفير دوال الطباعة (Console) لعدم تسريب أي معلومات أو مصفوفات برمجية
    try {
        const emptyFunction = function() {};
        console.log = emptyFunction;
        console.warn = emptyFunction;
        console.error = emptyFunction;
        console.info = emptyFunction;
        console.dir = emptyFunction;
    } catch (_) {}

    // 5. مصيدة المطورين النشطة (Debugger Loop)
    // إذا فُتح الكونسول بأي طريقة خارجية، يتوقف كود الموقع بالكامل ويعلق تبويب الطالب فوراً
    const devToolsTrap = function() {
        function trap() {
            debugger;
        }
        setInterval(trap, 50);
    };
    try {
        devToolsTrap();
    } catch (_) {}

    // 6. كشف أبعاد الشاشة (في حال تم رسو الكونسول على الجانب أو في الأسفل) - للديسكتوب فقط
    if (!isMobileDevice) {
        setInterval(function() {
            // حساب الفارق بين حجم نافذة المتصفح الخارجية والداخلية
            const widthThreshold = window.outerWidth - window.innerWidth > 160;
            const heightThreshold = window.outerHeight - window.innerHeight > 160;

            if (widthThreshold || heightThreshold) {
                // في حال رصد كونسول مفتوح ومثبت، يتم مسح وعرض شاشة حجب أمنية فورية
                document.body.innerHTML = `
                    <div style="
                        position: fixed; inset: 0; background: #0b0c10; color: #dda852;
                        display: flex; flex-direction: column; align-items: center; justify-content: center;
                        font-family: 'Cairo', sans-serif; text-align: center; z-index: 2147483647; direction: rtl;
                    ">
                        <span style="font-size: 4rem; margin-bottom: 15px;">🔒</span>
                        <h2 style="margin: 0 0 10px; font-weight: 800;">عذراً، تم حجب محتوى الصفحة</h2>
                        <p style="color: #a2a8c3; margin: 0 0 20px; font-size: 0.95rem;">غير مسموح باستخدام أدوات المطور (Inspect Element) أو كشف الأكواد داخل المنصة.</p>
                        <button onclick="window.location.reload()" style="
                            background: #dda852; color: #000; border: none; padding: 12px 28px;
                            border-radius: 10px; font-weight: 700; cursor: pointer; font-family: inherit;
                        ">إعادة تحميل الصفحة 🔄</button>
                    </div>
                `;
            }
        }, 1000);
    }

})();
