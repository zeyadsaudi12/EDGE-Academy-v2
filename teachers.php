<?php
$page_title = "المعلمون | EDGE Academy";
$active_tab = 'teachers';
$body_class = "royal-dashboard";
include 'header.php';
?>

    <div class="royal-wrapper">
        <!-- كارت تفاصيل المعلم -->
        <aside class="royal-sidebar" style="text-align: center;">
            <div class="avatar-container" style="width: 140px; height: 140px; margin-bottom: 20px;">
                <img src="" id="teacherAvatar" class="sidebar-avatar" style="width: 100%; height: 100%; border-radius: 50%;">
            </div>
            <h2 id="teacherName" style="font-size: 1.5rem; font-weight: 800; margin-bottom: 5px;">-</h2>
            <p id="teacherSubject" style="color: var(--primary-red); font-weight: 700; margin-bottom: 15px;">-</p>
            <p id="teacherBio" style="color: var(--gray); font-size: 0.95rem; line-height: 1.6;">-</p>
            <button id="followBtn" onclick="toggleFollow()" class="btn-royal-action" style="margin-top: 15px; width: 100%;">متابعة</button>
        </aside>

        <!-- منطقة الفيديوهات الخاصة بالمعلم للمرحلة الدراسية للطالب -->
        <main class="royal-content">
            <div class="glass-section-title">
                <h3><i class="fas fa-graduation-cap"></i> المحاضرات المتاحة لك مع هذا المعلم</h3>
            </div>
            
            <!-- شبكة عرض الفيديوهات المفلترة -->
            <div class="video-grid" id="teacherVideos" style="display: flex; flex-wrap: wrap; gap: 20px; padding: 0;">
                <p style="color: var(--gray); text-align: center; width: 100%;">جاري تحميل المحاضرات المخصصة لمرحلتك...</p>
            </div>
        </main>
    </div>

    <!-- SweetAlert2 -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="script.js" defer></script>
    <script>
       document.addEventListener('DOMContentLoaded', async () => {
            const API_URL = localStorage.getItem('apiUrl') || window.location.origin + (window.location.pathname.includes('/masar') ? '/masar' : '');
            const urlParams = new URLSearchParams(window.location.search);
            const teacherId = urlParams.get('teacherId');
            
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const studentGrade = currentUser ? currentUser.grade : null;

            let isFollowing = false;

            // ─── السيناريو الأول: إذا فتحت الصفحة العامة (تصفح جميع المعلمين) ───
            if (!teacherId) {
                // إخفاء الشريط الجانبي الفردي
                const sidebar = document.querySelector('.royal-sidebar');
                if (sidebar) sidebar.style.display = 'none';

                // جعل الحاوية تفرش الصفحة بالكامل (عرض 100%) لحل مشكلة التكدس الجانبي
                const wrapper = document.querySelector('.royal-wrapper');
                if (wrapper) wrapper.style.display = 'block';

                const content = document.querySelector('.royal-content');
                if (content) {
                    content.style.width = '100%';
                    content.innerHTML = `
                        <div class="glass-section-title">
                            <h3><i class="fas fa-users"></i> جميع معلمي منصة EDGE Academy</h3>
                        </div>
                        <div class="teachers-grid" id="allTeachersGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 25px; margin-top: 20px;">
                            <p style="color: var(--gray); text-align: center; width: 100%;">جاري تحميل المعلمين...</p>
                        </div>
                    `;
                }

                try {
                    const res = await fetch(`${API_URL}/api/teachers`);
                    const teachers = await res.json();
                    const grid = document.getElementById('allTeachersGrid');

                    if (!teachers || teachers.length === 0) {
                        grid.innerHTML = `<p style="color: var(--gray); text-align: center; width: 100%;">لا يوجد معلمون مضافون حالياً.</p>`;
                        return;
                    }

                    function resolveTeacherImg(path) {
                        if (!path) return 'imges/man.png';
                        if (path.startsWith('http')) return path;
                        if (path.startsWith('/uploads/')) return API_URL + path;
                        if (path.startsWith('uploads/')) return API_URL + '/' + path;
                        return path;
                    }

                    // رندر كروت جميع المعلمين بشكل شبكي منسق مع مسارات الصور الصحيحة
                    grid.innerHTML = teachers.map(teacher => {
                        const avatarUrl = resolveTeacherImg(teacher.imagePath);
                        return `
                            <div class="teacher-card" style="background: var(--p-bg); border: 1px solid var(--p-border); box-sizing: border-box;">
                                <div class="teacher-avatar-container" style="width: 120px; height: 120px; margin: 0 auto 15px;">
                                    <div class="teacher-avatar" style="width: 120px; height: 120px;">
                                        <img src="${avatarUrl}" alt="${teacher.name}" onerror="this.src='imges/man.png'" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                                    </div>
                                </div>
                                <h3 class="teacher-name">${teacher.name}</h3>
                                <p class="teacher-subject">${teacher.subjectAr || 'معلم'}</p>
                                <button class="teacher-btn" onclick="window.location.href='teacher-profile.php?id=${teacher._id}'" style="margin-top: 15px; width: 100%;">تصفح الكورسات والبروفايل</button>
                            </div>
                        `;
                    }).join('');

                } catch (err) {
                    console.error(err);
                    const grid = document.getElementById('allTeachersGrid');
                    if (grid) grid.innerHTML = `<p style="color: red; text-align: center; width: 100%;">حدث خطأ في الاتصال بالخادم.</p>`;
                }
                return; // إيقاف تنفيذ السيناريو الفردي
            }

            // ─── السيناريو الثاني: إذا تم فتح الصفحة لمعلم محدد (الكود القديم يعمل كما هو) ───
            if (currentUser) {
                isFollowing = (currentUser.followedTeachers || []).includes(teacherId);
                updateFollowButton();
            }

            function updateFollowButton() {
                const btn = document.getElementById('followBtn');
                if (!btn) return;
                if (isFollowing) {
                    btn.textContent = 'إلغاء المتابعة';
                    btn.style.background = '#e63946'; 
                    btn.style.color = '#fff';
                } else {
                    btn.textContent = 'متابعة المعلم';
                    btn.style.background = 'var(--primary-red)';
                    btn.style.color = '#13201c';
                }
            }

            window.toggleFollow = async function() {
                if (!currentUser) { alert('يجب تسجيل الدخول أولاً لمتابعة المعلم'); window.location.href = 'login.php'; return; }
                try {
                    const res = await fetch(`${API_URL}/api/users/${currentUser._id}/follow`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ teacherId })
                    });
                    const data = await res.json();
                    if (data.success) {
                        isFollowing = data.isFollowing;
                        currentUser.followedTeachers = data.followedTeachers;
                        localStorage.setItem('currentUser', JSON.stringify(currentUser)); 
                        updateFollowButton();
                    }
                } catch (err) {
                    console.error(err);
                }
            };

            try {
                const teacherRes = await fetch(`${API_URL}/api/teachers`);
                const teachers = await teacherRes.json();
                const teacher = teachers.find(t => t._id === teacherId);

                if (!teacher) {
                    alert('المعلم غير موجود');
                    window.location.href = 'index.php';
                    return;
                }

                document.getElementById('teacherAvatar').src = teacher.imagePath || 'imges/1.png';
                document.getElementById('teacherName').textContent = teacher.name;
                document.getElementById('teacherSubject').textContent = teacher.subjectAr;
                document.getElementById('teacherBio').textContent = teacher.bio;

                const videoRes = await fetch(`${API_URL}/api/videos`);
                const allVideos = await videoRes.json();

                const filteredVideos = allVideos.filter(video => {
                    const matchTeacher = video.teacherId === teacherId;
                    const matchGrade = !studentGrade || !video.grades || video.grades.length === 0 || video.grades.includes(studentGrade);
                    return matchTeacher && matchGrade;
                });

                const container = document.getElementById('teacherVideos');
                if (filteredVideos.length === 0) {
                    container.innerHTML = `<p style="color: var(--gray); text-align: center; width: 100%; padding: 40px 0;">لا توجد محاضرات متاحة لمرحلتك الدراسية (${studentGrade || 'عام'}) مع هذا المعلم حالياً.</p>`;
                    return;
                }

                container.innerHTML = filteredVideos.map(video => {
                    const isSubscribed = currentUser && (currentUser.subscribedVideos || []).includes(video._id);
                    const actionButtonHTML = isSubscribed
                        ? `<button class="btn-join" onclick="watchVideo('${video._id}')" style="width:100%;">مشاهدة المحاضرة !</button>`
                        : `<button class="btn-enter" onclick="subscribeVideo('${video._id}')" style="width:100%;">اشترك الآن 💰</button>`;

                    return `
                        <div class="course-card" style="flex: 0 0 320px; box-sizing: border-box;">
                            <img src="${video.imagePath || 'imges/st.jpg'}" class="course-thumb" alt="${video.title}">
                            <div class="course-body">
                                <h3 class="course-title">${video.title}</h3>
                                <div class="course-price">${video.price || 0} ج.م</div>
                                <div class="course-btns">
                                    ${actionButtonHTML}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

            } catch (err) {
                console.error(err);
            }
        });
    </script>

<?php include 'footer.php'; ?>
