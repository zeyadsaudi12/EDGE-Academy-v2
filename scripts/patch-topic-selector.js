const fs = require('fs');
let html = fs.readFileSync('play-study.html', 'utf8');

// 1. Add Topic Selector HTML inside quizLobbyView
const oldLobbyPart = `                <h4 style="margin:0 0 12px; font-weight:800; font-size:0.95rem; color:var(--ps-text);">اختر مادة التحدي:</h4>
                <div class="subject-pick-grid">
                    <button class="subject-btn active" data-sub="الكل" onclick="pickSubject('الكل', this)">🎲 مكس شامل</button>
                    <button class="subject-btn" data-sub="اللغة العربية" onclick="pickSubject('اللغة العربية', this)">📖 عربي</button>
                    <button class="subject-btn" data-sub="اللغة الإنجليزية" onclick="pickSubject('اللغة الإنجليزية', this)">🇬🇧 إنجليزي</button>
                    <button class="subject-btn" data-sub="الرياضيات" onclick="pickSubject('الرياضيات', this)">📐 رياضيات</button>
                    <button class="subject-btn" data-sub="الفيزياء" onclick="pickSubject('الفيزياء', this)">⚡ فيزياء</button>
                    <button class="subject-btn" data-sub="العلوم والكيمياء" onclick="pickSubject('العلوم والكيمياء', this)">🧪 كيمياء</button>
                    <button class="subject-btn" data-sub="الأحياء" onclick="pickSubject('الأحياء', this)">🧬 أحياء</button>
                </div>

                <button class="btn-launch-quiz" id="btnLaunchQuiz" onclick="startPlayStudyQuiz()">
                    <i class="fas fa-play"></i> ابدأ التحدي الآن (يستهلك 1 طاقة)
                </button>`;

const newLobbyPart = `                <h4 style="margin:0 0 12px; font-weight:800; font-size:0.95rem; color:var(--ps-text);">1. اختر مادة التحدي:</h4>
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

if (html.includes(oldLobbyPart)) {
    html = html.replace(oldLobbyPart, newLobbyPart);
    console.log('✅ Updated lobby UI with topic selector');
} else {
    console.error('❌ Could not find oldLobbyPart');
}

// 2. Update JavaScript in play-study.html to handle topic selection and strict payloads
const oldJsLogic = `    let currentUser = null;
    let selectedSubject = 'الكل';
    let currentQuiz = null;
    let currentQIndex = 0;
    let userAnswers = [];
    let timerInterval = null;
    let timeLeft = 20;`;

const newJsLogic = `    let currentUser = null;
    let selectedSubject = 'الكل';
    let selectedTopic = 'الكل';
    let availableTopicsMap = {};
    let currentQuiz = null;
    let currentQIndex = 0;
    let userAnswers = [];
    let timerInterval = null;
    let timeLeft = 20;`;

html = html.replace(oldJsLogic, newJsLogic);

// Update loadPlayStudyProfile to save availableTopicsMap
html = html.replace(
    `const lb = d.leaderboard || [];`,
    `availableTopicsMap = d.availableTopics || {};
                updateTopicsUI();
                const lb = d.leaderboard || [];`
);

// Add updateTopicsUI and pickTopic
const newTopicFunctions = `
    function updateTopicsUI() {
        const container = document.getElementById('topicsChipsList');
        if (!container) return;
        
        let chipsHtml = \`<button class="subject-btn \${selectedTopic === 'الكل' ? 'active' : ''}" style="padding:8px 16px; font-size:0.85rem;" data-topic="الكل" onclick="pickTopic('الكل', this)">🌟 شامل كل ما درسته</button>\`;
        
        if (selectedSubject !== 'الكل' && availableTopicsMap[selectedSubject]) {
            availableTopicsMap[selectedSubject].forEach(t => {
                chipsHtml += \`<button class="subject-btn \${selectedTopic === t ? 'active' : ''}" style="padding:8px 16px; font-size:0.85rem;" data-topic="\${t}" onclick="pickTopic('\${t}', this)">📌 \${t}</button>\`;
            });
        }
        
        container.innerHTML = chipsHtml;
    }

    window.pickTopic = (topic, btn) => {
        selectedTopic = topic;
        document.querySelectorAll('#topicsChipsList .subject-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
    };
`;

html = html.replace(
    `window.pickSubject = (sub, btn) => {`,
    `${newTopicFunctions}\n    window.pickSubject = (sub, btn) => {`
);

// When picking subject, reset topic to 'الكل' and refresh topic chips
html = html.replace(
    `selectedSubject = sub;
        document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');`,
    `selectedSubject = sub;
        selectedTopic = 'الكل';
        document.querySelectorAll('.subject-pick-grid .subject-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        updateTopicsUI();`
);

// In startPlayStudyQuiz, send both subject and topic
html = html.replace(
    `body: JSON.stringify({ userId, subject: selectedSubject })`,
    `body: JSON.stringify({ userId, subject: selectedSubject, topic: selectedTopic })`
);

fs.writeFileSync('play-study.html', html, 'utf8');
console.log('🎉 Successfully added topic selection & strict curriculum filtering!');

