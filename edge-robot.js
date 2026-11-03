/**
 * ═══════════════════════════════════════════════════════════
 * 🤖 SECRET ROBOT "EDGE" - SCAVENGER HUNT EASTER EGG
 * ═══════════════════════════════════════════════════════════
 * An animated cyber mascot that spawns in surprising platform
 * locations. Students who discover and tap him earn +15 points!
 */

(function () {
    if (window._edgeRobotLoaded) return;
    window._edgeRobotLoaded = true;

    // Avoid loading inside iframe or admin panel
    if (window.location.pathname.includes('/admin')) return;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEdgeRobot);
    } else {
        initEdgeRobot();
    }

    function initEdgeRobot() {
        // Only spawn if not already on the page
        if (document.getElementById('edge-robot-mascot')) return;

        // Inject Styles
        injectStyles();

        // Build Robot Widget
        createRobotElement();
    }

    function injectStyles() {
        const css = `
        /* ─── 🤖 EDGE Robot Scavenger Easter Egg ─── */
        #edge-robot-mascot {
            position: fixed;
            z-index: 99999;
            cursor: pointer;
            user-select: none;
            touch-action: manipulation;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease;
            filter: drop-shadow(0 10px 24px rgba(26, 107, 219, 0.45));
            animation: edgeFloat 3.2s ease-in-out infinite;
        }

        #edge-robot-mascot.edge-pos-bottom-left {
            bottom: 24px;
            left: 24px;
        }

        #edge-robot-mascot.edge-pos-bottom-right {
            bottom: 24px;
            right: 24px;
        }

        #edge-robot-mascot.edge-pos-mid-left {
            top: 60%;
            left: 18px;
        }

        @keyframes edgeFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
        }

        /* Robot Body Wrap */
        .edge-robot-inner {
            position: relative;
            width: 82px;
            height: 98px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        /* Antenna with Pulsing Glow */
        .edge-robot-antenna {
            width: 5px;
            height: 14px;
            background: linear-gradient(180deg, #94a3b8, #475569);
            border-radius: 3px;
            position: relative;
        }
        .edge-robot-antenna::before {
            content: '';
            position: absolute;
            top: -9px;
            left: 50%;
            transform: translateX(-50%);
            width: 13px;
            height: 13px;
            background: #f59e0b;
            border-radius: 50%;
            box-shadow: 0 0 12px #f59e0b, 0 0 20px #fbbf24;
            animation: edgeAntennaPulse 1.2s ease-in-out infinite alternate;
        }

        @keyframes edgeAntennaPulse {
            from { transform: translateX(-50%) scale(0.9); opacity: 0.8; box-shadow: 0 0 8px #f59e0b; }
            to { transform: translateX(-50%) scale(1.2); opacity: 1; box-shadow: 0 0 18px #f59e0b, 0 0 28px #fbbf24; }
        }

        /* Robot Head */
        .edge-robot-head {
            width: 72px;
            height: 48px;
            background: linear-gradient(145deg, #1e293b, #0f172a);
            border: 2px solid #38bdf8;
            border-radius: 18px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: inset 0 2px 4px rgba(255,255,255,0.2), 0 4px 10px rgba(0,0,0,0.4);
            margin-top: 1px;
        }

        /* Robot Visor & Eyes */
        .edge-robot-screen {
            width: 56px;
            height: 28px;
            background: #020617;
            border-radius: 10px;
            border: 1px solid rgba(56, 189, 248, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            overflow: hidden;
            position: relative;
        }

        .edge-robot-eye {
            width: 10px;
            height: 12px;
            background: #00f2fe;
            border-radius: 4px;
            box-shadow: 0 0 8px #00f2fe, 0 0 14px #38bdf8;
            animation: edgeBlink 4s infinite;
        }

        @keyframes edgeBlink {
            0%, 94%, 98%, 100% { transform: scaleY(1); }
            96% { transform: scaleY(0.1); }
        }

        /* Robot Torso */
        .edge-robot-torso {
            width: 56px;
            height: 34px;
            background: linear-gradient(145deg, #1a6bdb, #0c4a9e);
            border: 2px solid #60a5fa;
            border-radius: 12px 12px 16px 16px;
            margin-top: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            box-shadow: 0 4px 10px rgba(26, 107, 219, 0.4);
        }

        /* EDGE Chest Emblem */
        .edge-robot-badge {
            background: rgba(0, 0, 0, 0.55);
            border: 1px solid #38bdf8;
            border-radius: 6px;
            padding: 1px 6px;
            font-size: 10px;
            font-weight: 900;
            color: #38bdf8;
            letter-spacing: 1px;
            font-family: monospace;
            text-shadow: 0 0 6px #38bdf8;
        }

        /* Tiny Hovering Jets */
        .edge-robot-thruster {
            width: 18px;
            height: 8px;
            background: linear-gradient(180deg, #f59e0b, #ef4444);
            border-radius: 0 0 50% 50%;
            margin-top: -1px;
            box-shadow: 0 4px 10px #f59e0b, 0 6px 16px #ef4444;
            animation: edgeThrust 0.4s ease-in-out infinite alternate;
        }

        @keyframes edgeThrust {
            from { height: 6px; opacity: 0.8; }
            to { height: 11px; opacity: 1; }
        }

        /* Speech Tooltip Bubble */
        .edge-robot-bubble {
            position: absolute;
            bottom: calc(100% + 12px);
            left: 50%;
            transform: translateX(-50%);
            background: #ffffff;
            color: #0f172a;
            font-size: 12px;
            font-weight: 800;
            padding: 7px 14px;
            border-radius: 14px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.25);
            white-space: nowrap;
            pointer-events: none;
            opacity: 0.95;
            transition: all 0.25s ease;
            border: 1.5px solid #1a6bdb;
            animation: edgeBounceBubble 2s infinite ease-in-out;
            font-family: inherit;
            direction: rtl;
        }

        .edge-robot-bubble::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 6px;
            border-style: solid;
            border-color: #1a6bdb transparent transparent transparent;
        }

        @keyframes edgeBounceBubble {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            50% { transform: translateX(-50%) translateY(-4px); }
        }

        /* Hover & Active Effects */
        #edge-robot-mascot:hover {
            transform: scale(1.12) rotate(-3deg);
        }

        #edge-robot-mascot:hover .edge-robot-bubble {
            opacity: 1;
            transform: translateX(-50%) scale(1.05);
            background: #fef08a;
            color: #854d0e;
            border-color: #f59e0b;
        }

        /* Rocket Blast Off Exit Animation */
        #edge-robot-mascot.edge-blast-off {
            animation: edgeFlyAway 0.9s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards !important;
        }

        @keyframes edgeFlyAway {
            0% { transform: scale(1.2) rotate(0deg); }
            30% { transform: scale(0.9) translateY(20px) rotate(-15deg); }
            100% { transform: translateY(-120vh) scale(0.2) rotate(45deg); opacity: 0; }
        }

        /* Responsive on smaller screens */
        @media (max-width: 768px) {
            #edge-robot-mascot {
                bottom: 18px !important;
                left: 14px !important;
                right: auto !important;
                top: auto !important;
            }
            .edge-robot-inner {
                width: 68px;
                height: 82px;
            }
            .edge-robot-head {
                width: 60px;
                height: 40px;
            }
            .edge-robot-screen {
                width: 46px;
                height: 24px;
            }
            .edge-robot-torso {
                width: 48px;
                height: 28px;
            }
            .edge-robot-bubble {
                font-size: 10px;
                padding: 5px 10px;
            }
        }
        `;

        const styleEl = document.createElement('style');
        styleEl.id = 'edge-robot-styles';
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
    }

    function createRobotElement() {
        // Random placement from presets
        const positions = [
            'edge-pos-bottom-left',
            'edge-pos-bottom-right',
            'edge-pos-mid-left'
        ];
        // Default to bottom-left on mobile, or randomize on desktop
        const isMobile = window.innerWidth <= 768;
        const chosenPos = isMobile ? 'edge-pos-bottom-left' : positions[Math.floor(Math.random() * positions.length)];

        const robot = document.createElement('div');
        robot.id = 'edge-robot-mascot';
        robot.className = chosenPos;
        robot.setAttribute('title', 'روبوت EDGE السري - اضغط واكسب 15 نقطة!');

        robot.innerHTML = `
            <div class="edge-robot-bubble">
                بيب بوب! 🤖 أنا روبوت EDGE.. اضغط عليا وخُد 15 نقطة! 🪙
            </div>
            <div class="edge-robot-inner">
                <div class="edge-robot-antenna"></div>
                <div class="edge-robot-head">
                    <div class="edge-robot-screen">
                        <div class="edge-robot-eye"></div>
                        <div class="edge-robot-eye"></div>
                    </div>
                </div>
                <div class="edge-robot-torso">
                    <div class="edge-robot-badge">EDGE</div>
                </div>
                <div class="edge-robot-thruster"></div>
            </div>
        `;

        robot.addEventListener('click', onRobotClick);
        document.body.appendChild(robot);
    }

    async function onRobotClick() {
        const robot = document.getElementById('edge-robot-mascot');
        if (!robot || robot._processing) return;
        robot._processing = true;

        // Get user session
        let user = null;
        try {
            const raw = localStorage.getItem('currentUser') || localStorage.getItem('user');
            if (raw) user = JSON.parse(raw);
        } catch (_) {}

        // If not logged in
        if (!user || (!user._id && !user.id)) {
            robot._processing = false;
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'مرحباً بك يا بطل! 🤖',
                    html: `
                        <p style="font-size:1.05rem; margin-bottom:12px;">أنا روبوت المنصة السري <b>EDGE</b>!</p>
                        <p style="color:#64748b; font-size:0.92rem;">لقد عثرت عليّ، ولكن عليك <b>تسجيل الدخول</b> بحسابك أولاً لتحصل على جائزة الـ <b>15 نقطة</b> فوراً في رصيدك!</p>
                    `,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'تسجيل الدخول الآن 🔑',
                    cancelButtonText: 'سأفعل لاحقاً',
                    confirmButtonColor: '#1a6bdb'
                }).then(res => {
                    if (res.isConfirmed) {
                        window.location.href = 'login';
                    }
                });
            } else {
                alert('سجل دخولك أولاً للمنصة عشان تاخد جائزة الـ 15 نقطة!');
            }
            return;
        }

        const userId = user._id || user.id;

        try {
            const res = await fetch('/api/play-study/find-edge-robot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();

            if (data.success) {
                // Rocket blast off animation!
                robot.classList.add('edge-blast-off');
                setTimeout(() => robot.remove(), 950);

                // Celebration modal
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: '🎉 كفووو يا أسطورة! لقيتني!',
                        html: `
                            <div style="text-align:center; padding:10px 0;">
                                <div style="font-size:2.8rem; margin-bottom:10px; animation: edgeAntennaPulse 0.8s infinite alternate;">🤖✨</div>
                                <p style="font-size:1.05rem; font-weight:800; color:var(--text-dark, #0f172a); margin-bottom:8px;">
                                    أحسنت الملاحظة! روبوت المنصة السري <b>EDGE</b> يهديك:
                                </p>
                                <div style="background:linear-gradient(135deg, rgba(245,158,11,0.12), rgba(16,185,129,0.12)); border:2px dashed #f59e0b; border-radius:18px; padding:18px; margin:16px 0;">
                                    <div style="font-size:2.5rem; font-weight:900; color:#f59e0b; line-height:1;">+15 🪙</div>
                                    <div style="font-size:0.95rem; font-weight:800; color:#059669; margin-top:8px;">نقطة ذهبية في Play & Study</div>
                                </div>
                                <p style="font-size:0.86rem; color:#64748b; line-height:1.6;">
                                    رصيدك الإجمالي الآن: <b style="color:#1a6bdb;">${data.totalPoints} نقطة</b>.<br>
                                    تذكّر: كل <b>200 نقطة</b> تمنحك كود خصم بقيمة <b>100 جنيه</b> لفتح أي محاضرة!
                                </p>
                            </div>
                        `,
                        confirmButtonText: 'عاش! شكراً يا روبوت EDGE 🚀',
                        confirmButtonColor: '#10b981'
                    });
                } else {
                    alert(`🎉 مبروك! حصلت على 15 نقطة. رصيدك الحالي: ${data.totalPoints}`);
                }

                // If user is on play-study page, reload profile to update HUD
                if (typeof loadPlayStudyProfile === 'function') {
                    loadPlayStudyProfile();
                }
            } else {
                robot._processing = false;
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: '🤖 روبوت EDGE يحييك!',
                        text: data.message,
                        icon: 'info',
                        confirmButtonText: 'حسناً، فهمت',
                        confirmButtonColor: '#1a6bdb'
                    });
                } else {
                    alert(data.message);
                }
            }
        } catch (err) {
            console.error('Robot claim error:', err);
            robot._processing = false;
        }
    }
})();
