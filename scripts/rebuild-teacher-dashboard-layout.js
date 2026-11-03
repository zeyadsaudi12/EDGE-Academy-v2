const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '..', 'teacher-dashboard.html');
let html = fs.readFileSync(dashPath, 'utf8');

// 1. UPDATE CSS IN <style>
const oldSidebarCssStart = '/* ── Sidebar (شريط الأدوات الجانبي) ── */';
const oldSidebarCssEnd = '/* ── Main Content Area ── */';

const newSidebarCss = `/* ── Sidebar (شريط الأدوات الجانبي المحسن) ── */
        .dash-sidebar {
            width: var(--sidebar-width);
            background: var(--dash-card);
            border-left: 1px solid var(--dash-border);
            display: flex;
            flex-direction: column;
            padding: 20px 14px;
            position: sticky;
            top: 84px;
            height: calc(100vh - 84px);
            overflow-y: auto;
            flex-shrink: 0;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: -4px 0 20px rgba(0, 0, 0, 0.02);
            z-index: 99;
        }

        .dash-sidebar::-webkit-scrollbar {
            width: 5px;
        }
        .dash-sidebar::-webkit-scrollbar-thumb {
            background: var(--dash-border);
            border-radius: 10px;
        }

        /* Teacher Profile Mini Card in Sidebar */
        .sidebar-teacher-card {
            background: linear-gradient(135deg, rgba(26, 107, 219, 0.08), rgba(0, 191, 166, 0.08));
            border: 1px solid var(--dash-border);
            border-radius: 16px;
            padding: 14px 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }

        .sidebar-avatar {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: linear-gradient(135deg, var(--dash-primary), #00bfa6);
            color: #fff;
            display: grid;
            place-items: center;
            font-weight: 900;
            font-size: 1.25rem;
            object-fit: cover;
            border: 2px solid rgba(255, 255, 255, 0.85);
            box-shadow: 0 4px 14px rgba(26, 107, 219, 0.22);
            flex-shrink: 0;
        }

        .sidebar-teacher-name {
            font-weight: 900;
            font-size: 0.95rem;
            color: var(--dash-text);
            line-height: 1.3;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 155px;
        }

        .sidebar-teacher-sub {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 800;
            color: var(--dash-primary);
            background: var(--dash-primary-light);
            padding: 2px 8px;
            border-radius: 999px;
        }

        /* Sidebar Navigation Menu */
        .sidebar-menu {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        /* Sidebar Section Category Titles */
        .sidebar-section-title {
            font-size: 0.72rem;
            font-weight: 800;
            color: var(--dash-muted);
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 10px 10px 4px;
            margin-top: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
            opacity: 0.85;
            user-select: none;
        }
        .sidebar-section-title::after {
            content: "";
            flex: 1;
            height: 1px;
            background: var(--dash-border);
            opacity: 0.6;
        }

        .sidebar-link {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            border-radius: 12px;
            color: var(--dash-muted);
            text-decoration: none;
            font-weight: 800;
            font-size: 0.9rem;
            transition: all 0.2s ease;
            cursor: pointer;
            border: 1px solid transparent;
            background: transparent;
            width: 100%;
            text-align: right;
            box-sizing: border-box;
        }

        .sidebar-link-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .sidebar-link i {
            font-size: 1.2rem;
            transition: transform 0.2s ease;
            flex-shrink: 0;
        }

        .sidebar-link:hover {
            color: var(--dash-primary);
            background: var(--dash-primary-light);
            border-color: rgba(26, 107, 219, 0.12);
            transform: translateX(-3px);
        }

        .sidebar-link.active {
            background: var(--dash-primary);
            color: #ffffff !important;
            border-color: var(--dash-primary);
            box-shadow: 0 4px 14px rgba(26, 107, 219, 0.32);
        }

        .sidebar-badge {
            font-family: 'Outfit', sans-serif;
            font-size: 0.74rem;
            font-weight: 900;
            padding: 2px 8px;
            border-radius: 999px;
            background: rgba(0, 0, 0, 0.06);
            color: inherit;
            min-width: 20px;
            text-align: center;
        }

        .dark-mode .sidebar-badge {
            background: rgba(255, 255, 255, 0.08);
        }

        .sidebar-link.active .sidebar-badge {
            background: rgba(255, 255, 255, 0.25);
            color: #fff;
        }

        .sidebar-badge.badge-currency {
            background: rgba(16, 185, 129, 0.15);
            color: #059669;
        }
        .dark-mode .sidebar-badge.badge-currency {
            background: rgba(16, 185, 129, 0.25);
            color: #34d399;
        }
        .sidebar-link.active .sidebar-badge.badge-currency {
            background: rgba(255, 255, 255, 0.25);
            color: #fff;
        }

        .sidebar-badge.badge-warning {
            background: rgba(239, 68, 68, 0.12);
            color: #dc2626;
        }
        .dark-mode .sidebar-badge.badge-warning {
            background: rgba(239, 68, 68, 0.22);
            color: #f87171;
        }
        .sidebar-link.active .sidebar-badge.badge-warning {
            background: rgba(255, 255, 255, 0.25);
            color: #fff;
        }

        /* Sidebar Footer */
        .sidebar-footer {
            padding-top: 14px;
            border-top: 1px solid var(--dash-border);
            margin-top: auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .sidebar-footer-link {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px 12px;
            border-radius: 10px;
            color: var(--dash-muted);
            text-decoration: none;
            font-weight: 700;
            font-size: 0.88rem;
            transition: all 0.2s;
        }
        .sidebar-footer-link:hover {
            color: var(--dash-primary);
            background: var(--dash-primary-light);
        }

        .sidebar-logout-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 10px 14px;
            border-radius: 12px;
            border: 1px solid #fee2e2;
            background: #fff5f5;
            color: #dc2626;
            font-family: inherit;
            font-weight: 800;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .dark-mode .sidebar-logout-btn {
            background: rgba(220, 38, 38, 0.1);
            border-color: rgba(220, 38, 38, 0.25);
            color: #f87171;
        }

        .sidebar-logout-btn:hover {
            background: #fee2e2;
            transform: translateY(-2px);
        }

        `;

const sidebarCssRegex = /\/\* ── Sidebar \(شريط الأدوات الجانبي\) ── \*\/[\s\S]*?\/\* ── Main Content Area ── \*\//;
if (sidebarCssRegex.test(html)) {
    html = html.replace(sidebarCssRegex, newSidebarCss + '/* ── Main Content Area ── */');
    console.log('✅ Replaced Sidebar CSS successfully');
} else {
    console.warn('⚠️ Sidebar CSS regex did not match; checking alternative');
}

// 2. UPDATE SIDEBAR HTML
const oldSidebarHtmlRegex = /<aside class="dash-sidebar" id="dashSidebar">[\s\S]*?<\/aside>/;
const newSidebarHtml = `<aside class="dash-sidebar" id="dashSidebar">
            <!-- Teacher Profile Card -->
            <div class="sidebar-teacher-card">
                <img id="sidebarAvatarImg" class="sidebar-avatar" src="" alt="المدرس" style="display:none;" onerror="this.onerror=null; this.src='imges/edge-square.jpg';">
                <div id="sidebarAvatarFallback" class="sidebar-avatar">م</div>
                <div style="min-width:0; flex:1;">
                    <div class="sidebar-teacher-name" id="sidebarTeacherName">حساب المعلم</div>
                    <span class="sidebar-teacher-sub" id="sidebarTeacherSubject">المادة الدراسية</span>
                </div>
            </div>

            <!-- Navigation Menu with Categories -->
            <div class="sidebar-menu">
                <!-- Group 1: الرئيسية والمالية -->
                <div class="sidebar-section-title">
                    <span>الرئيسية والمالية</span>
                </div>

                <button class="sidebar-link active" onclick="activateTab('overview', this)">
                    <div class="sidebar-link-content">
                        <i class="ti ti-layout-dashboard"></i>
                        <span>نظرة عامة والنسب</span>
                    </div>
                </button>

                <button class="sidebar-link" onclick="activateTab('sales', this)">
                    <div class="sidebar-link-content">
                        <i class="ti ti-chart-line"></i>
                        <span>المبيعات والإحصائيات</span>
                    </div>
                    <span class="sidebar-badge badge-currency" id="sideBadgeSales">0 ج</span>
                </button>

                <!-- Group 2: المحتوى والامتحانات -->
                <div class="sidebar-section-title">
                    <span>المحتوى والامتحانات</span>
                </div>

                <button class="sidebar-link" onclick="activateTab('videos', this)">
                    <div class="sidebar-link-content">
                        <i class="ti ti-video"></i>
                        <span>الفيديوهات والمشاهدات</span>
                    </div>
                    <span class="sidebar-badge" id="sideBadgeVideos">0</span>
                </button>

                <button class="sidebar-link" onclick="activateTab('exams', this)">
                    <div class="sidebar-link-content">
                        <i class="ti ti-file-certificate"></i>
                        <span>الامتحانات والدرجات</span>
                    </div>
                    <span class="sidebar-badge" id="sideBadgeExams">0</span>
                </button>

                <button class="sidebar-link" onclick="activateTab('questions', this)">
                    <div class="sidebar-link-content">
                        <i class="ti ti-messages"></i>
                        <span>استفسارات الطلاب</span>
                    </div>
                    <span class="sidebar-badge" id="sideBadgeQuestions">0</span>
                </button>

                <!-- Group 3: شؤون الطلاب والسناتر -->
                <div class="sidebar-section-title">
                    <span>الطلاب والسناتر</span>
                </div>

                <button class="sidebar-link" onclick="activateTab('centers', this)">
                    <div class="sidebar-link-content">
                        <i class="ti ti-map-pin"></i>
                        <span>أماكن وسناتر الطلاب</span>
                    </div>
                    <span class="sidebar-badge" id="sideBadgeCenters">0</span>
                </button>

                <button class="sidebar-link" onclick="activateTab('students', this)">
                    <div class="sidebar-link-content">
                        <i class="ti ti-user-x"></i>
                        <span>الطلبة غير المفعلين</span>
                    </div>
                    <span class="sidebar-badge badge-warning" id="sideBadgeInactive">0</span>
                </button>
            </div>

            <!-- Sidebar Footer -->
            <div class="sidebar-footer">
                <a href="/" class="sidebar-footer-link" title="المنصة الرئيسية">
                    <i class="ti ti-home"></i>
                    <span>المنصة الرئيسية</span>
                </a>
                <button class="sidebar-logout-btn" onclick="logout()">
                    <i class="ti ti-logout"></i>
                    <span>تسجيل الخروج</span>
                </button>
            </div>
        </aside>`;

if (oldSidebarHtmlRegex.test(html)) {
    html = html.replace(oldSidebarHtmlRegex, newSidebarHtml);
    console.log('✅ Replaced Sidebar HTML successfully');
} else {
    console.warn('⚠️ Sidebar HTML regex did not match');
}

// 3. REORGANIZE TABS & SECTIONS IN MAIN CONTENT
// Replace tab-overview, tab-centers, etc. with perfectly separated tabs
const oldTabsRegex = /<div id="tab-overview" class="tab-content-area active">[\s\S]*?<\/div>\s*<\/main>/;

const newTabsHtml = `<div id="tab-overview" class="tab-content-area active">
                    <!-- Platform Overview Donut & Active vs Inactive -->
                    <div class="dash-charts-grid-2" style="margin-bottom: 24px;">
                        <div class="dash-widget-box">
                            <div class="widget-header">
                                <h3><i class="ti ti-chart-pie"></i> نظرة عامة على المنصة</h3>
                            </div>
                            <div class="widget-body">
                                <div class="platform-donut-wrap" style="height: 200px;">
                                    <canvas id="chartPlatformOverview"></canvas>
                                </div>
                                <div class="platform-donut-legend">
                                    <span class="p-legend-item"><span class="p-dot" style="background:#6366f1"></span>المدرسين</span>
                                    <span class="p-legend-item"><span class="p-dot" style="background:#f87171"></span>الطلبة</span>
                                    <span class="p-legend-item"><span class="p-dot" style="background:#14b8a6"></span>الكورسات</span>
                                    <span class="p-legend-item"><span class="p-dot" style="background:#f59e0b"></span>المحاضرات</span>
                                </div>
                            </div>
                        </div>

                        <div class="dash-widget-box">
                            <div class="widget-header">
                                <h3><i class="ti ti-user-check"></i> نسبة الطلاب الفعّالين مقابل غير الفعّالين</h3>
                            </div>
                            <div class="widget-body">
                                <div style="position:relative; height: 200px;">
                                    <canvas id="chartActiveVsInactive"></canvas>
                                </div>
                                <div class="active-students-pills-row">
                                    <div class="active-pill-box">
                                        <span class="active-num-badge teal" id="badgeActiveCount">0</span>
                                        <span style="font-size:0.8rem; font-weight:700; color:var(--dash-muted);">اشتروا اشتراكات</span>
                                    </div>
                                    <div class="active-pill-box">
                                        <span class="active-num-badge" style="background:rgba(148,163,184,0.2); color:var(--dash-text);" id="badgeInactiveCount">0</span>
                                        <span style="font-size:0.8rem; font-weight:700; color:var(--dash-muted);">مسجلين فقط</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Top Performing Students Leaderboard -->
                    <div class="centers-attendance-section" style="padding:24px; margin-bottom: 24px;">
                        <div class="section-header-flex" style="margin-bottom:16px;">
                            <div class="section-title-wrap">
                                <h2>
                                    <i class="ti ti-trophy" style="color:#eab308"></i>
                                    لوحة شرف الأوائل (المتفوقين دراسياً)
                                </h2>
                                <p>أعلى الطلاب الحاصلين على درجات متفوقة مع إمكانية التهنئة المباشرة</p>
                            </div>
                        </div>
                        <div id="topStudentsListWrap" class="centers-breakdown-list">
                            <!-- Populated dynamically -->
                        </div>
                    </div>

                    <!-- Top Grades & Top Governorates -->
                    <div class="dash-charts-grid-2" style="margin-bottom: 24px;">
                        <div class="dash-widget-box">
                            <div class="widget-header">
                                <h3><i class="ti ti-school"></i> توزيع الصفوف الدراسية (Top 3)</h3>
                            </div>
                            <div class="widget-body">
                                <div style="height: 180px;">
                                    <canvas id="chartTopGrades"></canvas>
                                </div>
                                <div id="gradesLegendContainer" style="margin-top: 12px; display:flex; flex-direction:column; gap:6px; padding:0 8px;"></div>
                            </div>
                        </div>

                        <div class="dash-widget-box">
                            <div class="widget-header">
                                <h3><i class="ti ti-map-pins"></i> أعلى 10 محافظات تسجيلاً</h3>
                            </div>
                            <div class="widget-body" style="height: 280px;">
                                <canvas id="chartTopGovs"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activities: Lectures & Students -->
                    <div class="dash-charts-grid-2">
                        <div class="dash-widget-box">
                            <div class="widget-header">
                                <h3><i class="ti ti-video"></i> آخر المحاضرات المضافة</h3>
                                <a href="#" onclick="activateTab('videos'); return false;" class="widget-header-link">عرض الكل</a>
                            </div>
                            <div class="widget-body" style="padding: 12px 16px;">
                                <div class="recent-items-list" id="recentLecturesList">
                                    <!-- Populated dynamically -->
                                </div>
                            </div>
                        </div>

                        <div class="dash-widget-box">
                            <div class="widget-header">
                                <h3><i class="ti ti-user-plus"></i> آخر الطلاب المسجلين</h3>
                            </div>
                            <div class="widget-body" style="padding: 12px 16px;">
                                <div class="recent-items-list" id="recentStudentsList"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ════ TAB 2: SALES & FINANCIAL ANALYTICS ════ -->
                <div id="tab-sales" class="tab-content-area">
                    <div id="salesSummaryWrap" style="margin-bottom: 24px;">
                        <!-- Sales Summary Box -->
                        <div class="dash-widget-box" style="margin-bottom: 24px; padding: 24px;">
                            <div class="sales-grand-card">
                                <div class="grand-card-label">إجمالي المبيعات المحققة</div>
                                <div class="grand-card-val" id="salesGrandVal">0 ج</div>
                            </div>
                            <div class="sales-sub-grid">
                                <div class="sales-sub-card">
                                    <div class="sub-card-title">مبيعات الكورسات</div>
                                    <div class="sub-card-val" id="subSalesCoursesVal">0</div>
                                    <div class="sub-card-ops" id="subSalesCoursesOps">0 عملية</div>
                                </div>
                                <div class="sales-sub-card">
                                    <div class="sub-card-title">مبيعات الباكدجات</div>
                                    <div class="sub-card-val" id="subSalesPackagesVal">0</div>
                                    <div class="sub-card-ops" id="subSalesPackagesOps">0 عملية</div>
                                </div>
                                <div class="sales-sub-card">
                                    <div class="sub-card-title">مبيعات المحاضرات</div>
                                    <div class="sub-card-val" id="subSalesLecturesVal">0</div>
                                    <div class="sub-card-ops" id="subSalesLecturesOps">0 عملية</div>
                                </div>
                                <div class="sales-sub-card">
                                    <div class="sub-card-title">مبيعات السناتر</div>
                                    <div class="sub-card-val" id="subSalesCentersVal">0</div>
                                    <div class="sub-card-ops" id="subSalesCentersOps">0 عملية</div>
                                </div>
                            </div>
                        </div>

                        <!-- Monthly Sales & Registrations Chart -->
                        <div class="dash-widget-box" style="margin-bottom: 24px;">
                            <div class="widget-header">
                                <h3><i class="ti ti-chart-line"></i> المبيعات الشهرية وتسجيلات الطلبة</h3>
                            </div>
                            <div class="widget-body" style="height: 320px;">
                                <canvas id="chartMonthlySales"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ════ TAB 3: VIDEOS & WATCHERS ════ -->
                <div id="tab-videos" class="tab-content-area">
                    <div class="dash-filter-row">
                        <div class="search-box-input">
                            <i class="ti ti-search"></i>
                            <input type="text" id="searchVideosInput" placeholder="ابحث باسم الفيديو أو الحصة..." oninput="filterVideosTab()">
                        </div>
                        <div style="font-weight:800; color:var(--dash-muted); font-size:0.92rem;">
                            إجمالي الفيديوهات: <b id="tabVideosCount">0</b>
                        </div>
                    </div>
                    <div id="videosAccordionWrap">
                        <!-- Populated dynamically -->
                    </div>
                </div>

                <!-- ════ TAB 4: EXAMS & RESULTS ════ -->
                <div id="tab-exams" class="tab-content-area">
                    <div class="dash-filter-row">
                        <div class="search-box-input">
                            <i class="ti ti-search"></i>
                            <input type="text" id="searchExamsInput" placeholder="ابحث باسم الطالب أو رقم الهاتف..." oninput="filterExamsTable()">
                        </div>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <select id="selectExamFilter" onchange="filterExamsTable()" style="padding:9px 14px; border-radius:10px; border:1px solid var(--dash-border); font-family:inherit; font-weight:700; background:var(--dash-card); color:var(--dash-text);">
                                <option value="ALL">جميع الامتحانات</option>
                            </select>
                            <button onclick="exportExamsCSV()" style="padding:9px 16px; border-radius:10px; background:#f0fdf4; border:1px solid #86efac; color:#166534; font-family:inherit; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                                <i class="ti ti-file-spreadsheet"></i> تصدير Excel
                            </button>
                        </div>
                    </div>
                    <div class="dash-table-wrap">
                        <table class="dash-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>اسم الطالب</th>
                                    <th>الامتحان</th>
                                    <th>الصف الدراسي</th>
                                    <th>المحافظة</th>
                                    <th>النسبة المئوية</th>
                                    <th>التقدير</th>
                                    <th>الهاتف</th>
                                    <th>مراسلة</th>
                                </tr>
                            </thead>
                            <tbody id="examResultsTbody">
                                <!-- Populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ════ TAB 5: STUDENT QUESTIONS ════ -->
                <div id="tab-questions" class="tab-content-area">
                    <div class="dash-filter-row">
                        <div class="search-box-input">
                            <i class="ti ti-search"></i>
                            <input type="text" id="searchQuestionsInput" placeholder="ابحث في أسئلة الطلاب..." oninput="filterQuestionsTab()">
                        </div>
                        <div style="font-weight:800; color:var(--dash-muted); font-size:0.92rem;">
                            الأسئلة الواردة: <b id="tabQuestionsCount">0</b>
                        </div>
                    </div>
                    <div id="questionsCardsGrid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px;">
                        <!-- Populated dynamically -->
                    </div>
                </div>

                <!-- ════ TAB 6: CENTERS & ATTENDANCE LOG ════ -->
                <div id="tab-centers" class="tab-content-area">
                    <!-- Circular Centers / Location Gauge -->
                    <div class="centers-attendance-section" style="margin-bottom: 24px;">
                        <div class="section-header-flex">
                            <div class="section-title-wrap">
                                <h2>
                                    <i class="ti ti-chart-donut-filled" style="color:var(--dash-primary)"></i>
                                    مؤشر توزيع ونسب حضور الطلاب بالأماكن والسناتر
                                </h2>
                                <p>مخطط دائري يوضح نسبة الطلاب الحاضرين في كل سنتر ومحافظة بلون مميز</p>
                            </div>
                            <div class="toggle-group">
                                <button class="toggle-btn active" id="btnToggleCenters" onclick="setAttendanceViewMode('centers')">حسب السناتر</button>
                                <button class="toggle-btn" id="btnToggleGovs" onclick="setAttendanceViewMode('govs')">حسب المحافظات</button>
                            </div>
                        </div>

                        <div class="centers-grid-layout">
                            <div class="center-chart-box">
                                <canvas id="chartCentersDonut"></canvas>
                                <div class="chart-center-cutout">
                                    <div class="cutout-number" id="cutoutTotalCount">0</div>
                                    <div class="cutout-label" id="cutoutLabelText">طالب مسجل</div>
                                </div>
                            </div>
                            <div class="centers-breakdown-list" id="centersBreakdownGrid">
                                <!-- Populated dynamically -->
                            </div>
                        </div>
                    </div>

                    <!-- Attendance Table -->
                    <div class="dash-filter-row">
                        <div class="search-box-input">
                            <i class="ti ti-search"></i>
                            <input type="text" id="attendanceSearchInput" placeholder="ابحث باسم الطالب أو السنتر..." oninput="filterAttendanceLogs()">
                        </div>
                        <div style="font-weight:800; color:var(--dash-muted); font-size:0.92rem;">
                            إجمالي المسجلين بالحضور: <b id="totalAttendRecords">0</b>
                        </div>
                    </div>

                    <div class="dash-table-wrap">
                        <table class="dash-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>اسم الطالب</th>
                                    <th>السنتر / المقر</th>
                                    <th>اليوم</th>
                                    <th>الميعاد</th>
                                    <th>الصف الدراسي</th>
                                    <th>وقت التسجيل</th>
                                    <th>هاتف الطالب</th>
                                    <th>تواصل واتساب</th>
                                </tr>
                            </thead>
                            <tbody id="attendanceTableBody">
                                <!-- Populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ════ TAB 7: STUDENTS & INACTIVE TABLE ════ -->
                <div id="tab-students" class="tab-content-area">
                    <!-- Top Interactive Students Chart -->
                    <div class="dash-widget-box" style="margin-bottom: 24px;">
                        <div class="widget-header">
                            <h3><i class="ti ti-flame"></i> أكثر الطلاب تفاعلاً (مشاهدات المحاضرات)</h3>
                        </div>
                        <div class="widget-body" style="height: 260px;">
                            <canvas id="chartTopInteractiveStudents"></canvas>
                        </div>
                    </div>

                    <!-- Inactive Students Table -->
                    <div class="dash-widget-box" id="tableInactiveStudentsWrap" style="margin-bottom: 28px;">
                        <div class="widget-header" style="padding: 18px 24px; border-bottom: 1px solid var(--dash-border); flex-wrap: wrap; gap: 12px;">
                            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--dash-text);"><i class="ti ti-user-x"></i> الطلبة غير المفعلين (مسجلين دون اشتراكات)</h3>
                            <div class="table-search-box">
                                <i class="ti ti-search"></i>
                                <input type="text" id="inactiveSearchInput" placeholder="بحث باسم الطالب أو الهاتف..." oninput="filterInactiveStudentsTable()">
                            </div>
                        </div>
                        <div class="dash-table-wrap" style="border:none; border-radius:0;">
                            <table class="dash-table inactive-table">
                                <thead>
                                    <tr>
                                        <th style="width: 50px; text-align: center;">م</th>
                                        <th>الاسم</th>
                                        <th>رقم الهاتف</th>
                                        <th>المحافظة</th>
                                        <th>السنة الدراسية</th>
                                        <th>تاريخ الانشاء</th>
                                        <th style="text-align: center;">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody id="inactiveStudentsTbody">
                                    <!-- Populated dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>`;

if (oldTabsRegex.test(html)) {
    html = html.replace(oldTabsRegex, newTabsHtml);
    console.log('✅ Replaced Tabs & Content Distribution successfully');
} else {
    console.warn('⚠️ Tabs & Content regex did not match');
}

// 4. UPDATE JS (activateTab, scrollToSection, sidebarAvatar, badges)
// Update activateTab to handle chart resizing cleanly
const oldActivateTabRegex = /function activateTab\(tabId,\s*btn\)\s*\{[\s\S]*?if \(window\.innerWidth <= 992\) \{[^}]*\}\s*\}/;

const newActivateTab = `function activateTab(tabId, btn) {
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content-area').forEach(t => t.classList.remove('active'));

            const activeBtn = (btn instanceof Element) ? btn : null;
            if (activeBtn) {
                activeBtn.classList.add('active');
            } else {
                document.querySelectorAll('.sidebar-link').forEach(b => {
                    if (b.getAttribute('onclick')?.includes(\`'\${tabId}'\`)) b.classList.add('active');
                });
            }

            const target = document.getElementById(\`tab-\${tabId}\`);
            if (target) {
                target.classList.add('active');
                document.querySelector('.dash-main')?.scrollTo({ top: 0, behavior: 'smooth' });
            }

            if (window.innerWidth <= 992) {
                document.getElementById('dashSidebar')?.classList.remove('open');
            }

            // Trigger Chart.js redraws when tab changes
            setTimeout(() => {
                if (chartPlatformInstance) chartPlatformInstance.resize();
                if (chartActiveInactiveInstance) chartActiveInactiveInstance.resize();
                if (chartMonthlySalesInstance) chartMonthlySalesInstance.resize();
                if (chartTopInteractiveInstance) chartTopInteractiveInstance.resize();
                if (chartTopGradesInstance) chartTopGradesInstance.resize();
                if (chartTopGovsInstance) chartTopGovsInstance.resize();
                window.dispatchEvent(new Event('resize'));
            }, 60);
        }`;

if (oldActivateTabRegex.test(html)) {
    html = html.replace(oldActivateTabRegex, newActivateTab);
    console.log('✅ Updated activateTab function');
}

// Update scrollToSection to redirect to proper tab
const oldScrollRegex = /function scrollToSection\(targetId,\s*btn\)\s*\{[\s\S]*?el\.scrollIntoView[^}]*\}\s*\}, 100\);\s*\}/;
const newScrollSection = `function scrollToSection(targetId, btn) {
            if (targetId === 'salesSummaryWrap' || targetId === 'tab-sales') {
                activateTab('sales', btn);
                return;
            }
            if (targetId === 'tableInactiveStudentsWrap' || targetId === 'tab-students') {
                activateTab('students', btn);
                return;
            }
            if (targetId === 'centersAttendanceWrap' || targetId === 'tab-centers') {
                activateTab('centers', btn);
                return;
            }
            activateTab('overview', btn);
            setTimeout(() => {
                const el = document.getElementById(targetId);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }`;

if (oldScrollRegex.test(html)) {
    html = html.replace(oldScrollRegex, newScrollSection);
    console.log('✅ Updated scrollToSection function');
}

// Ensure resolveImg is defined in teacher-dashboard.html
if (!html.includes('function resolveImg(')) {
    const resolveImgCode = `
        function resolveImg(path) {
            if (!path) return 'imges/edge-square.jpg';
            if (path.startsWith('http')) return path;
            if (path.startsWith('/uploads/')) return API + path;
            if (path.startsWith('uploads/')) return API + '/' + path;
            return path;
        }
    `;
    html = html.replace('function renderTeacherDashboard(d) {', resolveImgCode + '\n        function renderTeacherDashboard(d) {');
    console.log('✅ Injected resolveImg helper');
}

// Update avatar & sales badge in renderTeacherDashboard
const oldAvatarLogic = `if (t.imagePath) {
                const imgEl = document.getElementById('sidebarAvatarImg');
                if (imgEl) {
                    imgEl.src = t.imagePath;
                    imgEl.style.display = 'block';
                }
                const fallbackEl = document.getElementById('sidebarAvatarFallback');
                if (fallbackEl) fallbackEl.style.display = 'none';
            }`;

const newAvatarLogic = `const resolvedAvatar = resolveImg(t.imagePath || 'imges/edge-square.jpg');
            const imgEl = document.getElementById('sidebarAvatarImg');
            const fallbackEl = document.getElementById('sidebarAvatarFallback');
            if (imgEl) {
                imgEl.src = resolvedAvatar;
                imgEl.style.display = 'block';
            }
            if (fallbackEl) {
                fallbackEl.style.display = 'none';
                fallbackEl.textContent = (t.name || '').trim().charAt(0) || 'م';
            }`;

if (html.includes(oldAvatarLogic)) {
    html = html.replace(oldAvatarLogic, newAvatarLogic);
    console.log('✅ Updated avatar logic in renderTeacherDashboard');
}

// Add sideBadgeSales population
const oldBadgesTarget = `setSafeText('sideBadgeInactive', (_an.inactiveStudents || []).length);`;
const newBadgesTarget = `setSafeText('sideBadgeInactive', (_an.inactiveStudents || []).length);
            const _salesSummary = _an.salesSummary || {};
            setSafeText('sideBadgeSales', \`\${_salesSummary.totalSales || 0} ج\`);`;

if (html.includes(oldBadgesTarget) && !html.includes('sideBadgeSales')) {
    html = html.replace(oldBadgesTarget, newBadgesTarget);
    console.log('✅ Added sideBadgeSales update');
}

fs.writeFileSync(dashPath, html, 'utf8');
console.log('🎉 Successfully rebuilt teacher-dashboard.html layout and sidebar!');

