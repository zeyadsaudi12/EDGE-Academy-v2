const fs = require('fs');
let html = fs.readFileSync('profile.html', 'utf8');

const navStart = html.indexOf('<nav class="sidebar-nav">');
const navEnd = html.indexOf('</nav>', navStart);

console.log('Found nav from', navStart, 'to', navEnd);
if (navStart !== -1 && navEnd !== -1) {
    const originalNav = html.substring(navStart, navEnd + 6);
    console.log('Original nav content:\n', originalNav);

    const newNav = `<nav class="sidebar-nav">
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

    html = html.substring(0, navStart) + newNav + html.substring(navEnd + 6);
    fs.writeFileSync('profile.html', html, 'utf8');
    console.log('✅ Successfully updated nav in profile.html');
}

