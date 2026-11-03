const fs = require('fs');
const h = fs.readFileSync('profile.html', 'utf8');
const lines = h.split('\n');

console.log('=== CSS Lines 650 - 741 (Media Queries) ===');
lines.slice(650, 740).forEach((l, i) => console.log(`${651 + i}: ${l}`));

