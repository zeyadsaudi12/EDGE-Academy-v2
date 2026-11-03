const fs = require('fs');
let h = fs.readFileSync('teacher-dashboard.html', 'utf8');

// 1. In renderComprehensiveAnalytics, update sideBadgeSales
if (!h.includes("setSafeText('sideBadgeSales'")) {
  h = h.replace(
    "setSafeText('salesGrandVal', (ss.totalSales || 0) + ' ج');",
    "setSafeText('salesGrandVal', (ss.totalSales || 0) + ' ج');\n            setSafeText('sideBadgeSales', (ss.totalSales || 0) + ' ج');"
  );
  console.log('✅ Added sideBadgeSales to renderComprehensiveAnalytics');
} else {
  console.log('ℹ️ sideBadgeSales already in renderComprehensiveAnalytics');
}

// 2. Also update sideBadgeSales in renderTeacherDashboard if _salesSummary exists
if (!h.includes("sideBadgeSales") || h.match(/sideBadgeSales/g).length < 2) {
  h = h.replace(
    "setSafeText('sideBadgeInactive', (_an.inactiveStudents || []).length);",
    "setSafeText('sideBadgeInactive', (_an.inactiveStudents || []).length);\n            setSafeText('sideBadgeSales', `${_an.salesSummary?.totalSales || 0} ج`);"
  );
  console.log('✅ Added sideBadgeSales to renderTeacherDashboard');
}

// 3. Update scrollToSection so that any legacy call correctly routes to activateTab if needed
const oldScroll = `        function scrollToSection(targetId, btn) {
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content-area').forEach(t => t.classList.remove('active'));

            if (btn && btn instanceof Element) {
                btn.classList.add('active');
            } else {
                const b = document.querySelector(\`.sidebar-link[onclick*="\${targetId}"]\`);
                if (b) b.classList.add('active');
            }

            const overviewTab = document.getElementById('tab-overview');
            if (overviewTab) overviewTab.classList.add('active');

            if (window.innerWidth <= 992) {
                document.getElementById('dashSidebar')?.classList.remove('open');
            }

            setTimeout(() => {
                const el = document.getElementById(targetId);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    el.classList.add('highlight-section');
                    setTimeout(() => el.classList.remove('highlight-section'), 2000);
                }
            }, 60);
        }`;

const newScroll = `        function scrollToSection(targetId, btn) {
            // Map section to corresponding tab if it belongs to a specific tab
            const tabMap = {
                'sales-section': 'sales',
                'students-section': 'students',
                'inactive-students-section': 'students',
                'centers-section': 'centers',
                'videos-section': 'videos',
                'exams-section': 'exams',
                'questions-section': 'questions'
            };
            if (tabMap[targetId]) {
                activateTab(tabMap[targetId], btn);
                return;
            }

            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content-area').forEach(t => t.classList.remove('active'));

            if (btn && btn instanceof Element) {
                btn.classList.add('active');
            } else {
                const b = document.querySelector(\`.sidebar-link[onclick*="\${targetId}"]\`);
                if (b) b.classList.add('active');
            }

            const overviewTab = document.getElementById('tab-overview');
            if (overviewTab) overviewTab.classList.add('active');

            if (window.innerWidth <= 992) {
                document.getElementById('dashSidebar')?.classList.remove('open');
            }

            setTimeout(() => {
                const el = document.getElementById(targetId);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    el.classList.add('highlight-section');
                    setTimeout(() => el.classList.remove('highlight-section'), 2000);
                }
            }, 60);
        }`;

if (h.includes('function scrollToSection(targetId, btn)')) {
  h = h.replace(oldScroll, newScroll);
  console.log('✅ Updated scrollToSection with tab redirection');
}

fs.writeFileSync('teacher-dashboard.html', h, 'utf8');
console.log('🎉 Done updating teacher-dashboard.html');
