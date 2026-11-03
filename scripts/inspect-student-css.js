const fs = require('fs');
const h = fs.readFileSync('profile.html', 'utf8');
const lines = h.split('\n');

console.log('=== CSS Highlights (Sidebar & Layout) ===');
lines.slice(8, 120).forEach((l, i) => console.log(`${9 + i}: ${l}`));

