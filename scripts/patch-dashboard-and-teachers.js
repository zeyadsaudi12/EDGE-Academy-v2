const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '..', 'teacher-dashboard.html');
let dashHtml = fs.readFileSync(dashPath, 'utf8');

// Replace loadDashboard start
const targetRegex = /async function loadDashboard\(\)\s*\{\s*try\s*\{\s*const targetTeacherId = \(currentUser\.role === 'admin' && _urlParams\.get\('teacherId'\)\)\s*\?\s*_urlParams\.get\('teacherId'\)\s*:\s*currentUser\.teacherId;\s*if \(!targetTeacherId\) \{[^}]+\}/;

const replacement = `let allTeachersListForAdmin = [];

        async function loadDashboard() {
            try {
                let targetTeacherId = (currentUser.role === 'admin' && _urlParams.get('teacherId'))
                    ? _urlParams.get('teacherId')
                    : currentUser.teacherId;

                if (!targetTeacherId && currentUser.role === 'admin') {
                    try {
                        const tRes = await fetch(\`\${API}/api/teachers?includeHidden=true\`);
                        allTeachersListForAdmin = await tRes.json();
                        if (Array.isArray(allTeachersListForAdmin) && allTeachersListForAdmin.length > 0) {
                            targetTeacherId = allTeachersListForAdmin[0]._id;
                        }
                    } catch (e) {
                        console.error('Failed to auto-select teacher for admin:', e);
                    }
                }

                if (!targetTeacherId) {
                    throw new Error('يرجى تحديد المعلم المطلوب عرض لوحته الإحصائية');
                }`;

if (targetRegex.test(dashHtml)) {
    dashHtml = dashHtml.replace(targetRegex, replacement);

    // Inject hero links & switcher in renderTeacherDashboard
    const heroGreetingRegex = /setSafeText\('heroGreeting',\s*`مرحباً بك يا أستاذ \$\{t\.name \|\| ''\} 👋`\);/;
    const switcherInject = `setSafeText('heroGreeting', \`مرحباً بك يا أستاذ \${t.name || ''} 👋\`);
            
            // Link to view teacher profile
            const profileLinkWrap = document.getElementById('heroProfileLinkWrap');
            if (profileLinkWrap) {
                profileLinkWrap.innerHTML = \`<a href="teacher-profile?id=\${t._id}" target="_blank" style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.18); color:#fff; text-decoration:none; padding:7px 16px; border-radius:50px; font-weight:800; font-size:0.85rem; border:1px solid rgba(255,255,255,0.25); transition:all 0.2s;"><i class="ti ti-external-link"></i> معاينة البروفايل للطلاب</a>\`;
            }

            // Populate admin teacher switcher if user is admin
            if (currentUser && currentUser.role === 'admin') {
                const adminSwitcherWrap = document.getElementById('adminTeacherSwitcherArea');
                if (adminSwitcherWrap) {
                    adminSwitcherWrap.style.display = 'block';
                    fetch(\`\${API}/api/teachers?includeHidden=true\`)
                        .then(r => r.json())
                        .then(teachers => {
                            if (!Array.isArray(teachers)) return;
                            const selectEl = document.getElementById('adminTeacherSelect');
                            if (selectEl) {
                                selectEl.innerHTML = teachers.map(tc => \`<option value="\${tc._id}" \${String(tc._id) === String(t._id) ? 'selected' : ''}>\${escapeHtml(tc.name)} (\${escapeHtml(tc.subjectAr || '')})</option>\`).join('');
                            }
                        })
                        .catch(err => console.error('Failed to load teachers for switcher:', err));
                }
            }`;

    dashHtml = dashHtml.replace(heroGreetingRegex, switcherInject);

    // Add UI containers in teacher-hero-banner
    const heroBannerRegex = /<p class="hero-welcome-p" id="heroSubjectText">متابعة تفاعلية لحضور الطلاب والسناتر والامتحانات والمشاهدات<\/p>\s*<\/div>/;
    const heroBannerAdd = `<p class="hero-welcome-p" id="heroSubjectText">متابعة تفاعلية لحضور الطلاب والسناتر والامتحانات والمشاهدات</p>
                        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-top:12px;">
                            <div id="heroProfileLinkWrap"></div>
                            <div id="adminTeacherSwitcherArea" style="display:none; background:rgba(0,0,0,0.2); padding:6px 14px; border-radius:50px; border:1px solid rgba(255,255,255,0.2);">
                                <span style="font-size:0.85rem; font-weight:800; color:#cbd5e1; margin-left:6px;"><i class="ti ti-switch-horizontal"></i> تبديل المعلم:</span>
                                <select id="adminTeacherSelect" onchange="location.href='teacher-dashboard?teacherId=' + this.value" style="background:#1e293b; color:#fff; border:1px solid #475569; padding:4px 10px; border-radius:8px; font-weight:700; font-family:inherit; outline:none; cursor:pointer;">
                                </select>
                            </div>
                        </div>
                    </div>`;

    dashHtml = dashHtml.replace(heroBannerRegex, heroBannerAdd);

    fs.writeFileSync(dashPath, dashHtml, 'utf8');
    console.log('✅ Successfully updated teacher-dashboard.html');
} else {
    console.error('❌ Could not match targetRegex in teacher-dashboard.html');
}
