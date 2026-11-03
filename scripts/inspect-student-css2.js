const fs = require('fs');
const h = fs.readFileSync('profile.html', 'utf8');
const lines = h.split('\n');

console.log('=== CSS Lines 120 - 240 ===');
lines.slice(120, 240).forEach((l, i) => console.log(`${121 + i}: ${l}`));

