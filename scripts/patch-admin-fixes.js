const fs = require('fs');

// ========================================================
// 1. PATCH admin.html
// ========================================================
let adminHtml = fs.readFileSync('admin.html', 'utf8');

// 1.1 Add 'play-study' to titles object in showSection
if (!adminHtml.includes("'play-study': ['لوحة تحكم ومراقبة Play & Study'")) {
    adminHtml = adminHtml.replace(
        "banners: ['إعلانات الهيرو', 'إدارة الصور الإعلانية على الصفحة الرئيسية'],",
        "banners: ['إعلانات الهيرو', 'إدارة الصور الإعلانية على الصفحة الرئيسية'],\n                    'play-study': ['لوحة تحكم ومراقبة Play & Study', 'مراقبة محاولات ونقاط الطلاب، التصدي لمحاولات الغش، إيقاف اللعبة وحظر الطلاب المخالفين، وتعديل النقاط ورصيد الطاقة'],"
    );
    console.log("✅ Added 'play-study' to showSection titles in admin.html");
}

// 1.2 Remove duplicate outer inline padding from section-play-study
adminHtml = adminHtml.replace(
    '<div id="section-play-study" class="section" style="padding: 28px 32px;">',
    '<div id="section-play-study" class="section">'
);
console.log('✅ Adjusted section-play-study container padding');

// 1.3 Add escapeHtml function and update fetch calls to use API variable
const oldScriptHead = `<script>
let _adminPlayStudyData = [];

async function loadAdminPlayStudy() {`;

const newScriptHead = `<script>
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

let _adminPlayStudyData = [];

async function loadAdminPlayStudy() {`;

if (!adminHtml.includes('function escapeHtml(str)')) {
    adminHtml = adminHtml.replace(oldScriptHead, newScriptHead);
    console.log('✅ Added escapeHtml definition to admin.html');
}

// 1.4 Ensure fetch calls in play-study use `${API}` if defined
adminHtml = adminHtml.replace(
    "const res = await fetch('/api/play-study/admin/players');",
    "const apiBase = typeof API !== 'undefined' ? API : '';\n        const res = await fetch(`${apiBase}/api/play-study/admin/players`);"
);
adminHtml = adminHtml.replace(
    "const res = await fetch('/api/play-study/admin/toggle-ban', {",
    "const apiBase = typeof API !== 'undefined' ? API : '';\n        const res = await fetch(`${apiBase}/api/play-study/admin/toggle-ban`, {"
);
adminHtml = adminHtml.replace(
    "const resApi = await fetch('/api/play-study/admin/adjust-points', {",
    "const apiBase = typeof API !== 'undefined' ? API : '';\n        const resApi = await fetch(`${apiBase}/api/play-study/admin/adjust-points`, {"
);
adminHtml = adminHtml.replace(
    "const resApi = await fetch('/api/play-study/admin/reset-energy', {",
    "const apiBase = typeof API !== 'undefined' ? API : '';\n        const resApi = await fetch(`${apiBase}/api/play-study/admin/reset-energy`, {"
);
console.log('✅ Standardized fetch calls to use apiBase in admin.html');

fs.writeFileSync('admin.html', adminHtml, 'utf8');

// ========================================================
// 2. PATCH controllers/playStudy.controller.js
// ========================================================
let controller = fs.readFileSync('controllers/playStudy.controller.js', 'utf8');

const oldAdminGetAll = `exports.adminGetAllPlayers = async (req, res) => {
    try {
        const records = await PlayStudy.find()
            .populate('userId', 'firstName lastName phone grade')
            .sort({ points: -1 });

        const players = records.map(r => ({
            id: r._id,
            userId: r.userId ? r.userId._id : null,
            name: r.userId ? \`\${r.userId.firstName} \${r.userId.lastName}\` : 'مستخدم محذوف',
            phone: r.userId ? r.userId.phone : '-',
            grade: r.userId ? r.userId.grade : '-',
            points: r.points,
            dailyEnergy: r.dailyEnergy,
            totalAttempts: r.totalAttempts,
            totalWins: r.totalWins,
            perfectWins: r.perfectWins,
            isBanned: r.isBanned || false,
            banReason: r.banReason || '',
            bannedAt: r.bannedAt,
            couponsCount: (r.redeemedCoupons || []).length
        }));

        res.json({ success: true, players });
    } catch (err) {
        console.error('Admin getAllPlayers error:', err);
        res.status(500).json({ success: false, message: 'تعذر جلب سجلات الطلاب' });
    }
};`;

const newAdminGetAll = `exports.adminGetAllPlayers = async (req, res) => {
    try {
        const records = await PlayStudy.find()
            .populate('userId', 'firstName lastName phone grade')
            .sort({ points: -1 })
            .lean();

        const players = records.map(r => {
            const u = r.userId;
            const fullName = u ? \`\${u.firstName || ''} \${u.lastName || ''}\`.trim() || 'طالب' : 'مستخدم محذوف';
            return {
                id: String(r._id),
                userId: u ? String(u._id) : null,
                name: fullName,
                phone: u && u.phone ? u.phone : '-',
                grade: u && u.grade ? u.grade : '-',
                points: Number(r.points) || 0,
                dailyEnergy: r.dailyEnergy !== undefined ? Number(r.dailyEnergy) : 4,
                totalAttempts: Number(r.totalAttempts) || 0,
                totalWins: Number(r.totalWins) || 0,
                perfectWins: Number(r.perfectWins) || 0,
                isBanned: Boolean(r.isBanned),
                banReason: r.banReason || '',
                bannedAt: r.bannedAt,
                couponsCount: (r.redeemedCoupons || []).length
            };
        });

        res.json({ success: true, players });
    } catch (err) {
        console.error('Admin getAllPlayers error:', err);
        res.status(500).json({ success: false, message: 'تعذر جلب سجلات الطلاب', error: err.message });
    }
};`;

if (controller.includes('exports.adminGetAllPlayers = async (req, res) => {')) {
    controller = controller.replace(oldAdminGetAll, newAdminGetAll);
    fs.writeFileSync('controllers/playStudy.controller.js', controller, 'utf8');
    console.log('✅ Updated adminGetAllPlayers controller with robust lean mappings');
}

console.log('🎉 All admin fixes applied successfully!');

