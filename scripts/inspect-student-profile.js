const fs = require('fs');
const h = fs.readFileSync('profile.html', 'utf8');
const lines = h.split('\n');

console.log('=== Head and Style Summary ===');
const styleStart = lines.findIndex(l => l.includes('<style>'));
const styleEnd = lines.findIndex(l => l.includes('</style>'));
console.log(`Style block: line ${styleStart + 1} to ${styleEnd + 1}`);

console.log('\n=== Body Structure (Main Sections) ===');
lines.forEach((l, i) => {
    if (l.includes('<section') || l.includes('class="profile-') || l.includes('id="tab') || l.includes('class="tab-') || l.includes('<aside') || l.includes('<main') || l.includes('class="sidebar') || l.includes('class="profile-sidebar')) {
        console.log(`Line ${i + 1}: ${l.trim().substring(0, 100)}`);
    }
});

