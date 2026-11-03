const fs = require('fs');

// ========================================================
// 1. UPDATE style.css WITH POLISHED NAVBAR RULES
// ========================================================
let css = fs.readFileSync('style.css', 'utf8');

const oldNavRules = `.nav-link-item {
    color: var(--text-dark);
    text-decoration: none;
    font-weight: 700;
    font-size: 1rem;
    padding: 10px 20px;
    border-radius: 999px;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    white-space: nowrap;
}`;

const newNavRules = `.nav-link-item {
    color: var(--text-dark);
    text-decoration: none;
    font-weight: 700;
    font-size: 0.94rem;
    padding: 8px 15px;
    border-radius: 999px;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    white-space: nowrap;
}

/* زر Play & Study المميز والمصقول في النافبار */
.nav-link-item.play-study-nav-btn {
    color: #d97706 !important;
    background: rgba(245, 158, 11, 0.08) !important;
    border: 1px solid rgba(245, 158, 11, 0.22) !important;
    font-weight: 800 !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    padding: 7px 14px !important;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.08) !important;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.nav-link-item.play-study-nav-btn:hover {
    color: #b45309 !important;
    background: rgba(245, 158, 11, 0.16) !important;
    border-color: rgba(245, 158, 11, 0.4) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.18) !important;
}

.nav-link-item.play-study-nav-btn.active {
    background: linear-gradient(135deg, #f59e0b, #10b981) !important;
    color: #ffffff !important;
    border-color: transparent !important;
    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35) !important;
}

.dark-mode .nav-link-item.play-study-nav-btn {
    color: #fbbf24 !important;
    background: rgba(245, 158, 11, 0.14) !important;
    border-color: rgba(245, 158, 11, 0.28) !important;
}

.dark-mode .nav-link-item.play-study-nav-btn:hover {
    color: #fde68a !important;
    background: rgba(245, 158, 11, 0.24) !important;
    border-color: rgba(245, 158, 11, 0.48) !important;
}

.dark-mode .nav-link-item.play-study-nav-btn.active {
    background: linear-gradient(135deg, #d97706, #059669) !important;
    color: #ffffff !important;
    border-color: transparent !important;
}

.mobile-nav-link.play-study-nav-btn {
    color: #d97706 !important;
    background: rgba(245, 158, 11, 0.08) !important;
    border: 1px solid rgba(245, 158, 11, 0.18) !important;
    font-weight: 800 !important;
    border-radius: 12px !important;
}

.dark-mode .mobile-nav-link.play-study-nav-btn {
    color: #fbbf24 !important;
    background: rgba(245, 158, 11, 0.12) !important;
    border-color: rgba(245, 158, 11, 0.28) !important;
}`;

if (css.includes(oldNavRules)) {
    css = css.replace(oldNavRules, newNavRules);
    console.log('✅ Replaced nav rules in style.css');
} else if (!css.includes('.nav-link-item.play-study-nav-btn')) {
    // Fallback: append after .nav-link-item block
    css = css.replace(
        '.nav-link-item {',
        `.nav-link-item {\n    font-size: 0.94rem;\n    padding: 8px 15px;`
    );
    css += '\n\n' + newNavRules;
    console.log('✅ Injected play-study nav rules in style.css');
}

// Intermediate screen size styling (1051px - 1260px)
const intermediateQuery = `
/* تكييف النافبار للشاشات المتوسطة واللابتوب (1051px - 1260px) */
@media (min-width: 1051px) and (max-width: 1260px) {
    .header-inner {
        padding: 8px 18px !important;
        gap: 10px !important;
    }
    .header-center {
        gap: 3px !important;
    }
    .nav-link-item {
        padding: 6px 11px !important;
        font-size: 0.88rem !important;
    }
    .admin-portal-nav-btn,
    .nav-link-item.play-study-nav-btn {
        padding: 5px 10px !important;
        font-size: 0.84rem !important;
    }
    .header-brand .logo-img {
        max-width: 120px !important;
    }
    .header-actions .btn-fill,
    .header-actions .btn-outline {
        padding: 8px 14px !important;
        font-size: 0.86rem !important;
    }
}
`;

if (!css.includes('/* تكييف النافبار للشاشات المتوسطة واللابتوب (1051px - 1260px) */')) {
    css += intermediateQuery;
    console.log('✅ Added intermediate desktop media query to style.css');
}

fs.writeFileSync('style.css', css, 'utf8');

// ========================================================
// 2. STANDARDIZE HTML PAGES
// ========================================================
const standardPages = [
    { file: 'index.html', active: 'home' },
    { file: 'teachers.html', active: 'teachers' },
    { file: 'subjects.html', active: 'subjects' },
    { file: 'courses.html', active: 'courses' },
    { file: 'exams.html', active: 'exams' },
    { file: 'play-study.html', active: 'play-study' },
    { file: 'course-view.html', active: 'courses' },
    { file: 'teacher-profile.html', active: 'teachers' },
    { file: 'profile.html', active: 'profile' }
];

function buildHeaderCenter(activeKey) {
    return `        <!-- المنتصف: روابط التنقل -->
        <div class="header-center">
            <a href="/" class="nav-link-item${activeKey === 'home' ? ' active' : ''}">الرئيسية</a>
            <a href="teachers" class="nav-link-item${activeKey === 'teachers' ? ' active' : ''}">المعلمين</a>
            <a href="subjects" class="nav-link-item${activeKey === 'subjects' ? ' active' : ''}">المواد الدراسية</a>
            <a href="courses" class="nav-link-item${activeKey === 'courses' ? ' active' : ''}">الكورسات</a>
            <a href="exams" class="nav-link-item${activeKey === 'exams' ? ' active' : ''}">الامتحانات</a>
            <a href="play-study" class="nav-link-item play-study-nav-btn${activeKey === 'play-study' ? ' active' : ''}">🎮 Play & Study</a>
            <!-- زر لوحة تحكم الأدمن (يظهر فقط إذا كان المستخدم مسجل كـ Admin) -->
            <a href="admin" class="nav-link-item admin-portal-nav-btn" id="adminPortalNavBtn" style="display: none;">
                <i class="fas fa-crown"></i> صفحة الادمن
            </a>
        </div>`;
}

function buildMobileNav(activeKey) {
    return `    <!-- قائمة الموبايل المنسدلة -->
    <div class="mobile-nav-menu" id="mobileNavMenu">
        <a href="admin" class="mobile-nav-link" id="mobileAdminLink" style="display:none; color:#e76f51; font-weight:800; background:rgba(231,111,81,0.1); border-radius:8px; margin:4px 0;">
            👑 صفحة الادمن
        </a>
        <a href="/" class="mobile-nav-link${activeKey === 'home' ? ' active' : ''}">🏠 الرئيسية</a>
        <a href="teachers" class="mobile-nav-link${activeKey === 'teachers' ? ' active' : ''}">👨‍🏫 المعلمين</a>
        <a href="subjects" class="mobile-nav-link${activeKey === 'subjects' ? ' active' : ''}">📚 المواد الدراسية</a>
        <a href="courses" class="mobile-nav-link${activeKey === 'courses' ? ' active' : ''}">🎥 الكورسات</a>
        <a href="exams" class="mobile-nav-link${activeKey === 'exams' ? ' active' : ''}">📝 الامتحانات</a>
        <a href="play-study" class="mobile-nav-link play-study-nav-btn${activeKey === 'play-study' ? ' active' : ''}">🎮 Play & Study</a>
        <div class="mobile-menu-auth" id="mobileAuthGuest">
            <a href="login" class="btn-outline" style="text-align:center;">تسجيل الدخول</a>
            <a href="register" class="btn-fill" style="text-align:center;">سجل الآن</a>
        </div>
        <div class="mobile-menu-auth" id="mobileAuthUser" style="display:none;">
            <a href="profile" class="mobile-nav-link${activeKey === 'profile' ? ' active' : ''}">👤 البروفايل</a>
            <button onclick="handleLogout()" class="mobile-nav-link" style="background:none;border:none;cursor:pointer;width:100%;text-align:right;color:var(--text-dark);font-family:inherit;">🚪 تسجيل خروج</button>
        </div>
    </div>`;
}

standardPages.forEach(({ file, active }) => {
    if (!fs.existsSync(file)) return;
    let html = fs.readFileSync(file, 'utf8');

    // 1. Replace header-center
    const centerRegex = /<!--\s*المنتصف:\s*روابط التنقل\s*-->[\s\S]*?<div class="header-center">[\s\S]*?<\/div>|<div class="header-center">[\s\S]*?<\/div>/;
    if (centerRegex.test(html)) {
        html = html.replace(centerRegex, buildHeaderCenter(active));
    }

    // 2. Replace or inject mobile-nav-menu
    const mobileRegex = /<!--\s*قائمة الموبايل المنسدلة\s*-->[\s\S]*?<div class="mobile-nav-menu"[\s\S]*?<\/div>\s*<\/div>|<div class="mobile-nav-menu" id="mobileNavMenu">[\s\S]*?<\/div>\s*<\/div>|<div class="mobile-nav-menu"[\s\S]*?<\/div>/;
    if (mobileRegex.test(html)) {
        html = html.replace(mobileRegex, buildMobileNav(active));
    } else if (file === 'play-study.html') {
        // Inject inside </header>
        html = html.replace('</header>', buildMobileNav(active) + '\n</header>');
    }

    // Special fix for play-study.html header-left and scripts
    if (file === 'play-study.html') {
        const fullHeader = `<header>
    <div class="header-inner">
        <!-- اليمين: شعار المنصة وزر تبديل اللغة بجانبه -->
        <div class="header-right">
            <a href="/" class="header-brand" aria-label="EDGE Academy الرئيسية">
                <img src="imges/logo-light-mode.png" alt="EDGE Academy" class="logo-img logo-light">
                <img src="imges/logo-dark-mode.png" alt="EDGE Academy" class="logo-img logo-dark">
            </a>
            <!-- زر تبديل اللغة بجانب اللوجو -->
            <button type="button" class="language-switcher" aria-label="تبديل اللغة" title="Switch Language">
                <span>EN</span>
                <svg class="lang-globe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
            </button>
        </div>

${buildHeaderCenter('play-study')}

        <!-- اليسار: أزرار المستخدم ومحول الأوضاع -->
        <div class="header-left">
            <!-- أزرار الزائر -->
            <nav class="header-actions" id="authActions">
                <a href="login" class="btn-outline">تسجيل الدخول</a>
                <a href="register" class="btn-fill">سجل الآن</a>
            </nav>

            <!-- قائمة الطالب عند تسجيل الدخول -->
            <div class="user-dropdown-container" id="userDropdownArea" style="display: none;">
                <button class="user-menu-btn" onclick="toggleUserMenu()">
                    <span id="navUserName">الطالب</span>
                    <div class="user-icon-circle">👤</div>
                </button>
                <div class="user-dropdown-menu" id="userMenu">
                    <a href="admin" class="menu-item" id="adminMenuLink" style="display: none; color: #e76f51; font-weight: 800; border-bottom: 1px dashed var(--border);">
                        👑 صفحة الادمن
                    </a>
                    <a href="profile" class="menu-item">👤 البروفايل</a>
                    <div class="menu-item balance-item">
                        <span>💰 الرصيد:</span>
                        <span id="userPoints">0</span> ج.م
                    </div>
                    <hr>
                    <button onclick="handleLogout()" class="menu-item logout-btn">🚪 تسجيل خروج</button>
                </div>
            </div>

            <!-- محول الأوضاع بتصميم كبسولة أنيقة (النهار / الليل) -->
            <div class="theme-capsule" aria-label="تبديل المظهر">
                <button class="icon-btn theme-switcher" data-theme="light" aria-label="وضع النهار" title="وضع النهار">☀</button>
                <button class="icon-btn theme-switcher" data-theme="dark" aria-label="وضع الظلام" title="وضع الظلام">🌙</button>
            </div>

            <!-- زر الهامبرغر للموبايل -->
            <button class="hamburger-btn" onclick="toggleMobileMenu()" aria-label="القائمة">
                <i class="fas fa-bars"></i>
            </button>
        </div>
    </div>

${buildMobileNav('play-study')}
</header>`;

        html = html.replace(/<header>[\s\S]*?<\/header>/, fullHeader);

        // Ensure script.js and disable-inspect.js are loaded
        if (!html.includes('script.js')) {
            html = html.replace(
                '</body>',
                '    <script src="script.js?v=20261031-v11" defer></script>\n    <script src="disable-inspect.js" defer></script>\n</body>'
            );
        }
    }

    fs.writeFileSync(file, html, 'utf8');
    console.log(`✅ Standardized and polished navbar in ${file}`);
});

console.log('🎉 All navbars standardized and polished successfully!');

