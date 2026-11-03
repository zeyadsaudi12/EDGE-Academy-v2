const fs = require('fs');
const h = fs.readFileSync('admin.html', 'utf8');
const lines = h.split('\n');

console.log('=== Sections in admin.html ===');
lines.forEach((l, i) => {
    if (l.includes('class="section') && l.includes('id=')) {
        console.log(`${i+1}: ${l.trim()}`);
    }
});

