const fs = require('fs');
let html = fs.readFileSync('profile.html', 'utf8');

// 1. New grouped sidebar navigation with category titles and section dividers
const oldSidebarNav = `    <nav class="sidebar-nav">
        <button class="side-item active" onclick="switchTab('tab-user', this)"><i class="fas fa-user-circle"></i> ملف المستخدم</button>
        <button class="side-item" onclick="switchTab('tab-qr-card', this)"><i class="fas fa-qrcode"></i> كارت الحضور (QR)</button>
        <button class="side-item" onclick="switchTab('tab-teachers', this)"><i class="fas fa-user-tie"></i> المدرسين</button>
        <button class="side-item" onclick="switchTab('tab-recharge', this)"><i class="fas fa-qrcode"></i> شحن كود سنتر</button>
        <button class="side-item" onclick="switchTab('tab-my-courses', this)"><i class="fas fa-graduation-cap"></i> كورساتي</button>
        <button class="side-item" onclick="switchTab('tab-invoices', this)"><i class="fas fa-file-invoice-dollar"></i> الفواتير</button>
        <button class="side-item" onclick="switchTab('tab-subs', this)"><i class="fas fa-calendar-check"></i> الاشتراكات</button>
        <button class="side-item" onclick="switchTab('tab-results', this)"><i class="fas fa-poll"></i> نتائج الامتحانات</button>
    </nav>`;

const newSidebarNav = `    <nav class="sidebar-nav">
        <!-- المجموعة 1: الحساب والبيانات -->
        <div class="sidebar-category-header">
            <span>البيانات الأساسية</span>
        </div>
        <button class="side-item active" onclick="switchTab('tab-user', this)"><i class="fas fa-user-circle"></i> ملف الطالب</button>
        <button class="side-item" onclick="switchTab('tab-qr-card', this)"><i class="fas fa-id-card"></i> كارت الحضور (QR)</button>

        <!-- المجموعة 2: التعلم والدراسة -->
        <div class="sidebar-category-header">
            <span>التعليم والمحتوى</span>
        </div>
        <button class="side-item" onclick="switchTab('tab-my-courses', this)"><i class="fas fa-graduation-cap"></i> كورساتي ومحاضراتي</button>
        <button class="side-item" onclick="switchTab('tab-results', this)"><i class="fas fa-poll"></i> نتائج الامتحانات</button>
        <button class="side-item" onclick="switchTab('tab-teachers', this)"><i class="fas fa-chalkboard-teacher"></i> المعلمون المتابعون</button>

        <!-- المجموعة 3: الرصيد والماليات -->
        <div class="sidebar-category-header">
            <span>المالية والاشتراكات</span>
        </div>
        <button class="side-item" onclick="switchTab('tab-recharge', this)"><i class="fas fa-money-bill-wave"></i> شحن كود سنتر</button>
        <button class="side-item" onclick="switchTab('tab-subs', this)"><i class="fas fa-calendar-check"></i> الاشتراكات النشطة</button>
        <button class="side-item" onclick="switchTab('tab-invoices', this)"><i class="fas fa-file-invoice-dollar"></i> سجل الفواتير</button>
    </nav>`;

if (html.includes(oldSidebarNav)) {
    html = html.replace(oldSidebarNav, newSidebarNav);
    console.log('✅ Replaced sidebar navigation with categorized sections');
} else {
    console.error('❌ Could not find oldSidebarNav block');
}

// 2. Add Category Header styles and polish layout in CSS
const categoryCss = `
        /* ── Sidebar Category Title ── */
        .sidebar-category-header {
            font-size: 0.76rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: var(--profile-muted);
            padding: 10px 14px 4px;
            margin-top: 6px;
            opacity: 0.85;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .sidebar-category-header::after {
            content: "";
            flex: 1;
            height: 1px;
            background: var(--profile-border);
            opacity: 0.6;
        }

        .sidebar-category-header:first-of-type {
            margin-top: 0;
            padding-top: 4px;
        }
`;

if (!html.includes('.sidebar-category-header')) {
    html = html.replace('.sidebar-nav {', categoryCss + '\n        .sidebar-nav {');
    console.log('✅ Added sidebar category CSS');
}

fs.writeFileSync('profile.html', html, 'utf8');
console.log('🎉 Profile layout successfully organized!');

