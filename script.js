/**

 * EDGE Academy - Core Client Script

 * Optimized & Refactored version

 */

// ==========================================

// 1. Global Configuration & Variables

// ==========================================

localStorage.removeItem('apiUrl');
const API_URL = window.location.origin + (window.location.pathname.includes('/masar') ? '/masar' : '');

// Helper: fix image paths that come from backend as /uploads/... → prepend API_URL
function resolveImg(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads/')) return API_URL + path;
    return path;
}

let videos = [];
window._allVideos = videos; // مشاركة القائمة مع watchVideo لكشف الفيديوهات المجانية

let courses = [];
window._allCourses = courses;

let codes = [];

let teachers = [];

let users = [];

let violations = [];

let teacherFollowerCounts = {};

// Hero Banner Slider Variables

let currentHeroSlideIdx = 0;

let heroSliderTimer = null;

// ==========================================

// 2. Core App Initialization

// ==========================================

document.addEventListener('DOMContentLoaded', async () => {

    if (localStorage.getItem('currentUser') && !localStorage.getItem('masar_device_id')) {
        const randomDevId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('masar_device_id', randomDevId);
    }

    // Apply saved or system theme preference

    initTheme();

    // Init 3D canvas animation on auth pages (login/register)

    initAuthCanvas();

    // Load data from backend database

    await loadDataFromDB();

    // Init specific pages depending on active elements in DOM

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Heartbeat to keep user online

    if (currentUser && currentUser._id) {

        initHeartbeat(currentUser._id);

        initRealtimeSync(currentUser);

    }

    // Update navbar actions depending on auth state

    updateNavbarAuth(currentUser);

    // Initializations for student page elements

    if (!currentUser) {

        const guestGreeting = document.getElementById('guestGreeting');

        if (guestGreeting) guestGreeting.style.display = 'block';

    } else {

        const welcomeKey = 'welcomeShown_' + (currentUser._id || currentUser.phone || 'guest');

        if (!sessionStorage.getItem(welcomeKey)) {

            showWelcomeNotification(currentUser.firstName || currentUser.name || 'طالب');

            sessionStorage.setItem(welcomeKey, 'true');

        }

    }

    // Init chatbot for students (excluded on admin & watch pages)

    initMasarChatbot(currentUser);

    // Load dynamic announcements (banners)

    await loadHomeBanners();

    // Render client lists

    renderTeachers();

    renderSubjects();

    renderVideos();

    // Render courses library page (courses.html)

    renderCoursesLibrary();

    // Registration Form setup

    const registrationForm = document.getElementById('registrationForm');

    if (registrationForm) {

        showStep(1);

        const gradeSelect = document.getElementById('gradeSelect');

        if (gradeSelect) {

            gradeSelect.addEventListener('change', updateSectionVisibility);

            updateSectionVisibility();

        }

    }

    // Admin pages setup

    if (document.getElementById('violations-list')) {

        loadViolationsFromDB();

    }



    if (document.getElementById('codes-list')) {

        displayCodes();

        populateVideoSelect();

    }

    // Bind dummy links in footer and language switcher to beautiful SweetAlerts

    document.querySelectorAll('.site-footer a[href="#"], .site-footer button.lang-btn, header button.lang-btn, .footer-nav a[href="#"]').forEach(el => {

        el.addEventListener('click', (e) => {

            e.preventDefault();

            Swal.fire({

                title: 'ميزة تجريبية',

                text: 'هذه الميزة غير مفعلة حالياً في النسخة التجريبية لمنصة EDGE Academy وسيتم تفعيلها قريباً!',

                icon: 'info',

                confirmButtonText: 'حسناً',

                confirmButtonColor: '#65fc5f'

            });

        });

    });

    showMobileDeviceSuggestion();

    initSmartNavbar();

});

// ==========================================

// 3D AUTH CANVAS ANIMATION

// ==========================================

function initAuthCanvas() {

    const canvas = document.getElementById('authCanvas');

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    function resize() {

        canvas.width = canvas.offsetWidth;

        canvas.height = canvas.offsetHeight;

    }

    resize();

    window.addEventListener('resize', resize);

    // Particles

    const particles = [];

    const PARTICLE_COUNT = 80;

    const GOLD = 'rgba(217, 154, 38,';

    const BLUE = 'rgba(99, 179, 237,';

    class Particle {

        constructor() { this.reset(true); }

        reset(initial = false) {

            this.x = Math.random() * canvas.width;

            this.y = initial ? Math.random() * canvas.height : canvas.height + 10;

            this.z = Math.random() * 2 + 0.5; // depth 0.5 - 2.5

            this.size = (Math.random() * 2.5 + 0.5) * this.z;

            this.speedY = (Math.random() * 0.4 + 0.15) * this.z;

            this.speedX = (Math.random() - 0.5) * 0.3 * this.z;

            this.opacity = (Math.random() * 0.5 + 0.2) * this.z;

            this.color = Math.random() > 0.5 ? GOLD : BLUE;

            this.twinkle = Math.random() * Math.PI * 2;

            this.twinkleSpeed = Math.random() * 0.04 + 0.01;

        }

        update() {

            this.y -= this.speedY;

            this.x += this.speedX;

            this.twinkle += this.twinkleSpeed;

            this.currentOpacity = this.opacity * (0.6 + 0.4 * Math.sin(this.twinkle));

            if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) this.reset();

        }

        draw() {

            ctx.beginPath();

            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

            ctx.fillStyle = `${this.color}${this.currentOpacity})`;

            ctx.fill();

        }

    }

    // 3D Grid lines

    class GridLine {

        constructor(isH) {

            this.isH = isH;

            this.progress = Math.random();

            this.speed = Math.random() * 0.003 + 0.001;

            this.pos = Math.random();

        }

        update() {

            this.progress += this.speed;

            if (this.progress > 1) this.progress = 0;

        }

        draw() {

            const w = canvas.width, h = canvas.height;

            const vx = w / 2, vy = h * 0.45; // vanishing point

            const edgeSpread = this.isH ? h : w;

            const t = this.pos;

            ctx.beginPath();

            if (this.isH) {

                const y = t * h;

                const ratio = Math.abs(y - vy) / h;

                ctx.moveTo(0, y);

                ctx.lineTo(w, y);

                ctx.strokeStyle = `rgba(217, 154, 38, ${0.03 + ratio * 0.05})`;

                ctx.lineWidth = 0.4 + ratio * 0.4;

            } else {

                const x = t * w;

                const ratio = Math.abs(x - vx) / w;

                ctx.moveTo(x, 0);

                ctx.lineTo(vx + (x - vx) * 0.2, vy);

                ctx.strokeStyle = `rgba(99, 179, 237, ${0.03 + ratio * 0.04})`;

                ctx.lineWidth = 0.3 + ratio * 0.3;

            }

            ctx.stroke();

        }

    }

    // Floating 3D spheres

    class Sphere {

        constructor() {

            this.x = Math.random() * canvas.width;

            this.y = Math.random() * canvas.height;

            this.r = Math.random() * 60 + 30;

            this.phase = Math.random() * Math.PI * 2;

            this.speed = Math.random() * 0.005 + 0.002;

            this.ax = (Math.random() - 0.5) * 40;

            this.ay = (Math.random() - 0.5) * 40;

        }

        update() { this.phase += this.speed; }

        draw() {

            const cx = this.x + Math.sin(this.phase) * this.ax;

            const cy = this.y + Math.cos(this.phase * 0.7) * this.ay;

            const grad = ctx.createRadialGradient(cx - this.r * 0.3, cy - this.r * 0.3, 0, cx, cy, this.r);

            grad.addColorStop(0, 'rgba(217, 154, 38, 0.12)');

            grad.addColorStop(0.5, 'rgba(99, 179, 237, 0.05)');

            grad.addColorStop(1, 'rgba(217, 154, 38, 0)');

            ctx.beginPath();

            ctx.arc(cx, cy, this.r, 0, Math.PI * 2);

            ctx.fillStyle = grad;

            ctx.fill();

            // Ring

            ctx.beginPath();

            ctx.arc(cx, cy, this.r, 0, Math.PI * 2);

            ctx.strokeStyle = 'rgba(217, 154, 38, 0.12)';

            ctx.lineWidth = 1;

            ctx.stroke();

        }

    }

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    const hLines = Array.from({length: 12}, () => new GridLine(true));

    const vLines = Array.from({length: 10}, () => new GridLine(false));

    const spheres = Array.from({length: 4}, () => new Sphere());

    function animate() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid

        hLines.forEach(l => { l.update(); l.draw(); });

        vLines.forEach(l => { l.update(); l.draw(); });

        // Draw spheres

        spheres.forEach(s => { s.update(); s.draw(); });

        // Draw particles

        particles.forEach(p => { p.update(); p.draw(); });

        requestAnimationFrame(animate);

    }

    animate();

}

// Load all primary data parallelly to improve performance

async function loadDataFromDB() {

    try {

        const [videoRes, codeRes, teacherRes, followerRes, courseRes] = await Promise.all([

            fetch(`${API_URL}/api/videos`),

            fetch(`${API_URL}/api/codes`),

            fetch(`${API_URL}/api/teachers`),

            fetch(`${API_URL}/api/teachers/follower-counts`),

            fetch(`${API_URL}/api/courses`).catch(() => null)

        ]);

        videos = await videoRes.json();
        window._allVideos = videos; // sync for watchVideo free-check

        codes = await codeRes.json();

        teachers = await teacherRes.json();

        teacherFollowerCounts = await followerRes.json();

        if (courseRes && courseRes.ok) {
            const rawCourses = await courseRes.json();
            courses = Array.isArray(rawCourses) ? rawCourses : (rawCourses.courses || rawCourses.data || []);
            window._allCourses = courses;
        }

    } catch (err) {

        console.warn('Network error: Loading client data from localStorage fallback');

        videos = JSON.parse(localStorage.getItem('videos')) || [];

        codes = JSON.parse(localStorage.getItem('codes')) || [];

        teachers = [];

        courses = [];

        teacherFollowerCounts = {};

    }

}

// ==========================================

// 3. Theme & UI Styling

// ==========================================

function initTheme() {

    const themeButtons = document.querySelectorAll('.theme-switcher');

    if (themeButtons.length > 0) {

        themeButtons.forEach(btn => {

            btn.addEventListener('click', () => {

                applyTheme(btn.dataset.theme);

            });

        });

        applyTheme(getInitialTheme());

    }

}

function applyTheme(theme) {

    document.body.classList.toggle('dark-mode', theme === 'dark');

    localStorage.setItem('theme', theme);

    const themeButtons = document.querySelectorAll('.theme-switcher');

    themeButtons.forEach(btn => {

        btn.classList.toggle('active', btn.dataset.theme === theme);

    });

}

function getInitialTheme() {

    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark' || savedTheme === 'light') {

        return savedTheme;

    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

}

function updateNavbarAuth(currentUser) {

    const authActions = document.getElementById('authActions');
    const userDropdownArea = document.getElementById('userDropdownArea');
    const navUserName = document.getElementById('navUserName');
    const userPoints = document.getElementById('userPoints');
    const mobileMenuAuth = document.getElementById('mobileMenuAuth');
    const mobileMenuUser = document.getElementById('mobileMenuUser');
    const mobileUserPoints = document.getElementById('mobileUserPoints');
    const userGreeting = document.getElementById('userGreeting');
    const guestGreeting = document.getElementById('guestGreeting');
    const userNamePlaceholder = document.getElementById('userNamePlaceholder');

    const adminPortalNavBtn = document.getElementById('adminPortalNavBtn');
    const adminMenuLink = document.getElementById('adminMenuLink');
    const mobileAdminLink = document.getElementById('mobileAdminLink');
    const adminHeroBadge = document.getElementById('adminHeroBadge');

    const isAdmin = currentUser && (
        currentUser.role === 'admin' ||
        currentUser.phone === '01556448880' ||
        currentUser.phone === '01234567890' ||
        currentUser.isAdmin === true
    );

    if (adminPortalNavBtn) adminPortalNavBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    if (adminMenuLink) adminMenuLink.style.display = isAdmin ? 'flex' : 'none';
    if (mobileAdminLink) mobileAdminLink.style.display = isAdmin ? 'block' : 'none';
    if (adminHeroBadge) adminHeroBadge.style.display = isAdmin ? 'block' : 'none';

    if (currentUser) {

        if (authActions) authActions.style.display = 'none';

        if (mobileMenuAuth) mobileMenuAuth.style.display = 'none';

        if (mobileMenuUser) mobileMenuUser.style.display = 'flex';

        if (userDropdownArea) {

            userDropdownArea.style.display = 'block';

            if (navUserName) navUserName.textContent = currentUser.firstName || currentUser.name || (isAdmin ? 'مدير المنصة' : 'طالب');

            if (userPoints) userPoints.textContent = currentUser.balance !== undefined ? currentUser.balance : 0;

        }

        if (mobileUserPoints) {

            mobileUserPoints.textContent = currentUser.balance !== undefined ? currentUser.balance : 0;

        }

        if (userGreeting) userGreeting.style.display = 'block';
        if (guestGreeting) guestGreeting.style.display = 'none';
        if (userNamePlaceholder) userNamePlaceholder.textContent = currentUser.firstName || currentUser.name || (isAdmin ? 'المسؤول' : 'طالب EDGE Academy');

    } else {

        if (authActions) authActions.style.display = 'flex';

        if (mobileMenuAuth) mobileMenuAuth.style.display = 'flex';

        if (mobileMenuUser) mobileMenuUser.style.display = 'none';

        if (userDropdownArea) userDropdownArea.style.display = 'none';

        if (userGreeting) userGreeting.style.display = 'none';
        if (guestGreeting) guestGreeting.style.display = 'block';

    }

}

// ==========================================

// 4. Smart Navigation

// ==========================================

function initSmartNavbar() {

    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');

    const sections = [

        { id: 'teachersGrid',          selector: '[href*="teachersGrid"]' },

        { id: 'subjectsWrapper',       selector: '[href*="subjectsWrapper"]' },

        { id: 'latest-videos-section', selector: '[href*="latest-videos-section"]' },

    ];

    document.querySelectorAll('a[href*="index.html#"], a[href^="#"]').forEach(link => {

        link.addEventListener('click', function (e) {

            const href = this.getAttribute('href');

            const hashMatch = href.match(/#(.+)$/);

            if (!hashMatch) return;

            const targetId = hashMatch[1];

            if (isIndexPage) {

                e.preventDefault();

                const target = document.getElementById(targetId);

                if (target) {

                    const headerH = document.querySelector('header')?.offsetHeight || 70;

                    const top = target.getBoundingClientRect().top + window.scrollY - headerH - 20;

                    window.scrollTo({ top, behavior: 'smooth' });

                    setNavActive(this);

                }

            } else {

                e.preventDefault();

                window.location.href = '/';

            }

        });

    });

    if (isIndexPage) {

        const allNavLinks = document.querySelectorAll('.nav-link-item, .mobile-nav-link');

        const observer = new IntersectionObserver((entries) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    const id = entry.target.id;

                    allNavLinks.forEach(link => {

                        const href = link.getAttribute('href') || '';

                        if (href.includes(id)) {

                            setNavActive(link);

                        }

                    });

                }

            });

        }, {

            rootMargin: '-30% 0px -60% 0px',

            threshold: 0

        });

        sections.forEach(s => {

            const el = document.getElementById(s.id);

            if (el) observer.observe(el);

        });

        window.addEventListener('scroll', () => {

            if (window.scrollY < 100) {

                allNavLinks.forEach(link => {

                    const href = link.getAttribute('href') || '';

                    if (href === 'index.html' || href === '/' || href === './') {

                        setNavActive(link);

                    }

                });

            }

        }, { passive: true });

    }

}

function setNavActive(activeLink) {

    const href = activeLink.getAttribute('href') || '';

    const isDesktop = activeLink.classList.contains('nav-link-item');

    const isMobile  = activeLink.classList.contains('mobile-nav-link');

    if (isDesktop) {

        document.querySelectorAll('.nav-link-item').forEach(l => l.classList.remove('active'));

    }

    if (isMobile) {

        document.querySelectorAll('.mobile-nav-link').forEach(l => l.classList.remove('active'));

    }

    activeLink.classList.add('active');

    const sectionKey = href.split('#')[1] || '';

    if (sectionKey) {

        document.querySelectorAll(`.nav-link-item[href*="${sectionKey}"], .mobile-nav-link[href*="${sectionKey}"]`).forEach(l => {

            l.classList.add('active');

        });

    }

}

// ==========================================

// 5. Auth & User Sessions

// ==========================================

function initHeartbeat(userId) {
    const sendPing = () => {
        const deviceId = localStorage.getItem('masar_device_id') || '';
        fetch(`${API_URL}/api/users/ping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, deviceId })
        })
        .then(async res => {
            if (res.status === 403) {
                alert('❌ تم إلغاء ربط هذا الجهاز أو تم تسجيل الدخول من جهاز آخر. سيتم تسجيل خروجك الآن.');
                localStorage.removeItem('currentUser');
                window.location.href = 'login';
            }
        })
        .catch(() => {});
    };
    sendPing();
    setInterval(sendPing, 30000);
}

function initRealtimeSync(currentUser) {

    if (currentUser.role === 'admin' || currentUser.role === 'teacher') return;

    const syncUserData = async () => {

        try {

            const res = await fetch(`${API_URL}/api/users/${currentUser._id}`);

            if (!res.ok) return;

            const data = await res.json();

            if (!data.success || !data.user) return;

            const fresh = data.user;

            const local = JSON.parse(localStorage.getItem('currentUser'));

            if (!local) return;

            let changed = false;

            const freshSubs = JSON.stringify((fresh.subscribedVideos || []).slice().sort());

            const localSubs = JSON.stringify((local.subscribedVideos || []).slice().sort());

            if (freshSubs !== localSubs) changed = true;

            if (fresh.balance !== local.balance) changed = true;

            if (fresh.isBlocked !== local.isBlocked) {

                if (fresh.isBlocked) {

                    localStorage.removeItem('currentUser');

                    sessionStorage.clear();

                    window.location.href = 'login';

                    return;

                }

                changed = true;

            }

            if (changed) {

                const merged = Object.assign({}, local, fresh);

                localStorage.setItem('currentUser', JSON.stringify(merged));

                const upPoints = document.getElementById('userPoints');

                const upMobile = document.getElementById('mobileUserPoints');

                if (upPoints) upPoints.textContent = fresh.balance !== undefined ? fresh.balance : 0;

                if (upMobile) upMobile.textContent = fresh.balance !== undefined ? fresh.balance : 0;

                if (freshSubs !== localSubs) {

                    const videoRes = await fetch(`${API_URL}/api/videos`);

                    if (videoRes.ok) videos = await videoRes.json();

                    renderVideos();

                    const myCoursesContainer = document.getElementById('my-courses-list');

                    if (myCoursesContainer) renderSubscribedVideos();

                }

            }

        } catch (e) {

            // Silently fail without interrupting user experience

        }

    };

    setTimeout(syncUserData, 2000);

    setInterval(syncUserData, 5000);

}

function handleLogin(event) {

    event.preventDefault();

    const phone = document.getElementById('loginPhone').value.trim();

    const password = document.getElementById('loginPassword').value.trim();

    if (!phone || !password) {

        alert('❌ يرجى ملء رقم الهاتف وكلمة المرور');

        return false;

    }

    // default admin backup account

    if (phone === '01234567890' && password === 'admin') {

        localStorage.setItem('currentUser', JSON.stringify({ role: 'admin', name: 'Admin' }));

        window.location.href = 'admin';

        return false;

    }

    function getDeviceName() {
        const ua = navigator.userAgent;
        let os = "جهاز غير معروف";
        if (ua.match(/Android/i)) os = "أندرويد";
        else if (ua.match(/iPhone|iPad|iPod/i)) os = "آيفون/آيباد";
        else if (ua.match(/Windows/i)) os = "ويندوز";
        else if (ua.match(/Macintosh/i)) os = "ماك";
        else if (ua.match(/Linux/i)) os = "لينكس";

        let browser = "متصفح غير معروف";
        if (ua.match(/Chrome|CriOS/i)) browser = "كروم";
        else if (ua.match(/Safari/i) && !ua.match(/Chrome/i)) browser = "سفاري";
        else if (ua.match(/Firefox/i)) browser = "فايرفوكس";
        else if (ua.match(/Edge/i)) browser = "إيدج";

        return `${os} (${browser})`;
    }

    const deviceId = localStorage.getItem('masar_device_id') || '';
    const deviceName = getDeviceName();

    fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, deviceId, deviceName })
    })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'بيانات الدخول غير صحيحة');
            }
            return data;
        })
        .then(data => {
            if (data.success) {
                if (data.deviceId) {
                    localStorage.setItem('masar_device_id', data.deviceId);
                }
                localStorage.setItem('currentUser', JSON.stringify(data.user));

                if (data.user.role === 'admin') {
                    alert('👑 مرحباً بك يا مدير المنصة، جاري تحويلك للوحة التحكم...');
                    window.location.href = 'admin';
                } else if (data.user.role === 'teacher' && data.user.isTeacherAccount) {
                    window.location.href = 'teacher-dashboard';
                } else if (data.user.role === 'assistant' || data.user.role === 'teacher') {
                    window.location.href = 'assistant-hub';
                } else {
                    alert('✅ تم الدخول بنجاح، دراسة ممتعة وموفقة!');
                    window.location.href = '/';
                }
            } else {
                alert('❌ ' + (data.message || 'بيانات الدخول غير صحيحة'));
            }
        })
        .catch(err => {
            console.error('Login error:', err);
            alert(err.message || '❌ خطأ في الاتصال بقاعدة البيانات. تأكد من تشغيل الخادم');
        });

    return false;

}

function handleLogout() {

    localStorage.removeItem('currentUser');

    sessionStorage.clear();

    window.location.href = '/';

}

function togglePasswordVisibility(button) {

    const input = button.previousElementSibling;

    const isPassword = input.getAttribute('type') === 'password';

    input.setAttribute('type', isPassword ? 'text' : 'password');

    button.textContent = isPassword ? '🙈' : '👁️';

}

// ==========================================

// 6. Registration Flow Steps

// ==========================================

let currentStep = 1;

function showStep(step) {

    const form = document.getElementById('registrationForm');

    if (!form) return;

    document.querySelectorAll('.form-step').forEach(el => {

        el.classList.remove('active');

    });

    form.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');

    document.querySelectorAll('.step').forEach(el => {

        el.classList.toggle('active', parseInt(el.dataset.step) === step);

    });

    const prevBtn = document.getElementById('prevBtn');

    const nextBtn = document.getElementById('nextBtn');

    const submitBtn = document.getElementById('submitBtn');

    if (prevBtn) prevBtn.style.display = step > 1 ? 'block' : 'none';

    if (nextBtn) nextBtn.style.display = step < 3 ? 'block' : 'none';

    if (submitBtn) submitBtn.style.display = step === 3 ? 'block' : 'none';

}

function nextStep() {

    if (validateStep(currentStep)) {

        currentStep++;

        if (currentStep > 3) currentStep = 3;

        showStep(currentStep);

        window.scrollTo(0, 0);

    }

}

function previousStep() {

    currentStep--;

    if (currentStep < 1) currentStep = 1;

    showStep(currentStep);

    window.scrollTo(0, 0);

}

function validateStep(step) {

    const form = document.getElementById('registrationForm');

    const currentStepElement = form.querySelector(`.form-step[data-step="${step}"]`);

    const inputs = currentStepElement.querySelectorAll('input[required], select[required]');

    if (step === 1) {

        const phone = form.querySelector('input[name="phone"]').value;

        const parentPhone = form.querySelector('input[name="parentPhone"]').value;

        const phoneRegex = /^01[0125]\d{8}$/;

        if (!phoneRegex.test(phone)) {

            alert('❌ رقم الهاتف غير صحيح. يجب أن يتكون من 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015');

            return false;

        }

        if (!phoneRegex.test(parentPhone)) {

            alert('❌ رقم هاتف ولي الأمر غير صحيح. يجب أن يتكون من 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015');

            return false;

        }

        if (phone === parentPhone) {

            alert('❌ رقم هاتف الطالب لا يمكن أن يكون متطابقاً مع رقم هاتف ولي الأمر');

            return false;

        }

    }

    if (step === 2) {

        const gradeSelect = form.querySelector('select[name="grade"]');

        if (!gradeSelect.value) {

            alert('❌ لم يتم اختيار المرحلة الدراسية');

            return false;

        }

    }

    for (let input of inputs) {

        if (!input.value) {

            alert(`❌ الرجاء ملء جميع الحقول المطلوبة`);

            return false;

        }

    }

    if (step === 3) {

        const password = form.querySelector('input[name="password"]').value;

        const confirmPassword = form.querySelector('input[name="confirmPassword"]').value;

        if (password !== confirmPassword) {

            alert('❌ كلمة المرور وتأكيدها غير متطابقين');

            return false;

        }

        if (password.length < 6) {

            alert('❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل');

            return false;

        }

    }

    return true;

}

function handleRegister(event) {

    event.preventDefault();

    if (!validateStep(3)) return false;

    const form = event.target;

    const username = form.querySelector('input[name="username"]').value;

    const password = form.querySelector('input[name="password"]').value;

    const firstName = form.querySelector('input[name="firstName"]').value;

    const lastName = form.querySelector('input[name="lastName"]').value;

    const birthDate = form.querySelector('input[name="birthDate"]').value;

    const phone = form.querySelector('input[name="phone"]').value;

    const parentPhone = form.querySelector('input[name="parentPhone"]').value;

    const nationalId = form.querySelector('input[name="nationalId"]').value;

    const governorate = form.querySelector('select[name="governorate"]').value;

    const grade = form.querySelector('select[name="grade"]').value;

    const section = form.querySelector('select[name="section"]').value;

    const secondLanguage = form.querySelector('select[name="secondLanguage"]').value;

    fetch(`${API_URL}/api/register`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

            username, firstName, lastName, birthDate, phone, parentPhone,

            nationalId, governorate, grade, section, secondLanguage, password

        })

    }).then(res => res.json())

        .then(data => {

            if (data.success) {

                alert('✅ تم إنشاء الحساب بنجاح!');

                localStorage.setItem('currentUser', JSON.stringify(data.user));

                window.location.href = '/';

            } else {

                alert('❌ خطأ: ' + data.message);

            }

        })

        .catch(err => {

            alert('❌ خطأ في الاتصال بقاعدة البيانات');

            console.error(err);

        });

    return false;

}

function updateSectionVisibility() {

    const gradeSelect = document.getElementById('gradeSelect');

    const sectionGroup = document.getElementById('sectionGroup');

    const sectionSelect = sectionGroup ? sectionGroup.querySelector('select[name="section"]') : null;

    if (!gradeSelect || !sectionGroup || !sectionSelect) return;

    // The scientific/literary track starts from second secondary; it is not
    // applicable to preparatory grades or first secondary.
    const gradesWithoutSection = [

        'الصف الأول الإعدادي',

        'الصف الثاني الإعدادي',

        'الصف الثالث الإعدادي',

        'الصف الأول الثانوي'

    ];

    const isPreparatory = gradesWithoutSection.includes(gradeSelect.value);

    if (isPreparatory) {

        sectionGroup.style.display = 'none';

        sectionSelect.required = false;

        sectionSelect.value = '';

    } else {

        sectionGroup.style.display = 'block';

        sectionSelect.required = true;

    }

}

// Calculate birth date from National ID input

document.addEventListener('DOMContentLoaded', () => {

    const nationalIdInput = document.getElementById('nationalId');

    const birthDateInput = document.getElementById('birthDate');

    if (!nationalIdInput || !birthDateInput) return;

    nationalIdInput.addEventListener('input', (e) => {

        let val = e.target.value;

        val = val.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

        val = val.replace(/\D/g, '');

        e.target.value = val;

        if (val.length === 14) {

            const century = val[0];

            const year = val.substring(1, 3);

            const month = val.substring(3, 5);

            const day = val.substring(5, 7);

            let fullYear = '';

            if (century === '2') fullYear = '19' + year;

            else if (century === '3') fullYear = '20' + year;

            else {

                alert('❌ رقم قومي غير صحيح (القرن يجب أن يبدأ بـ 2 أو 3)');

                return;

            }

            birthDateInput.value = `${fullYear}-${month}-${day}`;

            const today = new Date();

            let age = today.getFullYear() - parseInt(fullYear);

            if (

                today.getMonth() + 1 < parseInt(month) ||

                (today.getMonth() + 1 === parseInt(month) && today.getDate() < parseInt(day))

            ) age--;

            if (age < 10 || age > 21) {

                alert(`❌ سنك ${age} عاماً. المنصة مخصصة للطلاب من سن 10 إلى 21 عاماً.`);

                nationalIdInput.value = '';

                birthDateInput.value = '';

            }

        } else {

            birthDateInput.value = '';

        }

    });

});

// ==========================================

// 7. Chatbot (Masar Helper)

// ==========================================

function initMasarChatbot(currentUser) {

    const path = window.location.pathname.toLowerCase();

    const isAllowed = path.endsWith('index.html') || path.endsWith('/') || path.includes('teachers') || path.includes('profile');

    if (!isAllowed) return;

    if (!document.getElementById('masarChatbotStyles')) {

        const style = document.createElement('style');

        style.id = 'masarChatbotStyles';

        style.textContent = `

            .masar-chatbot-btn {

                position: fixed;

                bottom: 24px;

                right: 24px;

                width: 60px;

                height: 60px;

                background: linear-gradient(135deg, #65fc5f, #22c55e);

                border-radius: 50%;

                display: flex;

                align-items: center;

                justify-content: center;

                box-shadow: 0 8px 30px rgba(101, 252, 95, 0.45);

                cursor: pointer;

                z-index: 10000;

                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            }

            .masar-chatbot-btn:hover {

                transform: scale(1.1) translateY(-3px);

                box-shadow: 0 12px 35px rgba(101, 252, 95, 0.6);

            }

            .masar-chatbot-btn i {

                font-size: 26px;

                color: #ffffff;

            }

            .masar-chatbot-pulse {

                position: absolute;

                top: 0; right: 0;

                width: 14px; height: 14px;

                background: #10b981;

                border-radius: 50%;

                border: 2px solid #fff;

            }

            .masar-chatbot-window {

                position: fixed;

                bottom: 96px;

                right: 24px;

                width: 360px;

                height: 500px;

                background: rgba(255, 255, 255, 0.85);

                backdrop-filter: blur(24px) saturate(180%);

                -webkit-backdrop-filter: blur(24px) saturate(180%);

                border: 1px solid rgba(15, 23, 42, 0.08);

                border-radius: 24px;

                box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);

                z-index: 10000;

                display: flex;

                flex-direction: column;

                overflow: hidden;

                font-family: 'Tajawal', sans-serif;

                direction: rtl;

                opacity: 0;

                transform: translateY(20px) scale(0.95);

                pointer-events: none;

                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15);

            }

            .masar-chatbot-window.active {

                opacity: 1;

                transform: translateY(0) scale(1);

                pointer-events: auto;

            }

            .chatbot-header {

                background: #0f172a;

                color: #ffffff;

                padding: 18px 20px;

                display: flex;

                justify-content: space-between;

                align-items: center;

                border-bottom: 2px solid #65fc5f;

            }

            .chatbot-header-info {

                display: flex;

                align-items: center;

                gap: 10px;

            }

            .chatbot-header-info img {

                width: 32px; height: 32px;

                object-fit: contain;

            }

            .chatbot-status {

                width: 8px; height: 8px;

                background: #10b981;

                border-radius: 50%;

                display: inline-block;

                margin-left: 6px;

            }

            .chatbot-close-btn {

                background: none;

                border: none;

                color: #94a3b8;

                font-size: 1.2rem;

                cursor: pointer;

                transition: color 0.2s;

            }

            .chatbot-close-btn:hover {

                color: #ffffff;

            }

            .chatbot-messages {

                flex: 1;

                padding: 20px;

                overflow-y: auto;

                display: flex;

                flex-direction: column;

                gap: 12px;

                background: rgba(241, 245, 249, 0.5);

            }

            .chat-msg {

                max-width: 85%;

                padding: 12px 16px;

                border-radius: 16px;

                font-size: 0.88rem;

                line-height: 1.5;

                font-weight: 500;

            }

            .chat-msg.bot {

                background: #ffffff;

                color: #1e293b;

                align-self: flex-start;

                border-top-right-radius: 4px;

                border: 1px solid rgba(15, 23, 42, 0.08);

                box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);

            }

            .chat-msg.user {

                background: linear-gradient(135deg, #65fc5f, #22c55e);

                color: #0f172a; /* Dark text for readability on bright neon green */

                align-self: flex-end;

                border-top-left-radius: 4px;

                font-weight: 700;

                box-shadow: 0 4px 12px rgba(101, 252, 95, 0.18);

            }

            .chatbot-faq-container {

                display: flex;

                flex-wrap: wrap;

                gap: 6px;

                margin-top: 10px;

            }

            .faq-pill {

                background: rgba(101, 252, 95, 0.08);

                border: 1px solid rgba(101, 252, 95, 0.25);

                color: #1e293b;

                padding: 6px 12px;

                border-radius: 20px;

                font-size: 0.78rem;

                font-weight: 700;

                cursor: pointer;

                transition: all 0.2s ease;

            }

            .faq-pill:hover {

                background: #65fc5f;

                color: #0f172a; /* Dark text for readability */

                border-color: #65fc5f;

                box-shadow: 0 4px 10px rgba(101, 252, 95, 0.25);

            }

            .chatbot-input-area {

                padding: 14px 20px;

                background: #ffffff;

                border-top: 1px solid rgba(15, 23, 42, 0.08);

                display: flex;

                gap: 10px;

            }

            .chatbot-input-area input {

                flex: 1;

                background: #f1f5f9;

                border: 1px solid #cbd5e1;

                border-radius: 12px;

                padding: 10px 14px;

                font-family: inherit;

                color: #1e293b;

                font-size: 0.88rem;

                outline: none;

                transition: all 0.2s;

            }

            .chatbot-input-area input:focus {

                border-color: #65fc5f;

                background: #ffffff;

                box-shadow: 0 0 0 3px rgba(101, 252, 95, 0.15);

            }

            .chatbot-input-area button {

                background: #0f172a;

                color: #ffffff;

                border: none;

                border-radius: 12px;

                padding: 0 18px;

                font-weight: 700;

                font-family: inherit;

                cursor: pointer;

                transition: all 0.2s;

            }

            .chatbot-input-area button:hover {

                background: #1e293b;

                transform: translateY(-1px);

            }

            /* Dark Mode Overrides */

            .dark-mode .masar-chatbot-window {

                background: rgba(17, 24, 39, 0.85);

                border-color: rgba(255, 255, 255, 0.05);

                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);

            }

            .dark-mode .chatbot-messages {

                background: rgba(15, 23, 42, 0.3);

            }

            .dark-mode .chat-msg.bot {

                background: #1f2937;

                color: #f3f4f6;

                border-color: rgba(255, 255, 255, 0.05);

            }

            .dark-mode .faq-pill {

                color: #f3f4f6;

                background: rgba(101, 252, 95, 0.12);

                border-color: rgba(101, 252, 95, 0.35);

            }

            .dark-mode .faq-pill:hover {

                background: #65fc5f;

                color: #0f172a;

            }

            .dark-mode .chatbot-input-area {

                background: #111827;

                border-top-color: rgba(255, 255, 255, 0.05);

            }

            .dark-mode .chatbot-input-area input {

                background: #1f2937;

                border-color: #374151;

                color: #f3f4f6;

            }

            .dark-mode .chatbot-input-area input:focus {

                background: #111827;

                border-color: #65fc5f;

            }

            .dark-mode .chatbot-input-area button {

                background: #f3f4f6;

                color: #090d16;

            }

            .dark-mode .chatbot-input-area button:hover {

                background: #ffffff;

            }

        `;

        document.head.appendChild(style);

    }

    const botBtn = document.createElement('div');

    botBtn.className = 'masar-chatbot-btn';

    botBtn.id = 'masarChatbotBtn';

    botBtn.innerHTML = `<i class="fas fa-comment-dots"></i><span class="masar-chatbot-pulse"></span>`;

    const botWindow = document.createElement('div');

    botWindow.className = 'masar-chatbot-window';

    botWindow.id = 'masarChatbotWindow';

    const userName = currentUser ? currentUser.firstName : 'طالبنا العزيز';

    botWindow.innerHTML = `

        <div class="chatbot-header">

            <div class="chatbot-header-info">

                <div style="width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">🤖</div>

                <div>

                    <h4 style="margin:0; font-size:0.95rem; font-weight:800;">مساعد EDGE Academy الذكي</h4>

                    <span style="font-size:0.72rem; opacity:0.8;"><span class="chatbot-status"></span>متصل الآن</span>

                </div>

            </div>

            <button class="chatbot-close-btn" id="chatbotCloseBtn">✖</button>

        </div>

        <div class="chatbot-messages" id="chatbotMessages">

            <div class="chat-msg bot">

                أهلاً بك يا <b>${userName}</b> في منصة EDGE Academy التعليمية! 👋<br>

                أنا مساعدك الذكي لمنصة EDGE Academy، كيف يمكنني إرشادك وتسهيل دراستك اليوم؟

                <div class="chatbot-faq-container">

                    <span class="faq-pill" onclick="sendFaqRequest('كيف أشحن كود؟')">🔑 كيف أشحن كود؟</span>

                    <span class="faq-pill" onclick="sendFaqRequest('كيف أدخل الامتحان؟')">📝 كيف أدخل الامتحان؟</span>

                    <span class="faq-pill" onclick="sendFaqRequest('المحاضرة لا تعمل')">🎬 المحاضرة لا تعمل</span>

                    <span class="faq-pill" onclick="sendFaqRequest('رقم الدعم الفني')">💚 رقم الدعم الفني</span>

                </div>

            </div>

        </div>

        <form class="chatbot-input-area" id="chatbotForm" onsubmit="handleBotSendMessage(event)">

            <input type="text" id="chatbotInput" placeholder="اكتب سؤالك هنا..." autocomplete="off">

            <button type="submit">إرسال</button>

        </form>

    `;

    document.body.appendChild(botBtn);

    document.body.appendChild(botWindow);

    botBtn.addEventListener('click', () => {

        botWindow.classList.toggle('active');

        const pulse = botBtn.querySelector('.masar-chatbot-pulse');

        if (pulse) pulse.style.display = 'none';

    });

    document.getElementById('chatbotCloseBtn').addEventListener('click', () => {

        botWindow.classList.remove('active');

    });

}

window.sendFaqRequest = function (faqText) {

    appendChatMessage(faqText, 'user');

    setTimeout(() => {

        const botReply = getBotRuleResponse(faqText);

        appendChatMessage(botReply, 'bot');

    }, 600);

};

window.handleBotSendMessage = function (event) {

    event.preventDefault();

    const input = document.getElementById('chatbotInput');

    const msgText = input.value.trim();

    if (!msgText) return;

    appendChatMessage(msgText, 'user');

    input.value = '';

    setTimeout(() => {

        const botReply = getBotRuleResponse(msgText);

        appendChatMessage(botReply, 'bot');

    }, 700);

};

function appendChatMessage(text, sender) {

    const container = document.getElementById('chatbotMessages');

    if (!container) return;

    const div = document.createElement('div');

    div.className = `chat-msg ${sender}`;

    div.innerHTML = text;

    container.appendChild(div);

    container.scrollTop = container.scrollHeight;

}

function getBotRuleResponse(msg) {

    const q = msg.toLowerCase().trim();

    if (q.includes('كود') || q.includes('شحن') || q.includes('اشحن') || q.includes('تفعيل')) {

        return `لشحن أكواد السنتر وتفعيل الكورسات بحسابك، يرجى اتّباع الآتي [16]:

        <br>1. اذهب لصفحة <b>حسابي</b> الشخصي [16].

        <br>2. اختر خانة <b>شحن كود سنتر</b> من القائمة الجانبية [16].

        <br>3. قم بلصق الكود واضغط <b>تحقق</b> لتفعيل الكورس بحسابك للأبد [16]!`;

    }

    if (q.includes('امتحان') || q.includes('اختبار') || q.includes('حل') || q.includes('درجات')) {

        return `لدخول الامتحانات المدرسية المتاحة لصفك [2]:

        <br>1. اضغط على قسم <b>الامتحانات</b> في القائمة العلوية للموقع [2].

        <br>2. اختر الامتحان المخصص لمادتك واضغط <b>ابدأ الامتحان</b> [2].

        <br>âš ï¸ تنبيه هام: نظام الامتحانات مأمن بالكامل، لذا يرجى عدم مغادرة صفحة الامتحان أو التبديل لتبويبات أخرى لتفادي غلق الامتحان وتقديمه تلقائياً بحسابك [2]!`;

    }

    if (q.includes('لا تعمل') || q.includes('شغال') || q.includes('مشكلة') || q.includes('فيديو') || q.includes('صوت') || q.includes('يفتح')) {

        return `إذا واجهتك مشكلة في تشغيل المحاضرات، يرجى التحقق من الآتي [11]:

        <br>1. تأكد من تفعيل كود المحاضرة بحسابك أولاً [11].

        <br>2. تأكد من استقرار شبكة الإنترنت لديك وعمل تحديث (Refresh) للصفحة [11].

        <br>3. ننصح باستخدام متصفح <b>Google Chrome</b> لضمان عمل مشغل الحماية v3 بأعلى كفاءة [11].`;

    }

    if (q.includes('دعم') || q.includes('تواصل') || q.includes('رقم') || q.includes('المشرف') || q.includes('واتس')) {

        return `يمكنك التواصل المباشر مع مشرفي الدعم الفني والتعليمي لمنصة EDGE Academy عبر الواتساب على هذا الرقم [11]:

        <br><b style="color:#06d6a0; font-size:1.05rem;">01556448880</b> (مسار ميديا) [11].

        نحن متواجدون لخدمتك ومساعدتك دائماً 💚!`;

    }

    return `عذراً يا بطل، لم أفهم سؤالك بدقة 🧠. يمكنك تجربة اختيار أحد الأسئلة الجاهزة المخصصة بالبطاقات العلوية، أو التواصل المباشر مع الدعم الفني للمنصة عبر واتساب على الرقم <b style="color:#dda852;">01556448880</b> وسنقوم بحل مشكلتك فوراً [11]!`;

}

// ==========================================

// 8. Banners & Slider (Hero Banner)

// ==========================================

async function loadHomeBanners() {

    const track = document.getElementById('heroSlidesTrack');

    const prevBtn = document.getElementById('heroPrev');

    const nextBtn = document.getElementById('heroNext');

    const pagination = document.getElementById('heroPagination');

    const defaultSlide = document.getElementById('defaultSlide');

    if (!track || !defaultSlide) return;

    try {

        const res = await fetch(`${API_URL}/api/banners`);

        const data = await res.json();

        if (data.success && data.banners.length > 0) {

            let slidesHTML = '';

            let dotsHTML = '';

            track.innerHTML = '';

            data.banners.forEach((b, idx) => {

                const activeClass = idx === 0 ? 'active' : '';

                const clickAttr = b.link ? `style="cursor: pointer;" onclick="window.open('${b.link}', '_blank')"` : '';

                const bannerImgUrl = resolveImg(b.imagePath);
                slidesHTML += `

                    <div class="hero-slide hero-slide--img ${activeClass}" ${clickAttr} style="background-image: url('${bannerImgUrl}'); position: absolute; inset: 0; transition: opacity 0.7s ease; opacity: ${idx === 0 ? '1' : '0'}; background-size: cover !important; background-position: center center !important; background-repeat: no-repeat !important; width: 100% !important; height: 100% !important;">

                        ${b.title ? `<div class="hero-banner-caption">${b.title}</div>` : ''}

                    </div>

                `;

                dotsHTML += `<span class="hp-dot ${idx === 0 ? 'active' : ''}" onclick="goToHeroSlide(${idx})"></span>`;

            });

            track.innerHTML = slidesHTML;

            if (pagination) pagination.innerHTML = dotsHTML;

            if (data.banners.length > 1) {

                if (prevBtn) prevBtn.style.display = 'flex';

                if (nextBtn) nextBtn.style.display = 'flex';

                startAutoHeroSlider();

            }

        }

    } catch (err) {

        console.error('Error loading home banners:', err);

    }

}

window.heroSlide = function (direction) {

    const slides = document.querySelectorAll('.hero-slide');

    if (slides.length <= 1) return;

    slides[currentHeroSlideIdx].classList.remove('active');

    slides[currentHeroSlideIdx].style.opacity = '0';

    currentHeroSlideIdx = (currentHeroSlideIdx + direction + slides.length) % slides.length;

    slides[currentHeroSlideIdx].classList.add('active');

    slides[currentHeroSlideIdx].style.opacity = '1';

    updateHeroDots();

    resetHeroTimer();

};

window.goToHeroSlide = function (idx) {

    const slides = document.querySelectorAll('.hero-slide');

    if (slides.length <= 1) return;

    slides[currentHeroSlideIdx].classList.remove('active');

    slides[currentHeroSlideIdx].style.opacity = '0';

    currentHeroSlideIdx = idx;

    slides[currentHeroSlideIdx].classList.add('active');

    slides[currentHeroSlideIdx].style.opacity = '1';

    updateHeroDots();

    resetHeroTimer();

};

function updateHeroDots() {

    const dots = document.querySelectorAll('.hp-dot');

    dots.forEach((dot, i) => {

        dot.classList.toggle('active', i === currentHeroSlideIdx);

    });

}

function startAutoHeroSlider() {

    if (heroSliderTimer) clearInterval(heroSliderTimer);

    heroSliderTimer = setInterval(() => {

        window.heroSlide(1);

    }, 5000);

}

function resetHeroTimer() {

    if (heroSliderTimer) {

        clearInterval(heroSliderTimer);

        startAutoHeroSlider();

    }

}

// ==========================================

// 9. Security Violations (Admin View Only)

// ==========================================

async function loadViolationsFromDB() {

    const listContainer = document.getElementById('violations-list');

    if (!listContainer) return;

    try {

        const res = await fetch(`${API_URL}/api/security/reports`);

        const data = await res.json();

        if (data.success) {

            violations = data.reports || [];

            displayViolations();

        }

    } catch (err) {

        console.error('Error fetching security reports:', err);

    }

}

function displayViolations() {

    const container = document.getElementById('violations-list');

    if (!container) return;

    container.innerHTML = `

        <h3 id="violations-section" style="margin-top: 35px; display: flex; justify-content: space-between; align-items: center; font-family: 'Cairo', sans-serif;">

            🚨 سجل محاولات التسجيل والاختراق المرصودة

            <button onclick="clearAllViolations()" class="btn-red" style="font-size: 0.8rem; padding: 7px 14px; background: #e74c3c; border: none; color: #fff; border-radius: 6px; cursor: pointer; font-family: inherit;">مسح السجل بالكامل</button>

        </h3>

    `;

    if (violations.length === 0) {

        container.innerHTML += `

            <p style="color: var(--gray); padding: 20px; background: var(--surface-alt); border-radius: 12px; text-align: center; border: 1px dashed var(--border); font-family: 'Cairo', sans-serif;">

                لا توجد محاولات تسجيل شاشة أو اختراق مرصودة حالياً. المنصة مؤمّنة بالكامل ومستقرة.

            </p>`;

        return;

    }

    let tableHTML = `

        <div class="table-responsive" style="overflow-x: auto; margin-top: 15px;">

            <table style="width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; text-align: right; font-family: 'Cairo', sans-serif; direction: rtl;">

                <thead>

                    <tr style="background: var(--surface-alt); border-bottom: 2px solid var(--border);">

                        <th style="padding: 14px; font-weight: 800;">الطالب (الاسم والهاتف)</th>

                        <th style="padding: 14px; font-weight: 800;">المحاضرة المستهدفة</th>

                        <th style="padding: 14px; font-weight: 800;">نوع الاختراق المرصود</th>

                        <th style="padding: 14px; font-weight: 800;">التوقيت</th>

                        <th style="padding: 14px; font-weight: 800;">حجم الشاشة والجهاز</th>

                        <th style="padding: 14px; font-weight: 800; text-align: center;">الإجراءات السريعة</th>

                    </tr>

                </thead>

                <tbody>

    `;

    violations.forEach(v => {

        const dateStr = new Date(v.timestamp).toLocaleString('ar-EG');

        tableHTML += `

            <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;">

                <td style="padding: 14px;">

                    <strong style="color: var(--text-dark);">${v.studentName || 'طالب مجهول'}</strong>

                    <div style="font-size: 0.8rem; color: var(--gray); margin-top: 2px;">${v.studentPhone || 'â€”'}</div>

                </td>

                <td style="padding: 14px; font-weight: 700; color: var(--text-dark);">${v.videoTitle || 'â€”'}</td>

                <td style="padding: 14px;">

                    <span style="background: rgba(231,76,60,0.1); color: #e74c3c; padding: 4px 10px; border-radius: 30px; font-size: 0.78rem; font-weight: 800;">

                        ${v.reason || 'محاولة تصوير'}

                    </span>

                </td>

                <td style="padding: 14px; font-size: 0.85rem; color: var(--gray);">${dateStr}</td>

                <td style="padding: 14px; font-size: 0.82rem; font-family: monospace; color: var(--gray);">${v.screenSize || 'â€”'}</td>

                <td style="padding: 14px; text-align: center;">

                    <button onclick="unlockStudentVideo('${v.studentPhone}', '${v.videoId}', this)" style="

                        background: linear-gradient(135deg, #2ca772, #248a5d);

                        color: #fff;

                        border: none;

                        padding: 7px 14px;

                        border-radius: 6px;

                        font-size: 0.8rem;

                        font-weight: 700;

                        cursor: pointer;

                        font-family: inherit;

                        box-shadow: 0 4px 12px rgba(44,167,114,0.2);

                        transition: all 0.2s;

                    ">🔑 إلغاء الحظر وتفعيل الفيديو</button>

                </td>

            </tr>

        `;

    });

    tableHTML += `</tbody></table></div>`;

    container.innerHTML += tableHTML;

}

async function unlockStudentVideo(studentPhone, videoId, btnElement) {

    if (!confirm('تأكيد إلغاء الحظر وإعادة السماح بمشاهدة الفيديو لهذا الطالب؟')) return;

    if (btnElement) {

        btnElement.disabled = true;

        btnElement.textContent = 'جاري الفتح...';

    }

    try {

        const res = await fetch(`${API_URL}/api/security/unlock`, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ studentPhone, videoId })

        });

        const data = await res.json();

        if (data.success) {

            alert('✅ تم فتح حظر الفيديو بنجاح، بإمكان الطالب إعادة تحميل الصفحة والتشغيل الآن!');

            loadViolationsFromDB();

        } else {

            alert('❌ خطأ في إلغاء الحظر: ' + (data.message || 'فشلت العملية'));

            if (btnElement) {

                btnElement.disabled = false;

                btnElement.textContent = '🔑 إلغاء الحظر وتفعيل الفيديو';

            }

        }

    } catch (err) {

        alert('❌ خطأ في الاتصال بقاعدة البيانات. تأكد من تشغيل الخادم');

        if (btnElement) {

            btnElement.disabled = false;

            btnElement.textContent = '🔑 إلغاء الحظر وتفعيل الفيديو';

        }

    }

}

async function clearAllViolations() {

    if (!confirm('تأكيد مسح كافة سجلات الاختراقات المرصودة نهائياً؟')) return;

    try {

        const res = await fetch(`${API_URL}/api/security/reports`, { method: 'DELETE' });

        const data = await res.json();

        if (data.success) {

            alert('✅ تم مسح السجل الأمني بنجاح.');

            loadViolationsFromDB();

        }

    } catch (err) {

        console.error(err);

    }

}

// ==========================================

// 10. Lectures & Course Subscription

// ==========================================

function renderVideos() {

    const container = document.getElementById('latest-videos');

    const section = document.getElementById('latest-videos-section');

    if (!container) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    const studentGrade = currentUser && currentUser.grade ? currentUser.grade : null;

    // Courses and standalone lectures may coexist.  Do not hide a teacher's
    // standalone lecture merely because another course exists on the platform.
    const visibleCourses = (courses || []).filter(course => {
            if (course.hidden) return false;
            if (studentGrade && course.grades && course.grades.length > 0) {
                return course.grades.includes(studentGrade);
            }
            return true;
        });
    const visibleStandaloneVideos = (videos || []).filter(video => {
            if (video.courseId) return false;
            if (video.hidden === true || video.hidden === 'true') return false;
            if (studentGrade && video.grades && video.grades.length > 0) {
                return video.grades.includes(studentGrade);
            }
            return true;
        });
    const itemsToDisplay = [
        ...visibleCourses.map(course => ({ ...course, _isStandaloneVideo: false })),
        ...visibleStandaloneVideos.map(video => ({ ...video, _isStandaloneVideo: true }))
    ];

    if (itemsToDisplay.length === 0) {

        if (section) section.style.display = 'none';

        container.innerHTML = '<p style="color: var(--gray); text-align: center; width: 100%;">لا توجد كورسات متاحة حالياً.</p>';

        return;

    }

    if (section) section.style.display = 'block';

    const enrolledCourseIds = currentUser ? (currentUser.subscribedCourses || []).map(e => {
        if (typeof e === 'string') return e;
        return String(e.courseId || e._id || '');
    }).filter(Boolean) : [];
    const enrolledVideoIds = currentUser ? (currentUser.subscribedVideos || []).map(v => String(v)) : [];

    container.innerHTML = itemsToDisplay.map(item => {
        const itemId = String(item._id);
        const isStandaloneVideo = item._isStandaloneVideo === true;
        const isSubscribed = isStandaloneVideo ? enrolledVideoIds.includes(itemId) : enrolledCourseIds.includes(itemId);
        const isFreeOpen = (item.price === null || item.price === undefined);
        const destUrl = isStandaloneVideo ? `watch?videoId=${itemId}&code=ALREADY_SUBSCRIBED` : `course-view?id=${itemId}`;
        const subscribeUrl = isStandaloneVideo ? `javascript:watchVideo('${itemId}')` : (isSubscribed ? destUrl : `course-view?id=${itemId}&activate=1`);

        const priceLabelText = isFreeOpen
            ? 'مجاني'
            : (item.price > 0 ? `${item.price} جنية` : 'مجاني بكود');
        const priceBadgeClass = isFreeOpen ? 'course-price-badge-overlay free' : 'course-price-badge-overlay';

        const enterBtn = isStandaloneVideo
            ? `<a href="javascript:watchVideo('${itemId}')" class="btn-enter" onclick="event.stopPropagation()">${isSubscribed ? 'مشاهدة المحاضرة' : 'الاشتراك في المحاضرة'}</a>`
            : `<a href="${destUrl}" class="btn-enter" onclick="event.stopPropagation()">الدخول للكورس</a>`;

        let actionButtonHTML;
        if (isFreeOpen) {
            actionButtonHTML = `<a href="${isStandaloneVideo ? `javascript:watchVideo('${itemId}')` : destUrl}" class="btn-join" onclick="event.stopPropagation()">
                <i class="fas fa-play"></i> ${isStandaloneVideo ? (isSubscribed ? 'مشاهدة المحاضرة' : 'الاشتراك مجاناً') : 'مشاهدة الكورس مجاناً !'}
            </a>`;
        } else if (isSubscribed) {
            actionButtonHTML = `<a href="${isStandaloneVideo ? `javascript:watchVideo('${itemId}')` : destUrl}" class="btn-join btn-enrolled-green" onclick="event.stopPropagation()">
                <i class="fas fa-check-circle"></i> أنت مشترك بالفعل
            </a>`;
        } else {
            actionButtonHTML = `<a href="${subscribeUrl}" class="btn-join" onclick="event.stopPropagation()">
                ${isStandaloneVideo ? 'الاشتراك في المحاضرة !' : 'الإشتراك في الكورس !'}
            </a>`;
        }

        // Meta info (Teacher name & lecture count)
        const tName = item.teacherName || (teachers.find(t => t._id === item.teacherId)?.name) || '';
        const tSubject = item.teacherSubject || (teachers.find(t => t._id === item.teacherId)?.subjectAr) || '';
        const teacherMeta = tName ? `<div style="font-size:0.82rem; color:var(--primary); font-weight:700; margin-bottom:6px;"><i class="fas fa-chalkboard-teacher" style="margin-left:4px;"></i>${tName}${tSubject ? ' (' + tSubject + ')' : ''}</div>` : '';
        const lecturesMeta = isStandaloneVideo
            ? '<span style="font-size:0.8rem; color:var(--gray); background:var(--surface-alt); padding:2px 8px; border-radius:6px;"><i class="fas fa-play-circle" style="margin-left:4px;"></i>محاضرة منفصلة</span>'
            : (item.videoCount ? `<span style="font-size:0.8rem; color:var(--gray); background:var(--surface-alt); padding:2px 8px; border-radius:6px;"><i class="fas fa-video" style="margin-left:4px;"></i>${item.videoCount} محاضرة</span>` : '');

        return `
            <div class="course-card" style="flex: 0 0 320px; cursor:pointer;" onclick="${isStandaloneVideo ? '' : `location.href='${destUrl}'`}">
                <div class="course-thumb-wrap">
                    <span class="${priceBadgeClass}">${priceLabelText}</span>
                    <img src="${resolveImg(item.imagePath || item.image) || 'imges/st.jpg'}" class="course-thumb" alt="${item.title}" loading="lazy" onerror="this.onerror=null;this.src='imges/st.jpg'">
                </div>
                <div class="course-body">
                    <h3 class="course-title">${item.title}</h3>
                    ${teacherMeta}
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                        <div class="course-price" style="margin:0;">${priceLabelText}</div>
                        ${lecturesMeta}
                    </div>
                    <div class="course-btns">
                        ${enterBtn}
                        ${actionButtonHTML}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// COURSES LIBRARY PAGE (courses.html)
// ==========================================
let _coursesLibraryData = [];
let _coursesLibraryTeacherFilter = 'all';

function renderCoursesLibrary() {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return; // not on courses page

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const studentGrade = currentUser && currentUser.grade ? currentUser.grade : null;

    // Filter visible courses by grade
    _coursesLibraryData = (courses || []).filter(c => {
        if (c.hidden) return false;
        if (studentGrade && c.grades && c.grades.length > 0) {
            return c.grades.includes(studentGrade);
        }
        return true;
    });

    // Build teacher filter chips
    _buildTeacherChips();
    applyCoursesFilter();
}

function _buildTeacherChips() {
    const chipsContainer = document.getElementById('teacherChips');
    if (!chipsContainer) return;

    const seenTeachers = new Map();
    _coursesLibraryData.forEach(c => {
        if (c.teacherId && !seenTeachers.has(c.teacherId)) {
            seenTeachers.set(c.teacherId, {
                id: c.teacherId,
                name: c.teacherName || (teachers.find(t => t._id === c.teacherId)?.name) || 'معلم',
                image: c.teacherImage || (teachers.find(t => t._id === c.teacherId)?.imagePath) || ''
            });
        }
    });

    // Keep "الكل" chip and inject teacher chips
    const allChipHTML = `<button class="filter-chip active" data-teacher-id="all" onclick="filterByTeacher('all', this)"><i class="fas fa-border-all"></i> الكل</button>`;
    const teacherChipsHTML = [...seenTeachers.values()].map(t => {
        const img = t.image ? `<img src="${resolveImg(t.image)}" onerror="this.style.display='none'">` : '';
        return `<button class="filter-chip" data-teacher-id="${t.id}" onclick="filterByTeacher('${t.id}', this)">${img} ${t.name}</button>`;
    }).join('');

    chipsContainer.innerHTML = allChipHTML + teacherChipsHTML;
}

function filterByTeacher(teacherId, btn) {
    _coursesLibraryTeacherFilter = teacherId;
    document.querySelectorAll('#teacherChips .filter-chip').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    applyCoursesFilter();
}

function applyCoursesFilter() {
    const grid = document.getElementById('coursesGrid');
    const resultsInfo = document.getElementById('coursesResultsInfo');
    const searchInput = document.getElementById('coursesSearchInput');
    if (!grid) return;

    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const enrolledCourseIds = currentUser ? (currentUser.subscribedCourses || []).map(e => String(e.courseId || e._id || '')).filter(Boolean) : [];

    let filtered = _coursesLibraryData;

    // Filter by teacher
    if (_coursesLibraryTeacherFilter !== 'all') {
        filtered = filtered.filter(c => c.teacherId === _coursesLibraryTeacherFilter);
    }

    // Filter by search
    if (searchTerm) {
        filtered = filtered.filter(c =>
            (c.title || '').toLowerCase().includes(searchTerm) ||
            (c.teacherName || '').toLowerCase().includes(searchTerm) ||
            (c.description || '').toLowerCase().includes(searchTerm)
        );
    }

    if (resultsInfo) {
        resultsInfo.innerHTML = filtered.length > 0
            ? `عدد الكورسات: <span>${filtered.length}</span>`
            : '&nbsp;';
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="courses-empty"><i class="fas fa-search"></i><h3>لا توجد نتائج</h3><p>جرب البحث بكلمة مختلفة أو غيّر الفلتر</p></div>`;
        return;
    }

    grid.innerHTML = filtered.map(course => {
        const courseId = String(course._id);
        const isSubscribed = enrolledCourseIds.includes(courseId);
        const isFreeOpen = (course.price === null || course.price === undefined);
        const destUrl = `course-view?id=${courseId}`;
        const subscribeUrl = isSubscribed ? destUrl : `course-view?id=${courseId}&activate=1`;

        const priceLabelText = isFreeOpen ? 'مجاني' : (course.price > 0 ? `${course.price} جنية` : 'مجاني بكود');
        const priceBadgeClass = isFreeOpen ? 'course-price-badge-overlay free' : 'course-price-badge-overlay';

        const tName = course.teacherName || (teachers.find(t => t._id === course.teacherId)?.name) || '';
        const tImg = course.teacherImage || (teachers.find(t => t._id === course.teacherId)?.imagePath) || '';
        const teacherBadge = tName ? `<div class="course-card-teacher-badge">${tImg ? `<img src="${resolveImg(tImg)}" onerror="this.style.display='none'">` : ''}<span>${tName}</span></div>` : '';
        const lecturesMeta = course.videoCount ? `<span style="font-size:0.8rem;color:var(--gray);background:var(--surface-alt,#f3f4f6);padding:2px 8px;border-radius:6px;"><i class="fas fa-video" style="margin-left:4px;"></i>${course.videoCount} محاضرة</span>` : '';

        let actionBtn;
        if (isFreeOpen) {
            actionBtn = `<a href="${destUrl}" class="btn-join" onclick="event.stopPropagation()"><i class="fas fa-play"></i> مشاهدة مجاناً</a>`;
        } else if (isSubscribed) {
            actionBtn = `<a href="${destUrl}" class="btn-join btn-enrolled-green" onclick="event.stopPropagation()"><i class="fas fa-check-circle"></i> أنت مشترك</a>`;
        } else {
            actionBtn = `<a href="${subscribeUrl}" class="btn-join" onclick="event.stopPropagation()">الاشتراك في الكورس</a>`;
        }

        return `
        <div class="course-card" style="cursor:pointer;" onclick="location.href='${destUrl}'">
            <div class="course-thumb-wrap">
                <span class="${priceBadgeClass}">${priceLabelText}</span>
                <img src="${resolveImg(course.imagePath || course.image) || 'imges/st.jpg'}" class="course-thumb" alt="${course.title}" loading="lazy" onerror="this.onerror=null;this.src='imges/st.jpg'">
            </div>
            ${teacherBadge}
            <div class="course-body">
                <h3 class="course-title">${course.title}</h3>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                    <div class="course-price" style="margin:0;">${priceLabelText}</div>
                    ${lecturesMeta}
                </div>
                <div class="course-btns">
                    <a href="${destUrl}" class="btn-enter" onclick="event.stopPropagation()">الدخول</a>
                    ${actionBtn}
                </div>
            </div>
        </div>`;
    }).join('');
}

async function watchVideo(videoId) {

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {

        alert('يرجى تسجيل الدخول أولاً');

        window.location.href = 'login';

        return;

    }

    // Free lectures require a one-click subscription too, so the teacher can
    // see every enrolled student in the watcher list.
    const videoObj = (window._allVideos || []).find(v => v._id === videoId);
    const isSubscribed = (currentUser.subscribedVideos || []).includes(videoId);

    const isAdmin = currentUser.role === 'admin' || currentUser.phone === '01556448880' || currentUser.phone === '01234567890';

    if (isSubscribed || isAdmin) {

        window.location.href = `watch?videoId=${videoId}&code=ALREADY_SUBSCRIBED`;

        return;

    }

    const mayBeFree = videoObj && (videoObj.price === null || videoObj.price === undefined || Number(videoObj.price) === 0);
    if (mayBeFree) {
        try {
            const freeRes = await fetch(`${API_URL}/api/users/${currentUser._id}/subscribe-free`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId })
            });
            const freeData = await freeRes.json();
            if (freeRes.ok && freeData.success) {
                currentUser.subscribedVideos = currentUser.subscribedVideos || [];
                if (!currentUser.subscribedVideos.includes(videoId)) currentUser.subscribedVideos.push(videoId);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                await Swal.fire({ title: 'تم الاشتراك بنجاح!', text: 'تمت إضافة المحاضرة إلى حسابك ويمكنك مشاهدتها الآن.', icon: 'success', confirmButtonText: 'ابدأ المشاهدة', confirmButtonColor: '#2ca772' });
                window.location.href = `watch?videoId=${videoId}&code=ALREADY_SUBSCRIBED`;
                return;
            }
            if (!freeData.requiresCode) {
                await Swal.fire({ title: 'تعذّر الاشتراك', text: freeData.message || 'حدث خطأ أثناء الاشتراك المجاني.', icon: 'error' });
                return;
            }
        } catch (err) {
            console.error('Free subscription error:', err);
            await Swal.fire({ title: 'تعذّر الاتصال', text: 'تعذّر تسجيل الاشتراك المجاني الآن.', icon: 'error' });
            return;
        }
    }

    // Double check on backend for device compatibility / sync

    try {

        const res = await fetch(`${API_URL}/api/codes/verify`, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ codeStr: null, videoId, studentId: currentUser._id })

        });

        const data = await res.json();

        if (data.success && data.alreadySubscribed) {

            currentUser.subscribedVideos = currentUser.subscribedVideos || [];

            if (!currentUser.subscribedVideos.includes(videoId)) {

                currentUser.subscribedVideos.push(videoId);

                localStorage.setItem('currentUser', JSON.stringify(currentUser));

            }

            window.location.href = `watch?videoId=${videoId}&code=ALREADY_SUBSCRIBED`;

            return;

        }

    } catch (e) {

        // Continue fallback flow

    }

    const { value: code } = await Swal.fire({

        title: 'تفعيل المحاضرة',

        text: 'أدخل كود الشحن للاشتراك في هذه المحاضرة وتفعيلها دائماً في بروفايلك:',

        input: 'text',

        inputPlaceholder: 'أدخل الكود هنا',

        icon: 'info',

        showCancelButton: true,

        confirmButtonText: 'تفعيل الآن',

        cancelButtonText: 'إلغاء',

        confirmButtonColor: '#2ca772',

        cancelButtonColor: '#e74c3c',

        inputValidator: (value) => {

            if (!value) return 'يرجى إدخال الكود!';

        }

    });

    if (!code) return;

    Swal.fire({

        title: 'جاري التحقق...',

        text: 'يرجى الانتظار بينما نتحقق من الكود',

        allowOutsideClick: false,

        didOpen: () => { Swal.showLoading(); }

    });

    fetch(`${API_URL}/api/codes/verify`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ codeStr: code.trim().toUpperCase(), videoId, studentId: currentUser._id })

    })

        .then(res => res.json())

        .then(data => {

            if (data.success) {

                currentUser.subscribedVideos = currentUser.subscribedVideos || [];

                if (!currentUser.subscribedVideos.includes(videoId)) {

                    currentUser.subscribedVideos.push(videoId);

                    localStorage.setItem('currentUser', JSON.stringify(currentUser));

                }

                Swal.fire({

                    title: 'عملية ناجحة!',

                    text: '🎉 تم الاشتراك في المحاضرة بنجاح وتم تفعيلها في بروفايلك!',

                    icon: 'success',

                    confirmButtonText: 'ابدأ المشاهدة',

                    confirmButtonColor: '#2ca772'

                }).then(() => {

                    const codeParam = data.code ? data.code.code : 'ALREADY_SUBSCRIBED';

                    window.location.href = `watch?videoId=${videoId}&code=${codeParam}`;

                });

            } else {

                Swal.fire({

                    title: 'خطأ في الكود',

                    text: data.message,

                    icon: 'error',

                    confirmButtonText: 'حسناً',

                    confirmButtonColor: '#e74c3c'

                });

            }

        })

        .catch(err => {

            console.error(err);

            Swal.fire({

                title: 'خطأ في الاتصال',

                text: 'حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً',

                icon: 'warning',

                confirmButtonText: 'حسناً',

                confirmButtonColor: '#e74c3c'

            });

        });

}

window.subscribeVideo = async function (videoId) {

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {

        Swal.fire({

            title: 'يرجى تسجيل الدخول',

            text: 'يجب تسجيل الدخول أولاً للاشتراك في المحاضرات',

            icon: 'warning',

            confirmButtonText: 'تسجيل الدخول',

            confirmButtonColor: '#65fc5f',

            showCancelButton: true,

            cancelButtonText: 'إلغاء'

        }).then((result) => {

            if (result.isConfirmed) {

                window.location.href = 'login';

            }

        });

        return;

    }

    const { value: codeStr } = await Swal.fire({

        title: 'الاشتراك في المحاضرة',

        text: 'أدخل كود الشحن لتفعيل الاشتراك في هذه المحاضرة:',

        input: 'text',

        inputPlaceholder: 'أدخل الكود هنا',

        icon: 'info',

        showCancelButton: true,

        confirmButtonText: 'تفعيل الآن',

        cancelButtonText: 'إلغاء',

        confirmButtonColor: '#65fc5f',

        cancelButtonColor: '#ef4444',

        inputValidator: (value) => {

            if (!value) return 'يرجى إدخال الكود!';

        }

    });

    if (!codeStr) return;

    Swal.fire({

        title: 'جاري التفعيل...',

        text: 'الرجاء الانتظار قليلاً',

        allowOutsideClick: false,

        didOpen: () => { Swal.showLoading(); }

    });

    try {

        const res = await fetch(`${API_URL}/api/users/${currentUser._id}/subscribe`, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ codeStr: codeStr.trim().toUpperCase(), videoId })

        });

        const data = await res.json();

        if (data.success) {

            Swal.fire({

                title: 'تم الاشتراك بنجاح!',

                text: `🎉 تم الاشتراك بنجاح! المشاهدات المتبقية لكودك: ${data.remainingViews}`,

                icon: 'success',

                confirmButtonColor: '#10b981'

            });

            localStorage.setItem('currentUser', JSON.stringify(data.user));

            renderVideos();

        } else {

            Swal.fire({

                title: 'خطأ',

                text: 'âŒ ' + data.message,

                icon: 'error',

                confirmButtonColor: '#ef4444'

            });

        }

    } catch (err) {

        Swal.fire({

            title: 'خطأ في الاتصال',

            text: 'حدث خطأ أثناء الاتصال بالسيرفر.',

            icon: 'error',

            confirmButtonColor: '#ef4444'

        });

        console.error(err);

    }

};

// ==========================================

// 11. Teachers Management

// ==========================================

function renderTeachers() {
    const teachersGrid = document.getElementById('teachersGrid');
    if (!teachersGrid) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const studentGrade = currentUser?.grade || null;

    let teachersList = [];
    if (studentGrade) {
        // Enrolled student: automatically filter to their grade only!
        teachersList = teachers.filter(t => !t.grades || t.grades.length === 0 || t.grades.includes(studentGrade));
    } else {
        teachersList = [...teachers];
    }

    if (teachersList.length === 0) {
        teachersGrid.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); width: 100%;">
                <i class="fas fa-user-friends" style="font-size: 2.4rem; margin-bottom: 12px; color: var(--primary); opacity: 0.6;"></i>
                <p style="margin: 0; font-size: 1rem; font-weight: 700;">لا يوجد معلمون مسجلون لهذا الصف حالياً.</p>
            </div>
        `;
        return;
    }

    const cardsHTML = teachersList.map(teacher => {
        const isFollowing = currentUser && currentUser.followedTeachers && currentUser.followedTeachers.includes(teacher._id);
        const profileUrl = `teacher-profile?id=${teacher._id}`;
        const teacherImg = resolveImg(teacher.imagePath || teacher.image) || 'imges/man.png';
        const bioText = teacher.bio || 'معلم متميز على منصة EDGE Academy، يقدم أفضل الشروحات والمتابعات المستمرة.';

        return `
            <div class="teacher-card" onclick="location.href='${profileUrl}'">
                <div class="teacher-avatar-container">
                    <div class="teacher-avatar">
                        <img src="${teacherImg}" alt="${teacher.name}" onerror="this.onerror=null;this.src='imges/man.png';">
                    </div>
                </div>
                <h3 class="teacher-name">${teacher.name}</h3>
                <span class="teacher-subject">${teacher.subjectAr || 'مدرس المادة'}</span>
                <p class="teacher-bio">${bioText}</p>
                <button class="teacher-btn" onclick="event.stopPropagation(); location.href='${profileUrl}';">
                    <span>عرض البروفايل والكورسات</span>
                    <i class="fas fa-arrow-left"></i>
                </button>
            </div>
        `;
    }).join('');

    teachersGrid.innerHTML = cardsHTML;

    window.scrollTeachers = function (direction) {
        // In RTL Arabic, scrollBy with smooth behavior handles directional scroll
        const scrollAmount = 294;
        teachersGrid.scrollBy({
            left: direction * scrollAmount,
            behavior: 'smooth'
        });
    };
}

function displayAdminTeachers() {

    const list = document.getElementById('teachers-list-admin');

    if (!list) return;

    list.innerHTML = '<h4>المعلمون المضافون</h4>';

    if (teachers.length === 0) {

        list.innerHTML += '<p>لا يوجد معلمون.</p>';

        return;

    }

    teachers.forEach(t => {

        list.innerHTML += `

            <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:5px;">

                <strong>${t.name}</strong> - ${t.subjectAr}

                <button onclick="deleteTeacher('${t._id}')" class="btn-red" style="float:left; padding:5px 10px;">حذف</button>

            </div>`;

    });

}

function handleAddTeacher(event) {

    event.preventDefault();

    const name = document.getElementById('teacher-name').value;

    const subjectAr = document.getElementById('teacher-subject').value;

    const bio = document.getElementById('teacher-bio').value;

    const checkedBoxes = document.querySelectorAll('input[name="teacher-grades-check"]:checked');

    const gradesArray = Array.from(checkedBoxes).map(cb => cb.value);

    if (gradesArray.length === 0) {

        alert('❌ يرجى اختيار صف دراسي واحد على الأقل للمعلم');

        return;

    }

    const grades = gradesArray.join(',');

    const imageFile = document.getElementById('teacher-image').files[0];

    const formData = new FormData();

    formData.append('name', name);

    formData.append('subjectAr', subjectAr);

    formData.append('bio', bio);

    formData.append('grades', grades);

    if (imageFile) formData.append('image', imageFile);

    fetch(`${API_URL}/api/teachers`, {

        method: 'POST',

        body: formData

    })

        .then(res => res.json())

        .then(data => {

            if (data.success) {

                alert('تم إضافة المعلم بنجاح');

                event.target.reset();

                loadDataFromDB().then(() => displayAdminTeachers());

            } else {

                alert('خطأ في إضافة المعلم: ' + (data.message || ''));

            }

        }).catch(err => {

            console.error(err);

            alert('❌ خطأ في الاتصال بقاعدة البيانات. تأكد من تشغيل الخادم');

        });

}

function deleteTeacher(id) {

    if (!confirm('تأكيد الحذف؟')) return;

    fetch(`${API_URL}/api/teachers/${id}`, { method: 'DELETE' })

        .then(res => res.json())

        .then(data => {

            if (data.success) {

                loadDataFromDB().then(() => displayAdminTeachers());

            }

        });

}

window.goToTeacherPage = function (teacherId) {
    window.location.href = `teacher-profile?id=${teacherId}`;
};

// ==========================================

// 12. Subjects & Layouts

// ==========================================

function renderSubjects() {

    const wrapper = document.getElementById('subjectsWrapper');

    const dotsContainer = document.getElementById('paginationDots');

    if (!wrapper) return;

    if (!Array.isArray(teachers)) teachers = [];

    // التحقق من الطالب المسجل ومرحلته الدراسية
    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch(e) {}

    const studentGrade = currentUser && currentUser.grade ? currentUser.grade.trim() : null;

    // فلترة المعلمين حسب مرحلة الطالب إذا كان مسجلاً
    let filteredTeachers = teachers;
    if (studentGrade) {
        filteredTeachers = teachers.filter(t => {
            if (!t.grades || !Array.isArray(t.grades) || t.grades.length === 0) return true; // متاح لكل المراحل
            return t.grades.some(g => {
                if (!g) return false;
                const cleanG = g.trim();
                return cleanG === studentGrade || studentGrade.includes(cleanG) || cleanG.includes(studentGrade);
            });
        });
    }

    const subjectCounts = {};

    filteredTeachers.forEach(t => {
        // المادة يمكن أن تحتوي على أكثر من اختيار محفوظ بالفاصل |.
        String(t.subjectAr || '').split('|').map(sub => sub.trim()).filter(Boolean).forEach(sub => {
            subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
        });
    });

    const subjectsList = Object.keys(subjectCounts);

    if (subjectsList.length === 0) {

        const emptyMsg = studentGrade
            ? `لا توجد مواد أو معلمون مضافون حالياً لمرحلة (${studentGrade}).<br><a href="subjects.html?grade=all" style="color:var(--primary-red); font-weight:700; text-decoration:underline; display:inline-block; margin-top:10px;">استعراض جميع المواد لجميع المراحل</a>`
            : 'لا توجد مواد دراسية مضافة حالياً. يرجى إضافة معلم مادة أولاً.';

        wrapper.innerHTML = `<p style="color: var(--gray); text-align: center; width: 100%; padding: 25px 15px; font-size: 1rem;">${emptyMsg}</p>`;

        if (dotsContainer) dotsContainer.innerHTML = '';

        return;

    }

    const subjectVisuals = {

        "الرياضيات": "fa-calculator",
        "رياضيات": "fa-calculator",
        "رياضيات وتفاضل": "fa-square-root-variable",
        "تفاضل وتكامل": "fa-infinity",

        "العلوم": "fa-flask",
        "علوم": "fa-flask",

        "اللغة العربية": "fa-book-open",
        "عربي": "fa-book-open",

        "الفيزياء": "fa-atom",
        "فيزياء": "fa-atom",

        "الكيمياء": "fa-vials",
        "كيمياء": "fa-vials",

        "اللغة الإنجليزية": "fa-language",
        "انجليزي": "fa-language",
        "اللغة الفرنسية": "fa-comments",
        "اللغة الألمانية": "fa-language",
        "اللغة الإيطالية": "fa-language",

        "الأحياء": "fa-dna",
        "أحياء": "fa-dna",
        "أحياء وجيولوجيا": "fa-dna",
        "جيولوجيا": "fa-mountain",

        "برمجه": "fa-laptop-code",
        "برمجة": "fa-laptop-code",
        "حاسب آلي": "fa-computer",
        "معلوماتية": "fa-laptop-code",

        "تاريخ": "fa-landmark",
        "التاريخ": "fa-landmark",
        "جغرافيا": "fa-earth-africa",
        "الجغرافيا": "fa-earth-africa",
        "فلسفة": "fa-brain",
        "الفلسفة والمنطق": "fa-brain",
        "منطق": "fa-lightbulb",
        "علم نفس": "fa-users-line",
        "علم النفس والاجتماع": "fa-users-line",
        "فرنساوي": "fa-comments"

    };

    wrapper.innerHTML = subjectsList.map(subject => {

        const count = subjectCounts[subject];

        const countLabel = count === 1 ? 'معلم واحد' : count === 2 ? 'معلمان' : `${count} معلمين`;

        const iconClass = subjectVisuals[subject] || "fa-book";

        const subjectUrl = `subjects?subject=${encodeURIComponent(subject)}${studentGrade ? `&grade=${encodeURIComponent(studentGrade)}` : ''}`;

        return `

            <div class="subject-card" onclick="window.location.href='${subjectUrl}'" style="cursor: pointer;" title="استعراض معلمي ${subject}">

                <div class="subject-icon-container">

                    <i class="fas ${iconClass}"></i>

                </div>

                <h3>${subject}</h3>

                <span class="teacher-count">${countLabel}</span>

                <a href="${subjectUrl}" class="subject-view-btn" onclick="event.stopPropagation();">
                    <span>عرض المعلمين</span>
                    <i class="fas fa-chevron-left" style="font-size: 0.72rem;"></i>
                </a>

            </div>

        `;

    }).join('');

    if (dotsContainer) {

        dotsContainer.innerHTML = subjectsList.map((_, i) =>

            `<span class="dot ${i === 0 ? 'active' : ''}" onclick="scrollToIndex(${i})"></span>`

        ).join('');

    }

    // الاحتفاظ بالمؤشر الحالي منفصلاً عن scrollLeft لأن سلوكه يختلف بين المتصفحات في RTL.
    wrapper.dataset.activeSubjectIndex = '0';
    let scrollFrame;
    wrapper.onscroll = () => {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(() => {
            const wrapperCenter = wrapper.getBoundingClientRect().left + (wrapper.clientWidth / 2);
            const cards = Array.from(wrapper.querySelectorAll('.subject-card'));
            let nearestIndex = 0;
            let nearestDistance = Infinity;
            cards.forEach((card, index) => {
                const rect = card.getBoundingClientRect();
                const distance = Math.abs((rect.left + rect.width / 2) - wrapperCenter);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = index;
                }
            });
            wrapper.dataset.activeSubjectIndex = String(nearestIndex);
            document.querySelectorAll('#paginationDots .dot').forEach((dot, index) => dot.classList.toggle('active', index === nearestIndex));
        });
    };

}

window.scrollSubjects = function (direction) {

    const wrapper = document.getElementById('subjectsWrapper');

    if (!wrapper) return;

    const cards = Array.from(wrapper.querySelectorAll('.subject-card'));
    if (!cards.length) return;
    const current = Number(wrapper.dataset.activeSubjectIndex || 0);
    const next = Math.max(0, Math.min(cards.length - 1, current + Number(direction || 0)));
    window.scrollToIndex(next);

};

window.scrollToIndex = function (index) {

    const wrapper = document.getElementById('subjectsWrapper');

    if (!wrapper) return;

    const cards = Array.from(wrapper.querySelectorAll('.subject-card'));
    const targetIndex = Math.max(0, Math.min(cards.length - 1, Number(index) || 0));
    const card = cards[targetIndex];
    if (!card) return;

    wrapper.dataset.activeSubjectIndex = String(targetIndex);
    document.querySelectorAll('#paginationDots .dot').forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === targetIndex);
        dot.setAttribute('aria-current', dotIndex === targetIndex ? 'true' : 'false');
    });
    // scrollIntoView يعمل بصورة سليمة مع الاتجاه العربي ولا يعتمد على قيمة scrollLeft السالبة.
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

};

// ==========================================

// 13. Student Profile Page

// ==========================================

async function loadFullProfile() {

    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!user) { window.location.href = 'login'; return; }

    const studentEmail = `${user.username || 'student'}@edgeacademy.edu`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(studentEmail)}&color=111827&bgcolor=ffffff&margin=10`;

    const qrImg = document.getElementById('student-qr-img');
    const qrImgTab = document.getElementById('student-qr-img-tab');
    const modalQrImg = document.getElementById('modal-qr-img');
    const qrCodeVal = document.getElementById('student-qr-code-val');
    const qrCodeValTab = document.getElementById('student-qr-code-val-tab');
    const modalQrCodeVal = document.getElementById('modal-qr-code-val');

    if (qrImg) qrImg.src = qrUrl;
    if (qrImgTab) qrImgTab.src = qrUrl;
    if (modalQrImg) modalQrImg.src = qrUrl;
    if (qrCodeVal) qrCodeVal.textContent = studentEmail;
    if (qrCodeValTab) qrCodeValTab.textContent = studentEmail;
    if (modalQrCodeVal) modalQrCodeVal.textContent = studentEmail;

    // Set ID Pass Details
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'طالب المنصة';
    const idName = document.getElementById('id-card-student-name');
    const idGrade = document.getElementById('id-card-student-grade');
    const idPhone = document.getElementById('id-card-student-phone');

    if (idName) idName.textContent = fullName;
    if (idGrade) idGrade.textContent = user.grade || 'غير محدد';
    if (idPhone) idPhone.textContent = user.phone || 'غير مسجل';

    const sideUserName = document.getElementById('sideUserName');

    const sideUserGrade = document.getElementById('sideUserGrade');

    const uName = document.getElementById('u-name');

    const uPhone = document.getElementById('u-phone');

    const uEmail = document.getElementById('u-email');

    const uGrade = document.getElementById('u-grade');

    if (sideUserName) sideUserName.textContent = user.firstName || '';

    if (sideUserGrade) sideUserGrade.textContent = user.grade || '';

    if (uName) uName.textContent = fullName;

    if (uPhone) uPhone.textContent = user.phone || '';

    if (uEmail) {
        if (user.email && !user.email.includes('@masar.edu')) {
            uEmail.textContent = user.email;
        } else {
            uEmail.textContent = studentEmail;
        }
    }

    if (uGrade) uGrade.textContent = user.grade || '';

    if (user.profileImage) {

        const pImg = document.getElementById('profileImg');

        if (pImg) pImg.src = user.profileImage;

    }

    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput && !avatarInput.dataset.listenerAdded) {
        avatarInput.dataset.listenerAdded = 'true';
        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const pImg = document.getElementById('profileImg');
                if (pImg) pImg.style.opacity = '0.5';

                const res = await fetch(`${API_URL}/api/users/${user._id}/avatar`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success && data.imagePath) {
                    user.profileImage = data.imagePath;
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    if (pImg) {
                        pImg.src = data.imagePath;
                        pImg.style.opacity = '1';
                    }
                    const navAvatar = document.querySelector('.navbar-avatar');
                    if (navAvatar) navAvatar.src = data.imagePath;
                    alert('✅ تم تحديث الصورة الشخصية بنجاح!');
                } else {
                    alert('❌ خطأ: ' + (data.message || 'فشل رفع الصورة'));
                    if (pImg) pImg.style.opacity = '1';
                }
            } catch (err) {
                console.error(err);
                alert('❌ خطأ في الاتصال بالخادم لرفع الصورة');
                const pImg = document.getElementById('profileImg');
                if (pImg) pImg.style.opacity = '1';
            }
        });
    }

    let watchedVideosCount = (user.subscribedVideos && user.subscribedVideos.length) || 0;

    let examsCount = 0;

    let avgGrade = 0;

    try {

        const res = await fetch(`${API_URL}/api/exams/student/${user._id}/results`);

        const data = await res.json();

        if (data.success && data.results && data.results.length > 0) {

            examsCount = data.results.length;

            const totalPercentage = data.results.reduce((sum, r) => sum + (r.percentage || 0), 0);

            avgGrade = Math.round(totalPercentage / examsCount);

        }

    } catch (err) {

        console.error('Error loading stats:', err);

    }

    const vCountEl = document.getElementById('v-count');

    const eCountEl = document.getElementById('e-count');

    const gCountEl = document.getElementById('g-count');

    if (vCountEl) vCountEl.setAttribute('data-target', watchedVideosCount);

    if (eCountEl) eCountEl.setAttribute('data-target', examsCount);

    if (gCountEl) gCountEl.setAttribute('data-target', avgGrade);

    runCircularProgress();

}

// ==========================================
// Student Attendance QR Actions
// ==========================================

window.downloadStudentQR = async function () {
    const qrImg = document.getElementById('student-qr-img') || document.getElementById('student-qr-img-tab');
    if (!qrImg || !qrImg.src) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('تنبيه', 'رمز QR غير متوفر حالياً، يرجى إعادة تحميل الصفحة.', 'warning');
        } else {
            alert('رمز QR غير متوفر حالياً');
        }
        return;
    }

    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch(e) {}
    const studentName = user.username || user.firstName || 'student';

    try {
        // Fetch image as blob for direct download
        const response = await fetch(qrImg.src);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = `EDGE-QR-${studentName}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(blobUrl);

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'تم تنزيل كارت الحضور! ✅',
                text: 'تم حفظ رمز QR بنجاح على جهازك لتسجيل حضورك في الحصص والسنتر.',
                timer: 2500,
                showConfirmButton: false
            });
        }
    } catch (err) {
        // Fallback: Open in new tab for direct save
        const a = document.createElement('a');
        a.href = qrImg.src;
        a.target = '_blank';
        a.download = `EDGE-QR-${studentName}.png`;
        a.click();
    }
};

window.openQRModal = function () {
    const modal = document.getElementById('qrEnlargeModal');
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.closeQRModal = function () {
    const modal = document.getElementById('qrEnlargeModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

function runCircularProgress() {

    const items = document.querySelectorAll('.stat-progress-item');

    const circumference = 283;

    items.forEach(item => {

        const counter = item.querySelector('.counter');

        const circle = item.querySelector('.progress');

        const target = +counter.getAttribute('data-target');

        let count = 0;

        const updateNum = () => {

            const inc = target / 40;

            if (count < target) {

                count += inc;

                counter.innerText = Math.ceil(count);

                setTimeout(updateNum, 35);

            } else { counter.innerText = target; }

        };

        updateNum();

        let max = 100;

        if (item.querySelector('.blue')) max = 40;

        if (item.querySelector('.pink')) max = 20;

        const offset = circumference - (target / max) * circumference;

        circle.style.strokeDashoffset = isNaN(offset) ? circumference : offset;

    });

}

window.switchTab = function (tabId, element) {

    document.querySelectorAll('.profile-pane').forEach(p => {

        p.classList.remove('active');

        p.style.display = 'none';

    });

    document.querySelectorAll('.side-item').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(tabId);

    if (target) {

        target.style.display = 'block';

        setTimeout(() => target.classList.add('active'), 10);

        if (tabId === 'tab-user') runCircularProgress();

        if (tabId === 'tab-teachers') renderFollowedTeachers();

        if (tabId === 'tab-my-courses') renderSubscribedVideos();

        if (tabId === 'tab-results') loadStudentResults();

    }

    if (element) element.classList.add('active');

};

document.addEventListener('DOMContentLoaded', () => {

    // Only initialise the protected profile when its own panes exist.
    if (document.querySelector('.profile-pane')) {

        loadFullProfile();

        const activeSide = document.querySelector('.side-item.active');

        if (activeSide) switchTab('tab-user', activeSide);

    }

});

// ==========================================

// 14. Exam Results Dashboard

// ==========================================

let _studentExamResults = [];

async function loadStudentResults() {

    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!user) return;

    const subSel = document.getElementById('resSub');

    const teachSel = document.getElementById('resTeach');

    const tbody = document.getElementById('student-results-tbody');

    const wrapper = document.getElementById('student-results-table-wrapper');

    const emptyState = document.getElementById('student-results-empty');

    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--gray);">جاري تحميل ورقة النتائج...</td></tr>';

    if (wrapper) wrapper.style.display = 'block';

    if (emptyState) emptyState.style.display = 'none';

    try {

        const res = await fetch(`${API_URL}/api/exams/student/${user._id}/results`);

        const d = await res.json();

        if (d.success && d.results.length > 0) {

            _studentExamResults = d.results;

            if (subSel && subSel.options.length <= 1) {

                subSel.innerHTML = '<option value="">كل المواد الدراسية</option>';

                const uniqueSubjects = [...new Set(d.results.map(r => r.subject).filter(Boolean))];

                uniqueSubjects.forEach(s => subSel.innerHTML += `<option value="${s}">${s}</option>`);

            }

            if (teachSel && teachSel.options.length <= 1) {

                teachSel.innerHTML = '<option value="">كل المعلمين</option>';

                const uniqueTeachers = [...new Set(d.results.map(r => r.teacherName).filter(Boolean))];

                uniqueTeachers.forEach(t => teachSel.innerHTML += `<option value="${t}">${t}</option>`);

            }

            filterStudentResults();

        } else {

            if (wrapper) wrapper.style.display = 'none';

            if (emptyState) {

                emptyState.style.display = 'block';

                emptyState.querySelector('p').textContent = 'لم تقم بإجراء أي امتحانات حتى الآن على المنصة';

            }

        }

    } catch (err) {

        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red; padding:20px;">خطأ في استدعاء النتائج من الخادم</td></tr>';

    }

}

window.filterStudentResults = function () {

    const sub = document.getElementById('resSub').value;

    const teach = document.getElementById('resTeach').value;

    const tbody = document.getElementById('student-results-tbody');

    const wrapper = document.getElementById('student-results-table-wrapper');

    const emptyState = document.getElementById('student-results-empty');

    if (!tbody) return;

    let filtered = [..._studentExamResults];

    if (sub) filtered = filtered.filter(r => r.subject === sub);

    if (teach) filtered = filtered.filter(r => r.teacherName === teach);

    if (filtered.length === 0) {

        if (wrapper) wrapper.style.display = 'none';

        if (emptyState) {

            emptyState.style.display = 'block';

            emptyState.querySelector('p').textContent = 'لا توجد نتائج مطابقة للمادة أو المدرس المختارين';

        }

        return;

    }

    if (wrapper) wrapper.style.display = 'block';

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(r => {

        const statusText = r.isGraded ? 'تم التصحيح ✓' : '⏳ قيد مراجعة المقالي';

        const statusColor = r.isGraded ? 'var(--primary-green)' : '#dda852';

        return `

            <tr>

                <td style="font-weight:700; color:var(--text-dark);">${r.examTitle}</td>

                <td>${r.subject || 'â€”'}</td>

                <td>${r.teacherName || 'â€”'}</td>

                <td style="font-weight:700;">${r.score} / ${r.totalMarks}</td>

                <td>

                    <span style="color:${r.percentage >= 50 ? 'var(--primary-green)' : '#ff6b6b'}; font-weight:800;">

                        ${r.percentage}%

                    </span>

                </td>

                <td style="color:${statusColor}; font-weight:700;">${statusText}</td>

                <td>${new Date(r.submittedAt).toLocaleDateString('ar-EG')}</td>

            </tr>

        `;

    }).join('');

};

async function renderFollowedTeachers() {

    const container = document.getElementById('tab-teachers');

    if (!container) return;

    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!user || !user.followedTeachers || user.followedTeachers.length === 0) {

        container.innerHTML = `

            <div class="glass-section-title"><h3>المدرسين المتابعين</h3></div>

            <div class="empty-state-royal"><i class="fas fa-users-viewfinder"></i><p>لا تتابع أي مدرس حالياً.</p></div>`;

        return;

    }

    try {

        const res = await fetch(`${API_URL}/api/teachers`);

        const allTeachers = await res.json();

        const followed = allTeachers.filter(t => user.followedTeachers.includes(t._id));

        if (followed.length === 0) {

            container.innerHTML = `

                <div class="glass-section-title"><h3>المدرسين المتابعين</h3></div>

                <div class="empty-state-royal"><i class="fas fa-users-viewfinder"></i><p>لا تتابع أي مدرس حالياً.</p></div>`;

            return;

        }

        let html = '<div class="glass-section-title"><h3>المدرسين المتابعين</h3></div>';

        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; margin-top: 20px;">';

        followed.forEach(teacher => {

            html += `

                <div class="teacher-card" style="width: 100%; box-sizing: border-box; background: var(--p-bg); border: 1px solid var(--p-border);">

                    <div class="teacher-avatar-container" style="width: 110px; height: 110px; margin: 0 auto 15px;">

                        <div class="teacher-avatar" style="width: 110px; height: 110px;">

                            <img src="${teacher.imagePath || 'imges/1.png'}" alt="${teacher.name}" style="width: 100%; height: 100%; border-radius: 50%;">

                        </div>

                    </div>

                    <h3 class="teacher-name">${teacher.name}</h3>

                    <p class="teacher-subject">${teacher.subjectAr}</p>

                    <button class="teacher-btn" onclick="goToTeacherPage('${teacher._id}')" style="margin-top: 10px; width: 100%;">تصفح البروفايل</button>

                </div>`;

        });

        html += '</div>';

        container.innerHTML = html;

    } catch (err) {

        console.error(err);

    }

}

async function renderSubscribedVideos() {

    const container = document.getElementById('tab-my-courses');

    if (!container) return;

    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!user || !user.subscribedVideos || user.subscribedVideos.length === 0) {

        container.innerHTML = `

            <div class="glass-section-title"><h3>مكتبة كورساتي</h3></div>

            <div class="empty-state-royal"><i class="fas fa-graduation-cap"></i><p>لا توجد كورسات مشتراة حالياً.</p></div>`;

        return;

    }

    try {

        const res = await fetch(`${API_URL}/api/videos`);

        const allVideos = await res.json();

        const subscribed = allVideos.filter(v => user.subscribedVideos.includes(v._id));

        if (subscribed.length === 0) {

            container.innerHTML = `

                <div class="glass-section-title"><h3>مكتبة كورساتي</h3></div>

                <div class="empty-state-royal"><i class="fas fa-graduation-cap"></i><p>لا توجد كورسات مشتراة حالياً.</p></div>`;

            return;

        }

        let html = '<div class="glass-section-title"><h3>مكتبة كورساتي</h3></div>';

        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; margin-top: 20px;">';

        subscribed.forEach(video => {

            html += `

                <div class="course-card" style="width: 100%; box-sizing: border-box; background: var(--p-bg); border: 1px solid var(--p-border);">

                    <img src="${resolveImg(video.imagePath) || 'imges/st.jpg'}" class="course-thumb" alt="${video.title}" onerror="this.onerror=null;this.src='imges/st.jpg'">

                    <div class="course-body" style="padding: 15px;">

                        <h3 class="course-title" style="font-size: 1rem; margin-bottom: 10px;">${video.title}</h3>

                        <button class="btn-join" onclick="watchVideo('${video._id}')" style="width: 100%; margin-top: 10px;">مشاهدة المحاضرة !</button>

                    </div>

                </div>`;

        });

        html += '</div>';

        container.innerHTML = html;

    } catch (err) {

        console.error(err);

    }

}

// ==========================================

// 15. Codes Management (Admin Code Generator)

// ==========================================

function handleGenerateCodes(event) {

    event.preventDefault();

    const form = event.target;

    const videoIndex = form.querySelector('select').value;

    const count = parseInt(form.querySelector('input[name="count"]').value);

    const value = parseInt(form.querySelector('input[name="price"]').value);

    if (!videoIndex) {

        alert('❌ يرجى اختيار فيديو');

        return;

    }

    const selectedVideo = videos.find(v => v._id === videoIndex);

    const videoTitle = selectedVideo ? selectedVideo.title : 'فيديو';

    fetch(`${API_URL}/api/codes/generate`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ videoId: videoIndex, videoTitle, count, value })

    }).then(res => res.json())

        .then(data => {

            if (data.success) {

                alert('✅ تم توليد ' + data.codes.length + ' أكواد بنجاح!');

                form.reset();

                loadDataFromDB().then(() => {

                    displayCodes();

                    exportCodes(videoIndex);

                });

            } else {

                alert('✅ تم توليد ' + data.codes.length + ' أكواد بنجاح!');

            }

        })

        .catch(err => {

            alert('❌ خطأ في الاتصال بقاعدة البيانات');

            console.error(err);

        });

}

function toggleCode(codeId) {

    const code = codes.find(c => c._id === codeId);

    if (!code) return;

    fetch(`${API_URL}/api/codes/${codeId}`, {

        method: 'PUT',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ used: !code.used })

    }).then(res => res.json())

        .then(data => {

            if (data.success) {

                loadDataFromDB().then(() => displayCodes());

            } else {

                alert('❌ خطأ: ' + data.message);

            }

        })

        .catch(err => console.error(err));

}

function deleteCode(codeId) {

    if (!confirm('هل أنت متأكد من حذف هذا الكود؟')) return;

    fetch(`${API_URL}/api/codes/${codeId}`, {

        method: 'DELETE'

    }).then(res => res.json())

        .then(data => {

            if (data.success) {

                loadDataFromDB().then(() => displayCodes());

            } else {

                alert('❌ خطأ: ' + data.message);

            }

        })

        .catch(err => console.error(err));

}

function clearAllCodes() {

    if (!confirm('هل أنت متأكد من مسح جميع الأكواد؟')) return;

    fetch(`${API_URL}/api/codes`, {

        method: 'DELETE'

    }).then(res => res.json())

        .then(data => {

            if (data.success) {

                loadDataFromDB().then(() => {

                    displayCodes();

                    alert('✅ تم مسح جميع الأكواد');

                });

            }

        })

        .catch(err => console.error(err));

}

function displayCodes() {

    const codesList = document.getElementById('codes-list');

    if (!codesList) return;

    codesList.innerHTML = '<h3 id="codes">الأكواد <button onclick="clearAllCodes()" style="float:right; font-size:0.8rem;">مسح جميع الأكواد</button></h3>';

    const activated = codes.filter(c => c.used || c.views > 0);

    const notActivated = codes.filter(c => !(c.used || c.views > 0));

    if (activated.length > 0) {

        codesList.innerHTML += '<h4>الأكواد المفعلة</h4>';

        activated.forEach(c => {

            codesList.innerHTML += `<div class="code-item">

                <div class="code-field">

                    <label>الكود:</label>

                    <input type="text" value="${c.code}" readonly>

                </div>

                <div class="code-field">

                    <label>القيمة:</label>

                    <input type="text" value="${c.value} جنيه" readonly>

                </div>

                <div class="code-field">

                    <label>المشاهدات:</label>

                    <input type="text" value="${c.views}/1" readonly>

                </div>

                <div class="code-field">

                    <label>الفيديو:</label>

                    <input type="text" value="${c.videoTitle}" readonly>

                </div>

                <div class="code-field">

                    <label>الإجراءات:</label>

                    <button onclick="toggleCode('${c._id}')">إلغاء التفعيل</button>

                    <button onclick="deleteCode('${c._id}')">حذف</button>

                </div>

            </div>`;

        });

    }

    if (notActivated.length > 0) {

        codesList.innerHTML += '<h4>الأكواد غير المفعلة</h4>';

        notActivated.forEach(c => {

            codesList.innerHTML += `<div class="code-item">

                <div class="code-field">

                    <label>الكود:</label>

                    <input type="text" value="${c.code}" readonly>

                </div>

                <div class="code-field">

                    <label>القيمة:</label>

                    <input type="text" value="${c.value} جنيه" readonly>

                </div>

                <div class="code-field">

                    <label>الفيديو:</label>

                    <input type="text" value="${c.videoTitle}" readonly>

                </div>

                <div class="code-field">

                    <label>الإجراءات:</label>

                    <button onclick="toggleCode('${c._id}')">تفعيل</button>

                    <button onclick="deleteCode('${c._id}')">حذف</button>

                </div>

            </div>`;

        });

    }

    if (activated.length === 0 && notActivated.length === 0) {

        codesList.innerHTML += '<p>لا توجد أكواد.</p>';

    }

}

function exportCodes(videoId) {

    const videoCodes = codes.filter(c => c.videoId === videoId);

    if (!videoCodes || videoCodes.length === 0) {

        alert("لا توجد أكواد لهذا الفيديو لتصديرها.");

        return;

    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";

    csvContent += "الكود,القيمة,الفيديو,الحالة,المشاهدات\n";

    videoCodes.forEach(c => {

        const status = c.used ? "مستعمل" : "غير مستعمل";

        csvContent += `${c.code},${c.value},"${c.videoTitle}",${status},${c.views}/1\n`;

    });

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");

    link.setAttribute("href", encodedUri);

    link.setAttribute("download", `codes_${Date.now()}.csv`);

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

}

function setPrice(videoId) {

    const video = videos.find(v => v._id === videoId);

    if (video) {

        const prEl = document.getElementById('code-price');

        if (prEl) prEl.value = video.price;

    }

}

function populateVideoSelect() {

    const select = document.querySelector('#generate-codes select');

    if (!select) return;

    select.innerHTML = '<option value="">-- اختر فيديو --</option>';

    videos.forEach(v => {

        select.innerHTML += `<option value="${v._id}">${v.title}</option>`;

    });

}

function checkCenterCode() {

    const codeInput = document.getElementById('centerCode');

    const preview = document.getElementById('codePreview');

    if (!codeInput || !preview) return;

    const codeStr = codeInput.value.trim().toUpperCase();

    if (!codeStr) { alert('❌ يرجى إدخال الكود'); return; }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) { alert('❌ يجب تسجيل الدخول أولاً'); window.location.href = 'login'; window.location.href = 'login'; return; }

    fetch(`${API_URL}/api/codes/verify`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ codeStr, videoId: null, studentId: currentUser._id })

    })

        .then(res => res.json())

        .then(data => {

            if (data.success) {

                const code = data.code;

                preview.style.display = 'block';

                preview.innerHTML = `

                <div style="padding: 16px;">

                    <h4 style="color: var(--primary-green); margin-bottom: 8px;">✅ كود صحيح!</h4>

                    <p><strong>الفيديو:</strong> ${code.videoTitle || 'â€”'}</p>

                    <p><strong>المشاهدات المتبقية:</strong> ${1 - (code.views || 0)} / 1</p>

                    <p><strong>القيمة:</strong> ${code.value || 0} ج.م</p>

                    <button onclick="window.location.href = 'watch?videoId=${code.videoId}&code=${code.code}'" 

                            class="btn-fill" style="margin-top: 12px; width: 100%;">

                        مشاهدة الفيديو الآن

                    </button>

                </div>`;

            } else {

                preview.style.display = 'block';

                preview.innerHTML = `<p style="color:red; padding:16px;">âŒ ${data.message || 'كود غير صحيح'}</p>`;

            }

        })

        .catch(() => {

            preview.style.display = 'block';

            preview.innerHTML = '<p style="color:red; padding:16px;">âŒ خطأ في الاتصال بالسيرفر</p>';

        });

}

// ==========================================

// 16. Utility UI elements

// ==========================================

function showWelcomeNotification(name) {

    if (!document.getElementById('welcomeToastStyles')) {

        const style = document.createElement('style');

        style.id = 'welcomeToastStyles';

        style.textContent = `

            @keyframes slideInLeft {

                from { transform: translateX(-120%); opacity: 0; }

                to { transform: translateX(0); opacity: 1; }

            }

            @keyframes fadeOutToast {

                from { opacity: 1; transform: translateX(0); }

                to { opacity: 0; transform: translateX(-40px); }

            }

            .welcome-notification-toast {

                position: fixed;

                bottom: 24px;

                left: 24px;

                background: #13201c;

                border: 2px solid #dda852;

                border-radius: 16px;

                padding: 16px 22px;

                color: #f7f3e8;

                display: flex;

                align-items: center;

                gap: 14px;

                box-shadow: 0 10px 35px rgba(0,0,0,0.35);

                z-index: 10001;

                backdrop-filter: blur(10px);

                animation: slideInLeft 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;

                font-family: 'Cairo', sans-serif;

                direction: rtl;

                max-width: 360px;

            }

            .welcome-notification-toast.fade-out {

                animation: fadeOutToast 0.6s ease forwards;

            }

            .welcome-toast-icon {

                font-size: 1.8rem;

                animation: waveHand 1.5s ease infinite;

                transform-origin: 70% 70%;

            }

            @keyframes waveHand {

                0%, 100% { transform: rotate(0deg); }

                50% { transform: rotate(15deg); }

            }

            .welcome-toast-content h4 {

                margin: 0 0 4px;

                font-size: 1rem;

                font-weight: 800;

                color: #dda852;

            }

            .welcome-toast-content p {

                margin: 0;

                font-size: 0.82rem;

                color: rgba(247, 243, 232, 0.8);

                font-weight: 500;

            }

        `;

        document.head.appendChild(style);

    }

    const toast = document.createElement('div');

    toast.className = 'welcome-notification-toast';

    toast.innerHTML = `

        <div class="welcome-toast-icon">👋</div>

        <div class="welcome-toast-content">

            <h4>أهلاً بك مجدداً، ${name}!</h4>

            <p>جاهز لمتابعة مسيرة التفوّق اليوم؟ نتمنى لك دراسة ممتعة وموفقة.</p>

        </div>

    `;

    document.body.appendChild(toast);

    setTimeout(() => {

        toast.classList.add('fade-out');

        setTimeout(() => { toast.remove(); }, 600);

    }, 5500);

}

function showMobileDeviceSuggestion() {

    if (window.innerWidth > 768 || sessionStorage.getItem('dismissedMobileSuggestion') === 'true') {

        return;

    }

    const banner = document.createElement('div');

    banner.id = 'mobileSuggestionBanner';

    banner.style.cssText = `

        position: fixed;

        bottom: 85px;

        left: 5%;

        right: 5%;

        background: rgba(19, 32, 28, 0.96);

        border: 2px solid #dda852;

        border-radius: 16px;

        padding: 16px 20px;

        color: #f7f3e8;

        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 12px;

        box-shadow: 0 10px 30px rgba(0,0,0,0.35);

        z-index: 99999;

        backdrop-filter: blur(10px);

        direction: rtl;

        font-family: 'Cairo', sans-serif;

        animation: slideUpSuggestion 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards;

    `;

    if (!document.getElementById('mobileSuggestionStyles')) {

        const style = document.createElement('style');

        style.id = 'mobileSuggestionStyles';

        style.textContent = `@keyframes slideUpSuggestion { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;

        document.head.appendChild(style);

    }

    banner.innerHTML = `

        <div style="display: flex; align-items: center; gap: 10px; flex: 1;">

            <span style="font-size: 1.5rem;">💻</span>

            <p style="margin: 0; font-size: 0.88rem; font-weight: 700; line-height: 1.5; text-align: right;">

                لتجربة تعليمية أفضل، يرجى فتح المنصة على لابتوب أو كمبيوتر أو ايباد (تابلت).

            </p>

        </div>

        <button onclick="dismissMobileSuggestion()" style="background: none; border: none; color: #dda852; font-size: 1.2rem; cursor: pointer; padding: 4px 8px; font-weight: bold; line-height: 1;">✖</button>

    `;

    document.body.appendChild(banner);

    window.dismissMobileSuggestion = () => {

        const element = document.getElementById('mobileSuggestionBanner');

        if (element) {

            element.style.transition = 'all 0.3s ease';

            element.style.opacity = '0';

            element.style.transform = 'translateY(20px)';

            setTimeout(() => element.remove(), 300);

        }

        sessionStorage.setItem('dismissedMobileSuggestion', 'true');

    };

}

window.toggleUserMenu = () => {

    const userMenu = document.getElementById('userMenu');

    if (userMenu) userMenu.classList.toggle('show');

};

window.toggleMobileMenu = () => {

    const mobileMenu = document.getElementById('mobileNavMenu');

    if (mobileMenu) {

        mobileMenu.classList.toggle('active');

        const icon = document.querySelector('.hamburger-btn i');

        if (icon) {

            icon.className = mobileMenu.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';

        }

    }

};

// تحديث قائمة الموبايل بحسب حالة تسجيل الدخول

function updateMobileMenuAuth() {

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    const guestSection = document.getElementById('mobileAuthGuest');

    const userSection = document.getElementById('mobileAuthUser');

    if (!guestSection || !userSection) return;

    if (currentUser) {

        guestSection.style.display = 'none';

        userSection.style.display = 'flex';

    } else {

        guestSection.style.display = 'flex';

        userSection.style.display = 'none';

    }

}

// استدعاء عند تحميل الصفحة

document.addEventListener('DOMContentLoaded', () => {

    updateMobileMenuAuth();

});

window.addEventListener('click', (e) => {

    if (!e.target.closest('#userDropdownArea')) {

        const userMenu = document.getElementById('userMenu');

        if (userMenu) userMenu.classList.remove('show');

    }

    if (!e.target.closest('.hamburger-btn') && !e.target.closest('#mobileNavMenu')) {

        const mobileMenu = document.getElementById('mobileNavMenu');

        if (mobileMenu) {

            mobileMenu.classList.remove('active');

            const icon = document.querySelector('.hamburger-btn i');

            if (icon) icon.className = 'fas fa-bars';

        }

    }

});

