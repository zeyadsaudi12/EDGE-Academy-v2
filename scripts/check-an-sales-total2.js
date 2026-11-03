const fs = require('fs');
const h = fs.readFileSync('teacher-dashboard.html', 'utf8');
const lines = h.split('\n');

const anStart = lines.findIndex(l => l.includes('function renderComprehensiveAnalytics'));
if (anStart !== -1) {
  lines.slice(anStart + 180, anStart + 240).forEach((l, i) => {
    console.log(`Line ${anStart + 180 + i + 1}: ${l}`);
  });
}
