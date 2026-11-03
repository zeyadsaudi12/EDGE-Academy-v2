const fs = require('fs');
const h = fs.readFileSync('profile.html', 'utf8');
const lines = h.split('\n');

console.log('=== User Pane HTML (Lines 900 - 990) ===');
lines.slice(900, 990).forEach((l, i) => console.log(`${901 + i}: ${l}`));

