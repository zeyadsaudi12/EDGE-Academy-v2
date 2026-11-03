const fs = require('fs');

const pages = ['index.html', 'courses.html', 'exams.html', 'teachers.html', 'profile.html'];

pages.forEach(p => {
    if (!fs.existsSync(p)) return;
    let h = fs.readFileSync(p, 'utf8');
    if (!h.includes('play-study')) {
        h = h.replace(
            '<a href="exams" class="nav-link-item">الامتحانات</a>',
            '<a href="exams" class="nav-link-item">الامتحانات</a>\n            <a href="play-study" class="nav-link-item" style="color:#f59e0b; font-weight:800;">🎮 Play & Study</a>'
        );
        if (h.includes('<a href="exams" class="mobile-nav-link">📝 الامتحانات</a>')) {
            h = h.replace(
                '<a href="exams" class="mobile-nav-link">📝 الامتحانات</a>',
                '<a href="exams" class="mobile-nav-link">📝 الامتحانات</a>\n        <a href="play-study" class="mobile-nav-link" style="color:#f59e0b; font-weight:800;">🎮 Play & Study</a>'
            );
        }
        fs.writeFileSync(p, h, 'utf8');
        console.log('✅ Added Play & Study link to', p);
    } else {
        console.log('ℹ️ Play & Study link already in', p);
    }
});
