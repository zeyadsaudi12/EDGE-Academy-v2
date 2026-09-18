<?php
$page_title = "المواد الدراسية والمعلمون | EDGE Academy";
$active_tab = 'subjects';
$body_class = "subjects-page";
$extra_headers = '
<style>
/* ═══════════════════════════════════════════════
   SUBJECTS DIRECTORY PAGE — EDGE ACADEMY
═══════════════════════════════════════════════ */

/* Hero Banner */
.subjects-hero {
    background: linear-gradient(135deg, #1f2937 0%, #111827 50%, #7b1fa2 100%);
    padding: 65px 5% 45px;
    text-align: center;
    color: #fff;
    position: relative;
    overflow: hidden;
}
.subjects-hero::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -20%;
    width: 140%;
    height: 200%;
    background: radial-gradient(circle, rgba(231,111,81,0.18) 0%, transparent 60%);
    pointer-events: none;
}
.subjects-hero h1 {
    font-size: 2.3rem;
    font-weight: 900;
    margin-bottom: 12px;
    letter-spacing: -0.5px;
    position: relative;
    z-index: 1;
}
.subjects-hero p {
    font-size: 1.1rem;
    color: #e5e7eb;
    max-width: 650px;
    margin: 0 auto;
    line-height: 1.6;
    position: relative;
    z-index: 1;
}

/* User Grade Badge In Hero */
.student-grade-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(231, 111, 81, 0.2);
    border: 1px solid rgba(231, 111, 81, 0.4);
    color: #ff9e7d;
    padding: 6px 18px;
    border-radius: 999px;
    font-size: 0.9rem;
    font-weight: 700;
    margin-top: 15px;
    position: relative;
    z-index: 1;
}

/* Grade Filter Sticky Bar */
.subjects-grade-bar {
    background: var(--surface, #ffffff);
    border-bottom: 1px solid var(--border, #e5e7eb);
    padding: 16px 5%;
    display: flex;
    align-items: center;
    gap: 10px;
    position: sticky;
    top: 64px;
    z-index: 150;
    backdrop-filter: blur(12px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
    overflow-x: auto;
    scrollbar-width: thin;
}
.grade-filter-label {
    font-weight: 800;
    color: var(--text-dark, #1f2937);
    font-size: 0.95rem;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: 6px;
}
.grade-chip {
    padding: 8px 18px;
    border-radius: 999px;
    border: 1.5px solid var(--border, #e5e7eb);
    background: var(--surface, #ffffff);
    color: var(--text-dark, #374151);
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    font-family: inherit;
}
.grade-chip:hover {
    border-color: var(--primary-red, #e76f51);
    color: var(--primary-red, #e76f51);
    transform: translateY(-1px);
}
.grade-chip.active {
    background: linear-gradient(135deg, var(--primary-red, #e76f51), #e63946);
    border-color: transparent;
    color: #fff !important;
    box-shadow: 0 4px 12px rgba(231, 111, 81, 0.35);
}

/* Main Container */
.subjects-main-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 35px 5% 60px;
}

/* Single Subject Section Row Block */
.subject-row-block {
    background: var(--surface, #ffffff);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: 20px;
    padding: 24px 28px;
    margin-bottom: 35px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
    transition: all 0.3s ease;
}
.subject-row-block.highlighted-subject {
    border-color: var(--primary-red, #e76f51);
    box-shadow: 0 0 0 3px rgba(231, 111, 81, 0.2), 0 10px 30px rgba(0,0,0,0.08);
    animation: flashHighlight 1.5s ease-out;
}
@keyframes flashHighlight {
    0% { background: rgba(231, 111, 81, 0.12); }
    100% { background: var(--surface, #ffffff); }
}

/* Subject Header with Nav Buttons */
.subject-row-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 1.5px solid var(--border, #e5e7eb);
    flex-wrap: wrap;
    gap: 12px;
}
.subject-row-title-wrap {
    display: flex;
    align-items: center;
    gap: 14px;
}
.subject-icon-box {
    width: 50px;
    height: 50px;
    border-radius: 15px;
    background: linear-gradient(135deg, var(--primary-red, #e76f51), #7b1fa2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 1.4rem;
    box-shadow: 0 5px 15px rgba(231, 111, 81, 0.28);
    flex-shrink: 0;
}
.subject-row-title {
    font-size: 1.35rem;
    font-weight: 900;
    color: var(--text-dark, #111827);
    margin: 0;
}
.subject-row-count {
    display: inline-block;
    font-size: 0.82rem;
    color: var(--gray, #6b7280);
    font-weight: 700;
    margin-top: 3px;
}
.subject-row-nav-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}
.row-nav-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid var(--border, #e5e7eb);
    background: var(--surface-alt, #f9fafb);
    color: var(--text-dark, #374151);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
    transition: all 0.2s ease;
}
.row-nav-btn:hover {
    background: var(--primary-red, #e76f51);
    color: #fff;
    border-color: var(--primary-red, #e76f51);
}

/* Teachers Row — معروضين جمب بعض */
.subject-teachers-row {
    display: flex;
    gap: 20px;
    overflow-x: auto;
    scroll-behavior: smooth;
    padding: 10px 4px 16px;
    scroll-snap-type: x mandatory;
    scrollbar-width: thin;
    scrollbar-color: var(--border, #e5e7eb) transparent;
}
.subject-teachers-row::-webkit-scrollbar {
    height: 6px;
}
.subject-teachers-row::-webkit-scrollbar-thumb {
    background: var(--border, #e5e7eb);
    border-radius: 999px;
}

/* Teacher Card In Row */
.teacher-side-card {
    flex: 0 0 250px;
    min-width: 250px;
    scroll-snap-align: start;
    background: var(--surface-alt, #f9fafb);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: 18px;
    padding: 24px 18px;
    text-align: center;
    cursor: pointer;
    transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.teacher-side-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.09);
    border-color: var(--primary-red, #e76f51);
    background: var(--surface, #ffffff);
}
.teacher-side-avatar-wrap {
    width: 95px;
    height: 95px;
    border-radius: 50%;
    margin-bottom: 14px;
    position: relative;
    padding: 4px;
    background: linear-gradient(135deg, rgba(231,111,81,0.2), rgba(123,31,162,0.2));
}
.teacher-side-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    background: #e2e8f0;
}
.teacher-side-name {
    font-size: 1.12rem;
    font-weight: 800;
    color: var(--text-dark, #111827);
    margin: 0 0 6px 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.teacher-side-subject-badge {
    display: inline-block;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--primary-red, #e76f51);
    background: rgba(231, 111, 81, 0.1);
    padding: 3px 12px;
    border-radius: 999px;
    margin-bottom: 12px;
}
.teacher-side-grades {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
    margin-bottom: 18px;
    min-height: 24px;
}
.grade-pill-tag {
    font-size: 0.72rem;
    font-weight: 600;
    color: #4b5563;
    background: var(--surface, #ffffff);
    border: 1px solid var(--border, #e5e7eb);
    padding: 2px 8px;
    border-radius: 6px;
}
.teacher-side-btn {
    width: 100%;
    padding: 9px 12px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--primary-red, #e76f51), #e63946);
    color: #fff !important;
    font-size: 0.88rem;
    font-weight: 700;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: auto;
    font-family: inherit;
    box-shadow: 0 4px 10px rgba(231, 111, 81, 0.25);
}
.teacher-side-btn:hover {
    opacity: 0.93;
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(231, 111, 81, 0.38);
}

/* Empty State */
.subjects-empty-state {
    text-align: center;
    padding: 70px 20px;
    color: var(--gray, #6b7280);
}
.subjects-empty-state i {
    font-size: 3.5rem;
    color: var(--primary-red, #e76f51);
    opacity: 0.6;
    margin-bottom: 18px;
    display: block;
}
.subjects-empty-state h3 {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--text-dark, #111827);
    margin-bottom: 8px;
}

/* Skeletons */
.skeleton-row {
    background: var(--surface, #fff);
    border-radius: 20px;
    border: 1px solid var(--border, #e5e7eb);
    padding: 24px 28px;
    margin-bottom: 30px;
    animation: pulse 1.5s infinite;
}
.skeleton-header-line {
    width: 220px;
    height: 24px;
    background: var(--border, #e5e7eb);
    border-radius: 8px;
    margin-bottom: 20px;
}
.skeleton-cards-container {
    display: flex;
    gap: 20px;
    overflow: hidden;
}
.skeleton-card-item {
    flex: 0 0 250px;
    height: 280px;
    background: var(--surface-alt, #f3f4f6);
    border-radius: 18px;
}
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
}

@media (max-width: 768px) {
    .subjects-hero h1 { font-size: 1.8rem; }
    .subject-row-block { padding: 18px; }
    .teacher-side-card { flex: 0 0 220px; min-width: 220px; }
}
</style>
';
include 'header.php';
?>

<!-- Hero Section -->
<div class="subjects-hero">
    <h1><i class="fas fa-layer-group"></i> المواد الدراسية ونخبة المعلمين</h1>
    <p>اختر المادة لعرض المعلمين المتخصصين فيها، أو تصفح جميع المواد ومدرسيها مصنفين لكل مرحلة</p>
    <div id="studentGradeIndicator" style="display:none;"></div>
</div>

<!-- Subject Filter Sticky Bar (بديل شريط الصفوف) -->
<div class="subjects-grade-bar" id="subjectsChipsBar">
    <span class="grade-filter-label"><i class="fas fa-book-open"></i> المادة الدراسية:</span>
    <button class="grade-chip active" data-subject="all" onclick="selectSubjectFilter('all')">
        <i class="fas fa-th-large"></i> جميع المواد
    </button>
    <div id="dynamicSubjectChips" style="display: contents;"></div>
</div>

<!-- Main Subjects Content Container -->
<div class="subjects-main-container">
    <!-- Loading Skeletons -->
    <div id="directoryLoading">
        <div class="skeleton-row">
            <div class="skeleton-header-line"></div>
            <div class="skeleton-cards-container">
                <div class="skeleton-card-item"></div>
                <div class="skeleton-card-item"></div>
                <div class="skeleton-card-item"></div>
                <div class="skeleton-card-item"></div>
            </div>
        </div>
        <div class="skeleton-row">
            <div class="skeleton-header-line"></div>
            <div class="skeleton-cards-container">
                <div class="skeleton-card-item"></div>
                <div class="skeleton-card-item"></div>
                <div class="skeleton-card-item"></div>
            </div>
        </div>
    </div>

    <!-- Real Content Area -->
    <div id="directoryContent" style="display:none;"></div>
</div>

<script src="script.js" defer></script>
<script>
// ==========================================
// SUBJECTS DIRECTORY LOGIC
// ==========================================

const SUBJECT_ICONS_MAP = {
    "الرياضيات": "fa-calculator",
    "رياضيات": "fa-calculator",
    "رياضيات وتفاضل": "fa-square-root-variable",
    "تفاضل وتكامل": "fa-infinity",
    "العلوم": "fa-flask",
    "علوم": "fa-flask",
    "اللغة العربية": "fa-book-open",
    "عربي": "fa-book-open",
    "لغة عربية": "fa-book-open",
    "الفيزياء": "fa-atom",
    "فيزياء": "fa-atom",
    "الكيمياء": "fa-vials",
    "كيمياء": "fa-vials",
    "اللغة الإنجليزية": "fa-language",
    "انجليزي": "fa-language",
    "لغة إنجليزية": "fa-language",
    "الأحياء": "fa-dna",
    "أحياء": "fa-dna",
    "أحياء وجيولوجيا": "fa-dna",
    "جيولوجيا": "fa-mountain",
    "برمجه": "fa-laptop-code",
    "برمجة": "fa-laptop-code",
    "حاسب آلي": "fa-computer",
    "تاريخ": "fa-landmark",
    "جغرافيا": "fa-earth-africa",
    "دراسات": "fa-book-atlas",
    "فلسفة": "fa-brain",
    "منطق": "fa-lightbulb",
    "علم نفس": "fa-users-line",
    "تربية دينية": "fa-mosque",
    "دين": "fa-mosque",
    "فرنساوي": "fa-comments",
    "فرنسي": "fa-comments"
};

function getSubjectIconClass(subjectName) {
    if (!subjectName) return 'fa-book';
    const clean = subjectName.trim().toLowerCase();
    for (const [key, icon] of Object.entries(SUBJECT_ICONS_MAP)) {
        if (clean.includes(key.toLowerCase())) {
            return icon;
        }
    }
    return 'fa-book';
}

function resolveCardImg(path, apiBase) {
    if (!path) return 'imges/man.png';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads/')) return apiBase + path;
    if (path.startsWith('uploads/')) return apiBase + '/' + path;
    return path;
}

let loadedTeachersList = [];
let activeSubjectFilter = 'all';
let studentRegisteredGrade = null;

async function initSubjectsDirectoryPage() {
    const apiBase = localStorage.getItem('apiUrl') ||
        window.location.origin + (window.location.pathname.includes('/masar') ? '/masar' : '');

    try {
        const response = await fetch(`${apiBase}/api/teachers`);
        loadedTeachersList = await response.json();
    } catch (err) {
        console.error('Error loading teachers:', err);
        loadedTeachersList = JSON.parse(localStorage.getItem('teachers') || '[]');
    }

    if (!Array.isArray(loadedTeachersList)) {
        loadedTeachersList = [];
    }

    // Check student grade from logged-in user profile
    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch (e) {}

    studentRegisteredGrade = (currentUser && currentUser.grade) ? currentUser.grade.trim() : null;

    // Check if subject is requested via URL query param
    const urlParams = new URLSearchParams(window.location.search);
    const querySubject = urlParams.get('subject');

    if (querySubject && querySubject.trim()) {
        activeSubjectFilter = querySubject.trim();
    } else {
        activeSubjectFilter = 'all';
    }

    // Show indicator if logged-in student has a grade
    const indicator = document.getElementById('studentGradeIndicator');
    if (indicator && studentRegisteredGrade) {
        indicator.style.display = 'inline-flex';
        indicator.className = 'student-grade-badge';
        indicator.innerHTML = `<i class="fas fa-user-graduate"></i> مرحلتك الدراسية المسجلة: <strong>${studentRegisteredGrade}</strong> (المعروض مخصص لصفك)`;
    }

    // Build subject chips bar dynamically from available teachers
    buildSubjectChips();

    // Render Directory
    renderDirectory();
}

function getGradeFilteredTeachers() {
    if (!studentRegisteredGrade) return loadedTeachersList;

    return loadedTeachersList.filter(t => {
        if (!t.grades || !Array.isArray(t.grades) || t.grades.length === 0) return true; // متاح لكل المراحل
        return t.grades.some(g => {
            if (!g) return false;
            const cleanG = g.trim();
            return cleanG === studentRegisteredGrade || studentRegisteredGrade.includes(cleanG) || cleanG.includes(studentRegisteredGrade);
        });
    });
}

function buildSubjectChips() {
    const container = document.getElementById('dynamicSubjectChips');
    if (!container) return;

    const availableTeachers = getGradeFilteredTeachers();

    // Count teachers per subject
    const subjectCounts = {};
    availableTeachers.forEach(t => {
        const s = (t.subjectAr && t.subjectAr.trim()) ? t.subjectAr.trim() : 'أخرى';
        subjectCounts[s] = (subjectCounts[s] || 0) + 1;
    });

    const subjects = Object.keys(subjectCounts);

    container.innerHTML = subjects.map(subj => {
        const icon = getSubjectIconClass(subj);
        const count = subjectCounts[subj];
        const isActive = activeSubjectFilter.toLowerCase() === subj.toLowerCase();

        return `
            <button class="grade-chip ${isActive ? 'active' : ''}" data-subject="${subj}" onclick="selectSubjectFilter('${subj}')">
                <i class="fas ${icon}"></i> ${subj} (${count})
            </button>
        `;
    }).join('');

    syncSubjectChips();
}

function syncSubjectChips() {
    document.querySelectorAll('#subjectsChipsBar .grade-chip').forEach(chip => {
        const chipSubject = chip.dataset.subject;
        if (chipSubject && chipSubject.toLowerCase() === activeSubjectFilter.toLowerCase()) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
}

function selectSubjectFilter(subject) {
    activeSubjectFilter = subject;
    syncSubjectChips();
    renderDirectory();

    // Smooth scroll back to content
    const container = document.getElementById('subjectsContainer') || document.querySelector('.subjects-main-container');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderDirectory() {
    const loadingElem = document.getElementById('directoryLoading');
    const contentElem = document.getElementById('directoryContent');
    const apiBase = localStorage.getItem('apiUrl') ||
        window.location.origin + (window.location.pathname.includes('/masar') ? '/masar' : '');

    const teachersForGrade = getGradeFilteredTeachers();

    if (!teachersForGrade || teachersForGrade.length === 0) {
        loadingElem.style.display = 'none';
        contentElem.style.display = 'block';
        contentElem.innerHTML = `
            <div class="subjects-empty-state">
                <i class="fas fa-chalkboard-teacher"></i>
                <h3>لا يوجد معلمون متاحون حالياً لمرحلتك الدراسية</h3>
                <p>يمكنك مراجعة إدارة المنصة أو استعراض المواد لاحقاً.</p>
            </div>
        `;
        return;
    }

    // Filter by active subject if a specific subject is chosen
    let displayedTeachers = teachersForGrade;
    if (activeSubjectFilter !== 'all') {
        displayedTeachers = teachersForGrade.filter(t => {
            const s = (t.subjectAr && t.subjectAr.trim()) ? t.subjectAr.trim().toLowerCase() : '';
            return s.includes(activeSubjectFilter.toLowerCase()) || activeSubjectFilter.toLowerCase().includes(s);
        });
    }

    if (displayedTeachers.length === 0) {
        loadingElem.style.display = 'none';
        contentElem.style.display = 'block';
        contentElem.innerHTML = `
            <div class="subjects-empty-state">
                <i class="fas fa-search"></i>
                <h3>لا يوجد معلمون مسجلون في مادة (${activeSubjectFilter}) حالياً</h3>
                <p>يمكنك الضغط على "جميع المواد" لرؤية باقي المواد والمعلمين المتاحين.</p>
                <button class="grade-chip active" style="margin-top:15px;" onclick="selectSubjectFilter('all')">
                    <i class="fas fa-th-large"></i> عرض جميع المواد
                </button>
            </div>
        `;
        return;
    }

    // Group teachers by subjectAr
    const subjectGroups = {};
    displayedTeachers.forEach(t => {
        const subj = (t.subjectAr && t.subjectAr.trim()) ? t.subjectAr.trim() : 'مواد أخرى';
        if (!subjectGroups[subj]) subjectGroups[subj] = [];
        subjectGroups[subj].push(t);
    });

    const entries = Object.entries(subjectGroups);

    if (entries.length === 0) {
        loadingElem.style.display = 'none';
        contentElem.style.display = 'block';
        contentElem.innerHTML = `
            <div class="subjects-empty-state">
                <i class="fas fa-book"></i>
                <h3>لا توجد مواد مضافة حتى الآن</h3>
            </div>
        `;
        return;
    }

    contentElem.innerHTML = entries.map(([subject, teachersInSubj], idx) => {
        const safeId = encodeURIComponent(subject);
        const iconClass = getSubjectIconClass(subject);
        const rowId = `row-teachers-${idx}`;
        const countLabel = teachersInSubj.length === 1 ? 'معلم واحد' : teachersInSubj.length === 2 ? 'معلمان' : `${teachersInSubj.length} معلمين`;

        return `
            <div class="subject-row-block" id="subj-block-${safeId}">
                <!-- Header -->
                <div class="subject-row-header">
                    <div class="subject-row-title-wrap">
                        <div class="subject-icon-box">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div>
                            <h2 class="subject-row-title">${subject}</h2>
                            <span class="subject-row-count">${countLabel} متخصصين في هذا المجال</span>
                        </div>
                    </div>
                    <!-- Navigation arrows for smooth horizontal scrolling -->
                    <div class="subject-row-nav-actions">
                        <button class="row-nav-btn" onclick="scrollTeachersRow('${rowId}', 1)" title="التالي" aria-label="التالي">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="row-nav-btn" onclick="scrollTeachersRow('${rowId}', -1)" title="السابق" aria-label="السابق">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    </div>
                </div>

                <!-- Teachers Row: المعلمين معروضين جمب بعض -->
                <div class="subject-teachers-row" id="${rowId}">
                    ${teachersInSubj.map(teacher => {
                        const avatarUrl = resolveCardImg(teacher.imagePath, apiBase);
                        const gradesPills = (teacher.grades && Array.isArray(teacher.grades) && teacher.grades.length > 0)
                            ? teacher.grades.slice(0, 3).map(g => `<span class="grade-pill-tag">${g}</span>`).join('')
                            : `<span class="grade-pill-tag">جميع المراحل</span>`;

                        return `
                            <div class="teacher-side-card" onclick="window.location.href='teacher-profile.php?id=${teacher._id}'">
                                <div class="teacher-side-avatar-wrap">
                                    <img src="${avatarUrl}" alt="${teacher.name}" class="teacher-side-avatar" onerror="this.src='imges/man.png'">
                                </div>
                                <h3 class="teacher-side-name" title="${teacher.name}">${teacher.name}</h3>
                                <span class="teacher-side-subject-badge">${subject}</span>
                                <div class="teacher-side-grades">
                                    ${gradesPills}
                                </div>
                                <a href="teacher-profile.php?id=${teacher._id}" class="teacher-side-btn" onclick="event.stopPropagation();">
                                    <i class="fas fa-play-circle"></i> الكورسات والمحاضرات
                                </a>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');

    loadingElem.style.display = 'none';
    contentElem.style.display = 'block';
}

function scrollTeachersRow(rowId, direction) {
    const row = document.getElementById(rowId);
    if (!row) return;
    const scrollAmount = 280; // card width + gap
    row.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

// Fire on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubjectsDirectoryPage);
} else {
    initSubjectsDirectoryPage();
}
</script>

<?php include 'footer.php'; ?>
