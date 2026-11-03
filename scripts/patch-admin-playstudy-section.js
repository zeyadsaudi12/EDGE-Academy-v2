const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

// 1. Add Sidebar Nav Item for Play & Study under Exams / Banners
const oldSidebarNav = `                <div class="nav-group-title">الإعلانات</div>
                <button class="nav-item" onclick="showSection('banners', this)">
                    <i class="ti ti-photo"></i>
                    إعلانات الهيرو
                </button>`;

const newSidebarNav = `                <div class="nav-group-title">الأنشطة والألعاب</div>
                <button class="nav-item" onclick="showSection('play-study', this); loadAdminPlayStudy();">
                    <i class="ti ti-device-gamepad"></i>
                    إدارة Play & Study
                </button>

                <div class="nav-group-title">الإعلانات</div>
                <button class="nav-item" onclick="showSection('banners', this)">
                    <i class="ti ti-photo"></i>
                    إعلانات الهيرو
                </button>`;

if (html.includes(oldSidebarNav)) {
    html = html.replace(oldSidebarNav, newSidebarNav);
    console.log('✅ Added Play & Study nav item to sidebar in admin.html');
}

// 2. Add section-play-study before </main>
const oldMainEnd = `                    </div>
                </div>
        </main>`;

const playStudySectionHtml = `                    </div>
                </div>

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

if (html.includes(oldMainEnd)) {
    html = html.replace(oldMainEnd, playStudySectionHtml);
    console.log('✅ Added section-play-study to admin.html');
}

// 3. Add JavaScript logic at end of admin.html
const adminJsFunctions = `
<!-- ═══════════════════════════════════════════════════
     🎮 PLAY & STUDY ADMIN MANAGEMENT CONTROLLER JS
═══════════════════════════════════════════════════ -->
<script>
let _adminPlayStudyData = [];

async function loadAdminPlayStudy() {
    const tbody = document.getElementById('playstudy-players-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:35px; color:var(--txt3);"><i class="ti ti-loader fa-spin"></i> جاري تحميل السجلات...</td></tr>';

    try {
        const res = await fetch('/api/play-study/admin/players');
        const data = await res.json();
        if (data.success) {
            _adminPlayStudyData = data.players || [];
            renderAdminPlayStudyTable(_adminPlayStudyData);
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#ef4444;">تعذر تحميل السجلات</td></tr>';
        }
    } catch (err) {
        console.error('Failed to fetch admin play study data:', err);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#ef4444;">خطأ في الاتصال بالخادم</td></tr>';
    }
}

function renderAdminPlayStudyTable(players) {
    const tbody = document.getElementById('playstudy-players-tbody');
    if (!tbody) return;

    if (!players || players.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--txt3); font-weight:700;">لا توجد سجلات مطابقة للبحث</td></tr>';
        return;
    }

    tbody.innerHTML = players.map(p => {
        const isBanned = p.isBanned;
        const statusBadge = isBanned 
            ? '<span style="background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid #ef4444; padding:4px 10px; border-radius:50px; font-size:12px; font-weight:800;">🚫 محظور (غش)</span>'
            : '<span style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid #10b981; padding:4px 10px; border-radius:50px; font-size:12px; font-weight:800;">✅ حساب نشط</span>';

        return \`
            <tr style="border-bottom:1px solid var(--border2); transition:background 0.2s;">
                <td style="padding:14px 18px;">
                    <div style="font-weight:800; color:var(--txt1);">\${escapeHtml(p.name)}</div>
                    <small style="color:var(--txt3); font-family:monospace;">\${escapeHtml(p.phone)}</small>
                </td>
                <td style="padding:14px 18px; color:var(--txt2); font-weight:700;">\${escapeHtml(p.grade)}</td>
                <td style="padding:14px 18px;">
                    <span style="font-size:1.15rem; font-weight:900; color:#f59e0b;">\${p.points}</span>
                    <small style="color:var(--txt3); font-weight:700;"> نقطة</small>
                </td>
                <td style="padding:14px 18px;">
                    <span style="font-weight:800; color:\${p.dailyEnergy > 0 ? '#10b981' : '#ef4444'};">\${p.dailyEnergy} / 4</span>
                </td>
                <td style="padding:14px 18px; font-weight:700; color:var(--txt2);">
                    🥇 \${p.perfectWins} مرة
                </td>
                <td style="padding:14px 18px;">
                    \${statusBadge}
                </td>
                <td style="padding:14px 18px; text-align:center;">
                    <div style="display:inline-flex; align-items:center; gap:8px;">
                        <!-- تعديل / خصم النقاط -->
                        <button onclick="adminPromptAdjustPoints('\${p.id}', '\${escapeHtml(p.name)}', \${p.points})" class="btn-ghost" style="padding:6px 10px; font-size:12px; border-radius:8px; border:1px solid var(--border2);" title="تعديل النقاط">
                            <i class="ti ti-coins" style="color:#f59e0b;"></i> تعديل
                        </button>
                        
                        <!-- استعادة الطاقة -->
                        <button onclick="adminResetPlayerEnergy('\${p.id}', '\${escapeHtml(p.name)}')" class="btn-ghost" style="padding:6px 10px; font-size:12px; border-radius:8px; border:1px solid var(--border2);" title="إعادة شحن المحاولات">
                            <i class="ti ti-bolt" style="color:#3b82f6;"></i> طاقة
                        </button>

                        <!-- حظر أو فك الحظر -->
                        \${isBanned 
                            ? \`<button onclick="adminTogglePlayerBan('\${p.id}', false, '\${escapeHtml(p.name)}')" class="btn-primary" style="background:#10b981; padding:6px 12px; font-size:12px; border-radius:8px;">فك الحظر</button>\`
                            : \`<button onclick="adminTogglePlayerBan('\${p.id}', true, '\${escapeHtml(p.name)}')" class="btn-primary" style="background:#ef4444; padding:6px 12px; font-size:12px; border-radius:8px;"><i class="ti ti-ban"></i> حظر الغش</button>\`
                        }
                    </div>
                </td>
            </tr>
        \`;
    }).join('');
}

function filterAdminPlayStudy() {
    const q = (document.getElementById('playstudy-search-input')?.value || '').trim().toLowerCase();
    const status = document.getElementById('playstudy-filter-status')?.value || 'ALL';

    const filtered = _adminPlayStudyData.filter(p => {
        const matchesQ = !q || (p.name && p.name.toLowerCase().includes(q)) || (p.phone && p.phone.includes(q));
        const matchesStatus = status === 'ALL' || (status === 'BANNED' && p.isBanned) || (status === 'ACTIVE' && !p.isBanned);
        return matchesQ && matchesStatus;
    });

    renderAdminPlayStudyTable(filtered);
}

async function adminTogglePlayerBan(recordId, banState, playerName) {
    let reason = '';
    if (banState) {
        const res = await Swal.fire({
            title: \`حظر الطالب: \${playerName}\`,
            text: 'هل أنت متأكد من حظر هذا الطالب من نظام Play & Study وإيقاف اللعبة عنده؟',
            input: 'text',
            inputValue: 'لقد تم حظرك بسبب الغش!',
            inputLabel: 'رسالة وسبب الحظر التي ستظهر له:',
            showCancelButton: true,
            confirmButtonText: 'نعم، احظره الآن',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#ef4444'
        });
        if (!res.isConfirmed) return;
        reason = res.value || 'لقد تم حظرك بسبب الغش!';
    } else {
        const res = await Swal.fire({
            title: \`فك حظر الطالب: \${playerName}\`,
            text: 'هل تريد السماح للطالب بالدخول لنظام Play & Study واللعب مجدداً؟',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'فك الحظر',
            cancelButtonText: 'إلغاء'
        });
        if (!res.isConfirmed) return;
    }

    try {
        const res = await fetch('/api/play-study/admin/toggle-ban', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recordId, isBanned: banState, reason })
        });
        const data = await res.json();
        if (data.success) {
            Swal.fire({ icon: 'success', title: data.message, timer: 1500, showConfirmButton: false });
            loadAdminPlayStudy();
        } else {
            Swal.fire({ icon: 'error', title: 'خطأ', text: data.message });
        }
    } catch (err) {
        console.error('Toggle ban error:', err);
    }
}

async function adminPromptAdjustPoints(recordId, playerName, currentPoints) {
    const res = await Swal.fire({
        title: \`تعديل نقاط \${playerName}\`,
        html: \`
            <p style="margin-bottom:12px;">الرصيد الحالي: <b style="color:#f59e0b; font-size:1.2rem;">\${currentPoints} نقطة</b></p>
            <p style="font-size:12px; color:var(--txt2);">أدخل الرصيد الجديد مباشرة أو اكتب قيمة الخصم/الإضافة:</p>
        \`,
        input: 'number',
        inputValue: currentPoints,
        showCancelButton: true,
        confirmButtonText: 'حفظ الرصيد الجديد',
        cancelButtonText: 'إلغاء'
    });

    if (!res.isConfirmed) return;

    try {
        const resApi = await fetch('/api/play-study/admin/adjust-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recordId, newPoints: res.value })
        });
        const data = await resApi.json();
        if (data.success) {
            Swal.fire({ icon: 'success', title: 'تم تعديل النقاط بنجاح!', timer: 1500, showConfirmButton: false });
            loadAdminPlayStudy();
        } else {
            Swal.fire({ icon: 'error', title: 'خطأ', text: data.message });
        }
    } catch (err) {
        console.error('Adjust points error:', err);
    }
}

async function adminResetPlayerEnergy(recordId, playerName) {
    const res = await Swal.fire({
        title: \`إعادة شحن محاولات \${playerName}\`,
        text: 'هل تريد إعادة شحن طاقة الطالب إلى 4 محاولات كاملة لليوم؟',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'شحن الطاقة (4/4)',
        cancelButtonText: 'إلغاء'
    });

    if (!res.isConfirmed) return;

    try {
        const resApi = await fetch('/api/play-study/admin/reset-energy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recordId })
        });
        const data = await resApi.json();
        if (data.success) {
            Swal.fire({ icon: 'success', title: 'تمت إعادة شحن المحاولات بنجاح!', timer: 1500, showConfirmButton: false });
            loadAdminPlayStudy();
        } else {
            Swal.fire({ icon: 'error', title: 'خطأ', text: data.message });
        }
    } catch (err) {
        console.error('Reset energy error:', err);
    }
}
</script>
`;

html = html.replace('</body>', `${adminJsFunctions}\n</body>`);

fs.writeFileSync('admin.html', html, 'utf8');
console.log('🎉 Successfully injected Play & Study admin section & scripts into admin.html!');

