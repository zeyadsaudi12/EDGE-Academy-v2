const fs = require('fs');
let html = fs.readFileSync('play-study.html', 'utf8');

// 1. Remove the general subject picker completely: strict lecture-only mode!
const oldSubjectPickerAndButton = `                <!-- Or Quick General Challenge Option -->
                <div style="background:var(--ps-card-alt); border:1px solid var(--ps-border); border-radius:16px; padding:18px; margin-bottom:24px;">
                    <h4 style="margin:0 0 10px; font-weight:800; font-size:0.92rem; color:var(--ps-text);">أو اختر تحدياً عاماً حسب المادة:</h4>
                    <div class="subject-pick-grid" style="margin-bottom:0;">
                        <button class="subject-btn active" data-sub="الكل" onclick="pickSubject('الكل', this)">🎲 مكس عام</button>
                        <button class="subject-btn" data-sub="اللغة العربية" onclick="pickSubject('اللغة العربية', this)">📖 عربي</button>
                        <button class="subject-btn" data-sub="اللغة الإنجليزية" onclick="pickSubject('اللغة الإنجليزية', this)">🇬🇧 إنجليزي</button>
                        <button class="subject-btn" data-sub="الفيزياء" onclick="pickSubject('الفيزياء', this)">⚡ فيزياء</button>
                        <button class="subject-btn" data-sub="العلوم والكيمياء" onclick="pickSubject('العلوم والكيمياء', this)">🧪 كيمياء</button>
                        <button class="subject-btn" data-sub="الرياضيات" onclick="pickSubject('الرياضيات', this)">📐 رياضيات</button>
                        <button class="subject-btn" data-sub="الأحياء" onclick="pickSubject('الأحياء', this)">🧬 أحياء</button>
                    </div>
                </div>

                <button class="btn-launch-quiz" id="btnLaunchQuiz" onclick="startPlayStudyQuiz()">
                    <i class="fas fa-play"></i> ابدأ التحدي الآن (يستهلك 1 طاقة)
                </button>`;

const newLobbyOnlyWatched = `                <!-- Start Button (Enabled ONLY when a watched lecture is selected) -->
                <button class="btn-launch-quiz" id="btnLaunchQuiz" onclick="startPlayStudyQuiz()" disabled style="background:#94a3b8; cursor:not-allowed; opacity:0.85;">
                    <i class="fas fa-lock" id="btnLaunchIcon"></i> <span id="btnLaunchText">حدد محاضرة شاهدتها لبدء التحدي</span>
                </button>`;

if (html.includes(oldSubjectPickerAndButton)) {
    html = html.replace(oldSubjectPickerAndButton, newLobbyOnlyWatched);
    console.log('✅ Replaced generic picker with strict lecture-locked launch button');
} else {
    console.error('❌ Could not find oldSubjectPickerAndButton');
}

// 2. Add "Exit Quiz" button in quizPlayView header
const oldPlayViewHeader = `                <div class="arena-header">
                    <h2><i class="fas fa-question-circle" style="color:#00b894;"></i> السؤال <span id="qCurrentIndex">1</span> من 5</h2>
                    <div id="quizTimer" style="font-weight:900; color:#e11d48; font-size:1.1rem;"><i class="fas fa-stopwatch"></i> <span id="timerVal">20</span> ث</div>
                </div>`;

const newPlayViewHeader = `                <div class="arena-header">
                    <h2><i class="fas fa-question-circle" style="color:#00b894;"></i> السؤال <span id="qCurrentIndex">1</span> من 5</h2>
                    <div style="display:flex; align-items:center; gap:16px;">
                        <div id="quizTimer" style="font-weight:900; color:#e11d48; font-size:1.1rem;"><i class="fas fa-stopwatch"></i> <span id="timerVal">25</span> ث</div>
                        <!-- Exit Button (Cancels game & consumes attempt) -->
                        <button onclick="confirmExitQuiz()" type="button" style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; padding:6px 14px; border-radius:10px; font-weight:800; font-size:0.82rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                            <i class="fas fa-sign-out-alt"></i> انسحاب وخروج
                        </button>
                    </div>
                </div>`;

if (html.includes(oldPlayViewHeader)) {
    html = html.replace(oldPlayViewHeader, newPlayViewHeader);
    console.log('✅ Added exit button to quizPlayView header');
}

// 3. Update selectWatchedLecture to enable the start button
const oldSelectWatched = `    window.selectWatchedLecture = (videoId, cardEl) => {
        selectedVideoId = videoId;
        document.querySelectorAll('.watched-lec-card').forEach(c => {
            c.style.borderColor = 'var(--ps-border)';
            c.style.background = 'var(--ps-card)';
        });
        if (cardEl) {
            cardEl.style.borderColor = '#1a6bdb';
            cardEl.style.background = 'rgba(26,107,219,0.06)';
        }
        // Deselect generic subject buttons
        document.querySelectorAll('.subject-pick-grid .subject-btn').forEach(b => b.classList.remove('active'));
    };`;

const newSelectWatched = `    window.selectWatchedLecture = (videoId, cardEl) => {
        selectedVideoId = videoId;
        document.querySelectorAll('.watched-lec-card').forEach(c => {
            c.style.borderColor = 'var(--ps-border)';
            c.style.background = 'var(--ps-card)';
        });
        if (cardEl) {
            cardEl.style.borderColor = '#1a6bdb';
            cardEl.style.background = 'rgba(26,107,219,0.06)';
        }
        
        // Enable Start Button
        const btn = document.getElementById('btnLaunchQuiz');
        const icon = document.getElementById('btnLaunchIcon');
        const text = document.getElementById('btnLaunchText');
        if (btn) {
            btn.disabled = false;
            btn.style.background = 'linear-gradient(135deg, #1a6bdb, #00b894)';
            btn.style.cursor = 'pointer';
            btn.style.opacity = '1';
            if (icon) icon.className = 'fas fa-play';
            if (text) text.textContent = 'ابدأ التحدي الآن (يستهلك 1 طاقة)';
        }
    };`;

html = html.replace(oldSelectWatched, newSelectWatched);

// 4. In renderWatchedLecturesGrid when 0 lectures watched, keep launch button disabled and show warning
const oldZeroLectures = `if (!lectures || lectures.length === 0) {`;
const newZeroLectures = `if (!lectures || lectures.length === 0) {
            const btn = document.getElementById('btnLaunchQuiz');
            if (btn) {
                btn.disabled = true;
                btn.style.background = '#94a3b8';
                btn.style.cursor = 'not-allowed';
                btn.style.opacity = '0.7';
                document.getElementById('btnLaunchText').textContent = 'يجب مشاهدة محاضرة أولاً لفتح التحدي';
            }
`;

html = html.replace(oldZeroLectures, newZeroLectures);

// 5. Add confirmExitQuiz function
const exitQuizFunction = `
    window.confirmExitQuiz = async () => {
        const res = await Swal.fire({
            title: 'هل تريد الانسحاب حقاً؟',
            text: 'إذا خرجت الآن، سيتم اعتبار المحاولة مكتملة وسيتم خصمها من محاولاتك اليومية (4/4) ولن تكسب أي نقاط!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، انسحاب وخروج',
            cancelButtonText: 'متابعة التحدي',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#1a6bdb'
        });

        if (res.isConfirmed) {
            clearInterval(timerInterval);
            document.getElementById('quizPlayView').style.display = 'none';
            document.getElementById('quizLobbyView').style.display = 'block';

            // Reset selection
            selectedVideoId = null;
            document.querySelectorAll('.watched-lec-card').forEach(c => {
                c.style.borderColor = 'var(--ps-border)';
                c.style.background = 'var(--ps-card)';
            });
            const btn = document.getElementById('btnLaunchQuiz');
            if (btn) {
                btn.disabled = true;
                btn.style.background = '#94a3b8';
                btn.style.cursor = 'not-allowed';
                btn.style.opacity = '0.85';
                document.getElementById('btnLaunchText').textContent = 'حدد محاضرة شاهدتها لبدء التحدي';
                document.getElementById('btnLaunchIcon').className = 'fas fa-lock';
            }

            Swal.fire({
                icon: 'info',
                title: 'تم الانسحاب',
                text: 'تم إنهاء الجلسة واحتساب المحاولة المستهلكة من رصيد الطاقة اليومي.',
                timer: 2000,
                showConfirmButton: false
            });

            loadPlayStudyProfile();
        }
    };
`;

html = html.replace(`window.returnToLobby = () => {`, `${exitQuizFunction}\n    window.returnToLobby = () => {`);

fs.writeFileSync('play-study.html', html, 'utf8');
console.log('🎉 Successfully applied strict watched-only lock and exit with consumed attempt!');

