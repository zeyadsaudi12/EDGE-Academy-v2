const fs = require('fs');

let html = fs.readFileSync('admin.html', 'utf8');

const regex = /<div class="masar-logo">[\s\S]*?<\/div>\s*<!-- Center Links -->\s*<div class="masar-nav-links">[\s\S]*?<\/div>/;

const replacement = `<div class="masar-logo" style="display:flex; align-items:center; gap:12px;">
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

if (regex.test(html)) {
    html = html.replace(regex, replacement);
    fs.writeFileSync('admin.html', html, 'utf8');
    console.log('✅ Updated admin navbar with logo and all platform links!');
} else {
    console.error('❌ Regex did not match');
}
