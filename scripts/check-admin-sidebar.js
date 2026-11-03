const fs = require('fs');
const h = fs.readFileSync('admin.html', 'utf8');
const lines = h.split('\n');

console.log('=== Sidebar or Main Nav in admin.html ===');
lines.slice(2100, 2220).forEach((l, i) => {
    if (l.includes('<aside') || l.includes('class="admin-') || l.includes('sidebar-') || l.includes('<nav') || l.includes('onclick=')) {
        console.log(`${2101 + i}: ${l.trim().substring(0, 120)}`);
    }
});

