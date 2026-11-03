const fs = require('fs');
const h = fs.readFileSync('profile.html', 'utf8');
const lines = h.split('\n');

console.log('=== Sidebar Nav (Lines 855 - 895) ===');
lines.slice(850, 895).forEach((l, i) => console.log(`${851 + i}: ${l}`));

