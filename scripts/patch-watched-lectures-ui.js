const fs = require('fs');
let html = fs.readFileSync('play-study.html', 'utf8');

// Replace quizLobbyView with lecture-first mode
const oldLobbyContent = `                <h4 style="margin:0 0 12px; font-weight:800; font-size:0.95rem; color:var(--ps-text);">1. اختر مادة التحدي:</h4>
                <div class="subject-pick-grid">
                    <button class="subject-btn active" data-sub="الكل" onclick="pickSubject('الكل', this)">🎲 مكس شامل</button>
                    <button class="subject-btn" data-sub="اللغة العربية" onclick="pickSubject('اللغة العربية', this)">📖 عربي</button>
                    <button class="subject-btn" data-sub="اللغة الإنجليزية" onclick="pickSubject('اللغة الإنجليزية', this)">🇬🇧 إنجليزي</button>
                    <button class="subject-btn" data-sub="الرياضيات" onclick="pickSubject('الرياضيات', this)">📐 رياضيات</button>
                    <button class="subject-btn" data-sub="الفيزياء" onclick="pickSubject('الفيزياء', this)">⚡ فيزياء</button>
                    <button class="subject-btn" data-sub="العلوم والكيمياء" onclick="pickSubject('العلوم والكيمياء', this)">🧪 كيمياء</button>
                    <button class="subject-btn" data-sub="الأحياء" onclick="pickSubject('الأحياء', this)">🧬 أحياء</button>
                </div>

                <!-- Topic / Unit Selector: Ensures student only gets tested on what they studied! -->
                <div id="topicSelectionArea" style="margin-bottom:24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h4 style="margin:0; font-weight:800; font-size:0.95rem; color:var(--ps-text);">2. حدد الباب أو الجزء الذي درسته:</h4>
                        <span style="font-size:0.78rem; color:#10b981; font-weight:800; background:rgba(16,185,129,0.1); padding:2px 10px; border-radius:50px;">
                            🎯 الأسئلة على ما درسته فقط
                        </span>
                    </div>
                    <div id="topicsChipsList" style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button class="subject-btn active" style="padding:8px 16px; font-size:0.85rem;" data-topic="الكل" onclick="pickTopic('الكل', this)">
                            🌟 شامل كل ما درسته
                        </button>
                    </div>
                </div>

                <button class="btn-launch-quiz" id="btnLaunchQuiz" onclick="startPlayStudyQuiz()">
                    <i class="fas fa-play"></i> ابدأ التحدي الآن (يستهلك 1 طاقة)
                </button>`;

const newLobbyContent = `                <!-- Section: Watched Lectures Ready for Quiz -->
                <div style="margin-bottom:24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
                        <h3 style="margin:0; font-size:1.15rem; font-weight:900; color:var(--ps-text); display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-play-circle" style="color:#10b981;"></i> المحاضرات التي شاهدتها ومتاحة للاختبار:
                        </h3>
                        <span style="font-size:0.8rem; font-weight:800; color:#10b981; background:rgba(16,185,129,0.1); padding:4px 12px; border-radius:50px;">
                            ✅ فقط ما أتممت مشاهدته
                        </span>
                    </div>

                    <!-- Watched Lectures Container -->
                    <div id="watchedLecturesGrid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:14px; margin-bottom:18px;">
                        <div style="text-align:center; padding:30px; grid-column:1/-1; color:var(--ps-muted); font-size:0.9rem; font-weight:700;">
                            <i class="fas fa-spinner fa-spin"></i> جاري جلب المحاضرات التي شاهدتها...
                        </div>
                    </div>
                </div>

                <!-- Or Quick General Challenge Option -->
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

if (html.includes(oldLobbyContent)) {
    html = html.replace(oldLobbyContent, newLobbyContent);
    console.log('✅ Replaced lobby with Watched Lectures selector');
} else {
    console.error('❌ Could not find oldLobbyContent in play-study.html');
}

// Update JS in play-study.html to store selectedVideoId and render watched lectures
const oldJsVarBlock = `    let currentUser = null;
    let selectedSubject = 'الكل';
    let selectedTopic = 'الكل';
    let availableTopicsMap = {};`;

const newJsVarBlock = `    let currentUser = null;
    let selectedSubject = 'الكل';
    let selectedVideoId = null;
    let eligibleLecturesList = [];`;

html = html.replace(oldJsVarBlock, newJsVarBlock);

// Render watched lectures inside loadPlayStudyProfile
const oldProfileCallback = `availableTopicsMap = d.availableTopics || {};
                updateTopicsUI();`;

const newProfileCallback = `eligibleLecturesList = d.eligibleLectures || [];
                renderWatchedLecturesGrid(eligibleLecturesList);`;

html = html.replace(oldProfileCallback, newProfileCallback);

// Add renderWatchedLecturesGrid and selectWatchedLecture
const watchedLecturesJs = `
    function renderWatchedLecturesGrid(lectures) {
        const grid = document.getElementById('watchedLecturesGrid');
        if (!grid) return;

        if (!lectures || lectures.length === 0) {
            grid.innerHTML = \`
                <div style="grid-column:1/-1; background:rgba(26,107,219,0.04); border:1.5px dashed var(--ps-border); border-radius:16px; padding:30px 20px; text-align:center;">
                    <i class="fas fa-video-slash" style="font-size:2.2rem; color:var(--ps-primary); margin-bottom:10px;"></i>
                    <h4 style="margin:0 0 6px; font-weight:900; color:var(--ps-text);">لم تشاهد أي محاضرات بعد!</h4>
                    <p style="margin:0 0 16px; font-size:0.88rem; color:var(--ps-muted); font-weight:700;">
                        عندما تشاهد وتتم أي محاضرة على المنصة، ستظهر هنا فوراً لتمتحن على ما درسته بالضبط وتكسب النقاط!
                    </p>
                    <a href="courses" style="display:inline-flex; align-items:center; gap:6px; background:#1a6bdb; color:#fff; text-decoration:none; padding:8px 20px; border-radius:50px; font-size:0.85rem; font-weight:800;">
                        <i class="fas fa-play"></i> تصفح المحاضرات وابدأ المذاكرة
                    </a>
                </div>
            \`;
            return;
        }

        grid.innerHTML = lectures.map(lec => {
            const isSelected = selectedVideoId === lec.id;
            return \`
                <div class="watched-lec-card \${isSelected ? 'active' : ''}" onclick="selectWatchedLecture('\${lec.id}', this)" style="background:var(--ps-card); border:\${isSelected ? '2px solid #1a6bdb' : '1px solid var(--ps-border)'}; border-radius:16px; padding:14px; cursor:pointer; transition:all 0.2s; position:relative;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg,#1a6bdb,#00b894); color:#fff; display:grid; place-items:center; font-size:1.1rem; flex-shrink:0;">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div style="min-width:0; flex:1;">
                            <div style="font-weight:900; font-size:0.92rem; color:var(--ps-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${escapeHtml(lec.title)}</div>
                            <small style="color:#10b981; font-weight:800; font-size:0.75rem;"><i class="fas fa-eye"></i> تمت مشاهدتها</small>
                        </div>
                    </div>
                </div>
            \`;
        }).join('');
    }

    window.selectWatchedLecture = (videoId, cardEl) => {
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
    };
`;

html = html.replace(`window.pickSubject = (sub, btn) => {`, `${watchedLecturesJs}\n    window.pickSubject = (sub, btn) => {`);

// In pickSubject, clear selectedVideoId
html = html.replace(
    `selectedSubject = sub;
        selectedTopic = 'الكل';
        document.querySelectorAll('.subject-pick-grid .subject-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        updateTopicsUI();`,
    `selectedSubject = sub;
        selectedVideoId = null;
        document.querySelectorAll('.watched-lec-card').forEach(c => {
            c.style.borderColor = 'var(--ps-border)';
            c.style.background = 'var(--ps-card)';
        });
        document.querySelectorAll('.subject-pick-grid .subject-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');`
);

// In startPlayStudyQuiz send videoId
html = html.replace(
    `body: JSON.stringify({ userId, subject: selectedSubject, topic: selectedTopic })`,
    `body: JSON.stringify({ userId, subject: selectedSubject, videoId: selectedVideoId })`
);

fs.writeFileSync('play-study.html', html, 'utf8');
console.log('🎉 Successfully tied Play & Study directly to watched lectures!');
