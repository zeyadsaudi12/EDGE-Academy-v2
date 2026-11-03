const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

// 1. Find banners nav item and insert play-study before it
const bannerNavNeedle = `<div class="nav-group-title">الإعلانات</div>`;
const playStudyNavHtml = `<div class="nav-group-title">الأنشطة والألعاب</div>
                <button class="nav-item" onclick="showSection('play-study', this); loadAdminPlayStudy();">
                    <i class="ti ti-device-gamepad"></i>
                    إدارة Play & Study
                </button>

                <div class="nav-group-title">الإعلانات</div>`;

if (!html.includes("showSection('play-study'")) {
    html = html.replace(bannerNavNeedle, playStudyNavHtml);
    console.log('✅ Injected Play & Study nav item');
}

// 2. Find </main> and insert the section-play-study before it
const mainEndNeedle = `</main>`;
const playStudySectionHtml = `
                <!-- ===== PLAY & STUDY ADMIN MANAGEMENT SECTION ===== -->
                <div id="section-play-study" class="section" style="padding: 28px 32px;">
                    <div class="section-header" style="margin-bottom: 24px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                            <div>
                                <h2 style="font-size:1.6rem; font-weight:900; margin:0 0 6px; display:flex; align-items:center; gap:10px;">
                                    <i class="ti ti-device-gamepad" style="color:var(--accent);"></i> لوحة تحكم ومراقبة Play & Study
                                </h2>
                                <p style="margin:0; color:var(--txt2); font-size:0.92rem;">
                                    مراقبة محاولات ونقاط الطلاب، التصدي لمحاولات الغش، إيقاف اللعبة وحظر الطلاب المخالفين، وتعديل النقاط ورصيد الطاقة.
                                </p>
                            </div>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <button onclick="loadAdminPlayStudy()" class="btn-primary" style="background:#1a6bdb; display:inline-flex; align-items:center; gap:8px;">
                                    <i class="ti ti-refresh"></i> تحديث السجلات
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Search & Filter Bar -->
                    <div style="background:var(--bg2); border:1px solid var(--border2); border-radius:14px; padding:14px 18px; margin-bottom:20px; display:flex; gap:14px; align-items:center; flex-wrap:wrap;">
                        <div style="flex:1; min-width:260px; display:flex; align-items:center; gap:10px; background:var(--bg1); border:1px solid var(--border1); border-radius:10px; padding:8px 14px;">
                            <i class="ti ti-search" style="color:var(--txt3);"></i>
                            <input type="text" id="playstudy-search-input" placeholder="ابحث باسم الطالب أو رقم الهاتف..." oninput="filterAdminPlayStudy()" style="border:none; outline:none; background:transparent; width:100%; color:var(--txt1); font-family:inherit;">
                        </div>
                        <select id="playstudy-filter-status" onchange="filterAdminPlayStudy()" style="padding:9px 16px; border-radius:10px; background:var(--bg1); border:1px solid var(--border1); color:var(--txt1); font-family:inherit; font-weight:700;">
                            <option value="ALL">جميع الحالات</option>
                            <option value="ACTIVE">النشطون فقط</option>
                            <option value="BANNED">المحظورون بسبب الغش</option>
                        </select>
                    </div>

                    <!-- Players Table Card -->
                    <div class="table-card" style="background:var(--bg2); border:1px solid var(--border2); border-radius:16px; overflow:hidden;">
                        <table style="width:100%; border-collapse:collapse; text-align:right;">
                            <thead>
                                <tr style="background:var(--bg1); border-bottom:1px solid var(--border2); color:var(--txt2); font-size:13px;">
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
</main>`;

if (!html.includes('id="section-play-study"')) {
    html = html.replace(mainEndNeedle, playStudySectionHtml);
    console.log('✅ Injected section-play-study before </main>');
}

fs.writeFileSync('admin.html', html, 'utf8');
console.log('Done!');

