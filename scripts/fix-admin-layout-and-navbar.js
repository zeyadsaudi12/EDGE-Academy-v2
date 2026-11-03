const fs = require('fs');

let html = fs.readFileSync('admin.html', 'utf8');

// ========================================================
// 1. FIX LOGO & COMPLETE NAVBAR IN admin.html
// ========================================================
const oldNavInner = `            <div class="masar-nav-inner">
                <!-- Logo & Menu toggle -->
                <div class="masar-logo">
                    <button class="sidebar-toggle-btn" onclick="toggleSidebar()" aria-label="فتح القائمة">
                        <i class="ti ti-menu-2"></i>
                    </button>
                    <span class="masar-badge">أدمن</span>
                </div>

                <!-- Center Links -->
                <div class="masar-nav-links">
                    <a href="/" class="masar-link" target="_blank">
                        <i class="ti ti-home"></i> الرئيسية
                    </a>
                    <a href="teachers" class="masar-link" target="_blank">
                        <i class="ti ti-users"></i> المعلمين
                    </a>
                </div>`;

const newNavInner = `            <div class="masar-nav-inner">
                <!-- Logo & Menu toggle -->
                <div class="masar-logo" style="display:flex; align-items:center; gap:12px;">
                    <button class="sidebar-toggle-btn" onclick="toggleSidebar()" aria-label="فتح القائمة">
                        <i class="ti ti-menu-2"></i>
                    </button>
                    <a href="/" target="_blank" style="display:inline-flex; align-items:center; gap:8px; text-decoration:none;">
                        <img src="imges/logo-dark-mode.png" alt="EDGE Academy" class="admin-nav-logo-dark" style="height:32px; width:auto; display:block;">
                        <img src="imges/logo-light-mode.png" alt="EDGE Academy" class="admin-nav-logo-light" style="height:32px; width:auto; display:none;">
                    </a>
                    <span class="masar-badge">👑 لوحة الإدارة</span>
                </div>

                <!-- Center Links (جميع أقسام المنصة) -->
                <div class="masar-nav-links">
                    <a href="/" class="masar-link" target="_blank">
                        <i class="ti ti-home"></i> الرئيسية
                    </a>
                    <a href="teachers" class="masar-link" target="_blank">
                        <i class="ti ti-school"></i> المعلمين
                    </a>
                    <a href="subjects" class="masar-link" target="_blank">
                        <i class="ti ti-book"></i> المواد الدراسية
                    </a>
                    <a href="courses" class="masar-link" target="_blank">
                        <i class="ti ti-video"></i> الكورسات
                    </a>
                    <a href="exams" class="masar-link" target="_blank">
                        <i class="ti ti-file-text"></i> الامتحانات
                    </a>
                    <a href="play-study" class="masar-link play-study-admin-link" target="_blank" style="color:#f59e0b; font-weight:800; background:rgba(245,158,11,0.1); border-radius:8px; padding:6px 12px;">
                        <i class="ti ti-device-gamepad"></i> Play & Study
                    </a>
                </div>`;

if (html.includes(oldNavInner)) {
    html = html.replace(oldNavInner, newNavInner);
    console.log('✅ Replaced navbar with full brand logo and all platform links in admin.html');
} else {
    console.log('⚠️ oldNavInner exact match not found, checking alternatives...');
}

// 1.1 Add CSS rule for logo in light/dark mode
if (!html.includes('.admin-nav-logo-dark')) {
    html = html.replace(
        '/* ===== MASAR NAVBAR ===== */',
        `/* Logo theme switching in admin navbar */
        body.light-mode .admin-nav-logo-dark { display: none !important; }
        body.light-mode .admin-nav-logo-light { display: block !important; }

        /* ===== MASAR NAVBAR ===== */`
    );
    console.log('✅ Added logo dark/light theme switching CSS to admin.html');
}

// ========================================================
// 2. MOVE </div><!-- /content --> TO AFTER section-play-study
// ========================================================
// Remove the premature </div><!-- /content -->
if (html.includes('</div><!-- /content -->')) {
    html = html.replace('</div><!-- /content -->', '');
    console.log('✅ Removed premature </div><!-- /content -->');
}

// Replace section-play-study with standard table-card structure and close content before </main>
const oldSectionPlayStudyRegex = /<!-- ===== PLAY & STUDY ADMIN MANAGEMENT SECTION ===== -->[\s\S]*?<\/div>\s*<\/main>/;

const newSectionPlayStudy = `<!-- ===== PLAY & STUDY ADMIN MANAGEMENT SECTION ===== -->
                <div id="section-play-study" class="section">
                    <div class="table-card">
                        <div class="table-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                            <div>
                                <h3 style="display:flex; align-items:center; gap:8px;">
                                    <i class="ti ti-device-gamepad" style="color:var(--accent);"></i> لوحة تحكم ومراقبة Play & Study
                                </h3>
                                <p>مراقبة محاولات ونقاط الطلاب، التصدي لمحاولات الغش، إيقاف اللعبة وحظر الطلاب المخالفين، وتعديل النقاط ورصيد الطاقة.</p>
                            </div>
                            <div>
                                <button onclick="loadAdminPlayStudy()" class="btn-primary" style="background:#1a6bdb; display:inline-flex; align-items:center; gap:8px; padding:9px 18px;">
                                    <i class="ti ti-refresh"></i> تحديث السجلات
                                </button>
                            </div>
                        </div>

                        <!-- Search & Filter Bar -->
                        <div class="table-toolbar" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; padding:14px 20px;">
                            <div class="search-wrapper" style="flex:1; min-width:240px; position:relative;">
                                <i class="ti ti-search" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); color:var(--txt3);"></i>
                                <input type="text" class="search-input" id="playstudy-search-input" placeholder="ابحث باسم الطالب أو رقم الهاتف..." oninput="filterAdminPlayStudy()" style="padding-right:38px; width:100%;">
                            </div>
                            <select class="filter-select" id="playstudy-filter-status" onchange="filterAdminPlayStudy()" style="min-width:180px; font-weight:700;">
                                <option value="ALL">جميع الحالات</option>
                                <option value="ACTIVE">النشطون فقط</option>
                                <option value="BANNED">المحظورون بسبب الغش</option>
                            </select>
                        </div>

                        <!-- Players Table -->
                        <table style="width:100%; border-collapse:collapse; text-align:right;">
                            <thead>
                                <tr>
                                    <th style="padding:14px 18px;">الطالب</th>
                                    <th style="padding:14px 18px;">المرحلة الدراسية</th>
                                    <th style="padding:14px 18px;">رصيد النقاط</th>
                                    <th style="padding:14px 18px;">طاقة اليوم</th>
                                    <th style="padding:14px 18px;">الفوز الكامل</th>
                                    <th style="padding:14px 18px;">الحالة والتحكم</th>
                                    <th style="padding:14px 18px; text-align:center;">إجراءات الإدارة</th>
                                </tr>
                            </thead>
                            <tbody id="playstudy-players-tbody">
                                <tr>
                                    <td colspan="7" style="text-align:center; padding:35px; color:var(--txt3);">
                                        <i class="ti ti-loader fa-spin"></i> جاري تحميل بيانات الطلاب...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div><!-- /content -->
        </main>`;

if (oldSectionPlayStudyRegex.test(html)) {
    html = html.replace(oldSectionPlayStudyRegex, newSectionPlayStudy);
    console.log('✅ Placed section-play-study cleanly inside .content and closed before </main>');
} else {
    console.log('❌ Could not match oldSectionPlayStudyRegex in admin.html');
}

fs.writeFileSync('admin.html', html, 'utf8');
console.log('🎉 Done updating admin.html!');

