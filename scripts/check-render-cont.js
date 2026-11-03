const fs = require('fs');
const h = fs.readFileSync('teacher-dashboard.html', 'utf8');
const lines = h.split('\n');

const renderStart = lines.findIndex(l => l.includes('function renderTeacherDashboard'));
if (renderStart !== -1) {
  lines.slice(renderStart + 45, renderStart + 110).forEach((l, i) => {
    console.log(`Line ${renderStart + 45 + i + 1}: ${l}`);
  });
}
