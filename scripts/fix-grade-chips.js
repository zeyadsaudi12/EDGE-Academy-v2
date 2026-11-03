const fs = require('fs');
let html = fs.readFileSync('teacher-profile.html', 'utf8');

// Replace the chips generation logic
const oldChipsLogic = `            const grades = [...new Set([...teacherCourses, ...teacherStandaloneVideos].flatMap(item => Array.isArray(item.grades) ? item.grades : []).filter(Boolean))];
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

            chips.innerHTML = chipsHtml;`;

const newChipsLogic = `            const grades = [...new Set([...teacherCourses, ...teacherStandaloneVideos].flatMap(item => Array.isArray(item.grades) ? item.grades : []).filter(Boolean))];
            const chips = document.getElementById('tpGradeChips');

            // إذا كان المستخدم طالب ومسجل في مرحلة معينة، يظهر له زِر مرحلته فقط ولا تظهر له باقي الصفوف
            if (studentGrade) {
                activeGrade = studentGrade;
                chips.innerHTML = \`<button class="tp-chip active" data-grade="\${escapeHtml(studentGrade)}"><i class="fas fa-graduation-cap"></i> مرحلتك: \${escapeHtml(studentGrade)}</button>\`;
            } else {
                // للزوار والمدرسين والأدمن: تظهر جميع المراحل لتصفحها
                activeGrade = 'all';
                let chipsHtml = \`<button class="tp-chip active" data-grade="all" onclick="filterTeacherGrade('all', this)"><i class="fas fa-border-all"></i> جميع المراحل</button>\`;
                grades.forEach(grade => {
                    chipsHtml += \`<button class="tp-chip" data-grade="\${escapeHtml(grade)}" onclick="filterTeacherGrade(this.dataset.grade, this)">\${escapeHtml(grade)}</button>\`;
                });
                chips.innerHTML = chipsHtml;
            }`;

if (html.includes(oldChipsLogic)) {
    html = html.replace(oldChipsLogic, newChipsLogic);
    fs.writeFileSync('teacher-profile.html', html, 'utf8');
    console.log('✅ Successfully restricted grade chips for students!');
} else {
    console.error('❌ Could not find exact oldChipsLogic block.');
}

