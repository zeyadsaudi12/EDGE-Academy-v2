const fs = require('fs');
const h = fs.readFileSync('profile.html', 'utf8');
const lines = h.split('\n');

console.log('=== Lines 1000 - 1080 ===');
lines.slice(1000, 1080).forEach((l, i) => console.log(`${1001 + i}: ${l}`));

