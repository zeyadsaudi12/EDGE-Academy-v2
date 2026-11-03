const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'teacher-profile.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Add CSS for hero actions and follow button if not present
const cssAdd = `
.tp-hero-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 18px;
}
.tp-action-btn {
    background: #1a6bdb;
    color: #ffffff !important;
    border: 1px solid rgba(255,255,255,0.25);
    padding: 8px 18px;
    border-radius: 50px;
    font-size: 0.9rem;
    font-weight: 700;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
}
.tp-action-btn:hover {
    background: #1656b0;
    transform: translateY(-2px);
}
.tp-action-outline {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.25);
}
.tp-action-outline:hover {
    background: rgba(255,255,255,0.22);
}
.tp-follow-btn {
    background: #00b894;
    color: #ffffff !important;
    border: none;
    padding: 8px 20px;
    border-radius: 50px;
    font-size: 0.9rem;
    font-weight: 800;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.22s ease;
    font-family: inherit;
}
.tp-follow-btn:hover {
    background: #00997b;
    transform: translateY(-2px);
}
.tp-follow-btn.following {
    background: rgba(230,57,70,0.85);
}
.tp-follow-btn.following:hover {
    background: #e63946;
}
`;

if (!html.includes('.tp-hero-actions')) {
    html = html.replace('.tp-stat-pill strong {', cssAdd + '\n.tp-stat-pill strong {');
}

// 2. Replace the script section
const scriptStartIdx = html.indexOf('(() => {');
const scriptEndIdx = html.indexOf('})();', scriptStartIdx);

if (scriptStartIdx !== -1 && scriptEndIdx !== -1) {
    const newScript = `(() => {
    const apiUrl = window.location.origin + (window.location.pathname.includes('/masar') ? '/masar' : '');
    const teacherId = new URLSearchParams(window.location.search).get('id');
    let teacherCourses = [];
    let teacherStandaloneVideos = [];
    let activeGrade = 'all';
    let studentGrade = '';
    let isFollowing = false;
    let followerCount = 0;

    const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
    const imageUrl = value => value && String(value).startsWith('/uploads/') ? apiUrl + value : (value || 'imges/st.jpg');
    const isForGrade = (item, grade) => {
        if (!grade || grade.toLowerCase() === 'all' || grade === 'الكل') return true;
        if (!Array.isArray(item.grades) || !item.grades.length) return true;
        return item.grades.some(g => String(g).trim().toLowerCase() === String(grade).trim().toLowerCase());
    };

    function showError(message) {
        document.getElementById('tpHeroContainer').innerHTML = \`<div class="tp-hero-details"><h1 class="tp-teacher-name">تعذّر تحميل صفحة المدرس</h1><p class="tp-bio-text">\${escapeHtml(message)}</p><a class="cv-play-btn" href="teachers">العودة إلى المعلمين</a></div>\`;
        document.getElementById('tpCoursesGrid').innerHTML = \`<div class="tp-empty-box"><i class="fas fa-triangle-exclamation"></i><h3>تعذّر تحميل الكورسات</h3><p>\${escapeHtml(message)}</p><button class="tp-chip active" onclick="location.reload()">إعادة المحاولة</button></div>\`;
    }

    function renderCourses() {
        const grid = document.getElementById('tpCoursesGrid');
        const search = document.getElementById('tpSearchInput').value.trim().toLowerCase();
        const filteredCourses = teacherCourses.filter(course => isForGrade(course, activeGrade) && (!search || \`\${course.title || ''} \${course.description || ''}\`.toLowerCase().includes(search)));
        const filteredVideos = teacherStandaloneVideos.filter(video => isForGrade(video, activeGrade) && (!search || \`\${video.title || ''}\`.toLowerCase().includes(search)));
        document.getElementById('tpCoursesCountText').textContent = \`\${filteredCourses.length + filteredVideos.length} محتوى\`;
        if (!filteredCourses.length && !filteredVideos.length) {
            grid.innerHTML = '<div class="tp-empty-box"><i class="fas fa-folder-open"></i><h3>لا توجد كورسات متاحة حاليًا</h3><p>جرّب تغيير المرحلة أو البحث باسم مختلف.</p></div>';
            return;
        }
        const courseCards = filteredCourses.map(course => {
            const price = Number(course.price) > 0 ? \`\${course.price} جنيه\` : 'الاشتراك بكود';
            const lectures = Number(course.videoCount) || 0;
            return \`<article class="course-card" style="cursor:pointer;" onclick="location.href='course-view?id=\${encodeURIComponent(course._id)}'">
                <div class="course-thumb-wrap"><span class="course-price-badge-overlay">\${price}</span><img src="\${escapeHtml(imageUrl(course.imagePath))}" class="course-thumb" alt="\${escapeHtml(course.title)}" onerror="this.onerror=null;this.src='imges/st.jpg'"></div>
                <div class="course-body"><h3 class="course-title">\${escapeHtml(course.title)}</h3><p style="color:var(--gray);font-size:.87rem;min-height:42px;margin:6px 0 12px;">\${escapeHtml(course.description || 'كورس تعليمي شامل')}</p><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span class="course-price" style="margin:0;">\${price}</span><span style="font-size:.82rem;color:var(--gray);"><i class="fas fa-video"></i> \${lectures} محاضرة</span></div><a class="btn-enter" href="course-view?id=\${encodeURIComponent(course._id)}" onclick="event.stopPropagation()">عرض الكورس</a></div>
            </article>\`;
        }).join('');
        const videoCards = filteredVideos.map(video => {
            const price = video.price === null || video.price === undefined ? 'مجاني' : (Number(video.price) > 0 ? \`\${video.price} جنيه\` : 'الاشتراك بكود');
            const user = (() => { try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch (_) { return null; } })();
            const subscribed = user && (user.subscribedVideos || []).map(String).includes(String(video._id));
            return \`<article class="course-card"><div class="course-thumb-wrap"><span class="course-price-badge-overlay">\${price}</span><img src="\${escapeHtml(imageUrl(video.imagePath))}" class="course-thumb" alt="\${escapeHtml(video.title)}" onerror="this.onerror=null;this.src='imges/st.jpg'"></div><div class="course-body"><h3 class="course-title">\${escapeHtml(video.title)}</h3><p style="color:var(--gray);font-size:.87rem;min-height:42px;margin:6px 0 12px;">محاضرة منفصلة</p><a class="btn-enter" href="javascript:watchVideo('\${video._id}')">\${subscribed ? 'مشاهدة المحاضرة' : 'الاشتراك في المحاضرة'}</a></div></article>\`;
        }).join('');
        grid.innerHTML = courseCards + videoCards;
    }

    window.filterTeacherGrade = (grade, button) => {
        activeGrade = grade;
        document.querySelectorAll('#tpGradeChips .tp-chip').forEach(chip => chip.classList.remove('active'));
        if (button) button.classList.add('active');
        renderCourses();
    };
    window.applyTeacherFilter = renderCourses;

    window.toggleFollowTeacher = async () => {
        const currentUser = (() => { try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch (_) { return null; } })();
        if (!currentUser) {
            alert('يجب تسجيل الدخول أولاً لمتابعة المعلم');
            window.location.href = 'login';
            return;
        }
        try {
            const res = await fetch(\`\${apiUrl}/api/users/\${currentUser._id}/follow\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacherId })
            });
            const data = await res.json();
            if (data.success) {
                isFollowing = data.isFollowing;
                currentUser.followedTeachers = data.followedTeachers;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                const btn = document.getElementById('tpFollowBtn');
                const countEl = document.getElementById('tpFollowersCount');
                if (btn) {
                    btn.classList.toggle('following', isFollowing);
                    btn.innerHTML = \`<i class="fas \${isFollowing ? 'fa-user-check' : 'fa-user-plus'}"></i> <span id="tpFollowBtnText">\${isFollowing ? 'إلغاء المتابعة' : 'متابعة المعلم'}</span>\`;
                }
                if (countEl) {
                    followerCount = Math.max(0, followerCount + (isFollowing ? 1 : -1));
                    countEl.textContent = followerCount;
                }
            }
        } catch (err) {
            console.error('Follow error:', err);
        }
    };

    async function loadTeacherProfile() {
        if (!teacherId || !/^[a-f\\d]{24}$/i.test(teacherId)) return showError('رابط المدرس غير صالح.');
        try {
            const [teacherResponse, coursesResponse, videosResponse] = await Promise.all([
                fetch(\`\${apiUrl}/api/teachers/\${encodeURIComponent(teacherId)}\`),
                fetch(\`\${apiUrl}/api/courses\`),
                fetch(\`\${apiUrl}/api/videos\`)
            ]);
            const teacherData = await teacherResponse.json();
            const coursesData = await coursesResponse.json();
            const videosData = await videosResponse.json();
            if (!teacherResponse.ok) throw new Error(teacherData.message || 'المدرس غير موجود.');
            if (!coursesResponse.ok || !Array.isArray(coursesData)) throw new Error(coursesData.message || 'تعذّر تحميل الكورسات.');
            if (!videosResponse.ok || !Array.isArray(videosData)) throw new Error(videosData.message || 'تعذّر تحميل المحاضرات.');
            
            const teacher = teacherData;
            const currentUser = (() => { try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch (_) { return null; } })();
            const isStudent = currentUser && currentUser.role === 'student';
            const isTeacher = currentUser && currentUser.role === 'teacher';
            const isAdmin = currentUser && currentUser.role === 'admin';
            const isThisTeacher = isTeacher && String(currentUser.teacherId) === String(teacherId);

            // Fetch follower count
            try {
                const fcRes = await fetch(\`\${apiUrl}/api/teachers/follower-counts\`);
                if (fcRes.ok) {
                    const counts = await fcRes.json();
                    followerCount = counts[teacherId] || 0;
                }
            } catch (_) {}

            if (isStudent && Array.isArray(currentUser.followedTeachers)) {
                isFollowing = currentUser.followedTeachers.map(String).includes(String(teacherId));
            }

            // Only actual students get restricted to their grade by default
            studentGrade = isStudent && currentUser.grade && currentUser.grade !== 'All' && currentUser.grade !== 'الكل'
                ? String(currentUser.grade).trim()
                : '';

            // Store all courses and videos for this teacher
            teacherCourses = coursesData.filter(course => String(course.teacherId) === String(teacherId) && !course.hidden);
            teacherStandaloneVideos = videosData.filter(video => String(video.teacherId) === String(teacherId) && !video.courseId && !video.hidden);

            document.title = \`\${teacher.name} | EDGE Academy\`;

            // Build hero action buttons based on user role
            let actionButtonsHtml = '';
            if (isThisTeacher) {
                actionButtonsHtml = \`<a href="teacher-dashboard" class="tp-action-btn"><i class="fas fa-chart-line"></i> لوحة متابعة طلابك</a>\`;
            } else if (isAdmin) {
                actionButtonsHtml = \`
                    <a href="teacher-dashboard?teacherId=\${encodeURIComponent(teacherId)}" class="tp-action-btn"><i class="fas fa-chart-line"></i> لوحة المعلم</a>
                    <a href="admin" class="tp-action-btn tp-action-outline"><i class="fas fa-edit"></i> لوحة الإدارة</a>
                \`;
            } else {
                // Students and visitors see the follow button
                actionButtonsHtml = \`
                    <button id="tpFollowBtn" class="tp-follow-btn \${isFollowing ? 'following' : ''}" onclick="toggleFollowTeacher()">
                        <i class="fas \${isFollowing ? 'fa-user-check' : 'fa-user-plus'}"></i>
                        <span id="tpFollowBtnText">\${isFollowing ? 'إلغاء المتابعة' : 'متابعة المعلم'}</span>
                    </button>
                \`;
            }

            document.getElementById('tpHeroContainer').innerHTML = \`
                <div class="tp-avatar-box">
                    <img class="tp-avatar-img" src="\${escapeHtml(imageUrl(teacher.imagePath || 'imges/man.png'))}" alt="\${escapeHtml(teacher.name)}" onerror="this.onerror=null;this.src='imges/man.png'">
                    <span class="tp-avatar-badge"><i class="fas fa-check"></i></span>
                </div>
                <div class="tp-hero-details">
                    <h1 class="tp-teacher-name">\${escapeHtml(teacher.name)}</h1>
                    <span class="tp-subject-tag"><i class="fas fa-book"></i> \${escapeHtml(teacher.subjectAr || 'مدرس')}</span>
                    <p class="tp-bio-text">\${escapeHtml(teacher.bio || 'مدرس متميز على منصة EDGE Academy.')}</p>
                    <div class="tp-stats-row">
                        <div class="tp-stat-pill"><i class="fas fa-layer-group"></i><strong>\${teacherCourses.length + teacherStandaloneVideos.length}</strong> محتوى متاح</div>
                        <div class="tp-stat-pill"><i class="fas fa-users"></i><strong id="tpFollowersCount">\${followerCount}</strong> متابع</div>
                        <div class="tp-stat-pill"><i class="fas fa-star"></i><strong>\${teacher.rating || 5}</strong> تقييم المعلم</div>
                    </div>
                    <div class="tp-hero-actions">
                        \${actionButtonsHtml}
                    </div>
                </div>
            \`;

            const grades = [...new Set([...teacherCourses, ...teacherStandaloneVideos].flatMap(item => Array.isArray(item.grades) ? item.grades : []).filter(Boolean))];
            const chips = document.getElementById('tpGradeChips');

            activeGrade = studentGrade || 'all';

            let chipsHtml = '';
            if (studentGrade) {
                chipsHtml += \`<button class="tp-chip active" data-grade="\${escapeHtml(studentGrade)}" onclick="filterTeacherGrade(this.dataset.grade, this)"><i class="fas fa-graduation-cap"></i> مرحلتك: \${escapeHtml(studentGrade)}</button>\`;
                chipsHtml += \`<button class="tp-chip" data-grade="all" onclick="filterTeacherGrade('all', this)"><i class="fas fa-border-all"></i> جميع المراحل</button>\`;
            } else {
                chipsHtml += \`<button class="tp-chip active" data-grade="all" onclick="filterTeacherGrade('all', this)"><i class="fas fa-border-all"></i> جميع المراحل</button>\`;
            }

            grades.forEach(grade => {
                if (grade !== studentGrade) {
                    chipsHtml += \`<button class="tp-chip \${activeGrade === grade ? 'active' : ''}" data-grade="\${escapeHtml(grade)}" onclick="filterTeacherGrade(this.dataset.grade, this)">\${escapeHtml(grade)}</button>\`;
                }
            });

            chips.innerHTML = chipsHtml;
            renderCourses();
        } catch (error) {
            console.error('Teacher profile load error:', error);
            showError(error.message || 'تعذّر الاتصال بالخادم.');
        }
    }
    document.addEventListener('DOMContentLoaded', loadTeacherProfile);
})();`;

    html = html.substring(0, scriptStartIdx) + newScript + html.substring(scriptEndIdx + 5);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log('✅ Successfully updated teacher-profile.html');
} else {
    console.error('❌ Could not locate script block in teacher-profile.html');
}

