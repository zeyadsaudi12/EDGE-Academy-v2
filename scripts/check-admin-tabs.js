const fs = require('fs');
const h = fs.readFileSync('admin.html', 'utf8');
const lines = h.split('\n');

console.log('=== Admin Tabs / Nav Items ===');
lines.forEach((l, i) => {
    if (l.includes('class="nav-link') || l.includes('class="tab-pane') || l.includes('tab-')) {
        if (l.length < 150) {
            console.log(`${i+1}: ${l.trim()}`);
        }
    }
});

