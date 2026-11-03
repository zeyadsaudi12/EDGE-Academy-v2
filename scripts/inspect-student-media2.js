const fs = require('fs');
const h = fs.readFileSync('profile.html', 'utf8');
const lines = h.split('\n');

console.log('=== CSS Lines 580 - 655 ===');
lines.slice(580, 655).forEach((l, i) => console.log(`${581 + i}: ${l}`));

