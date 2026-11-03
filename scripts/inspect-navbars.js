const fs = require('fs');

const files = [
    'index.html',
    'teachers.html',
    'subjects.html',
    'courses.html',
    'exams.html',
    'play-study.html',
    'course-view.html',
    'teacher-profile.html',
    'profile.html'
];

files.forEach(f => {
    if (!fs.existsSync(f)) return;
    const content = fs.readFileSync(f, 'utf8');
    const m = content.match(/<div class="header-center">([\s\S]*?)<\/div>/);
    if (m) {
        const links = m[1].match(/href="([^"]+)"/g) || [];
        console.log(f + ' (Desktop): ' + links.join(', '));
    }
});
