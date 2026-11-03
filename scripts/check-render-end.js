const fs = require('fs');
const h = fs.readFileSync('teacher-dashboard.html', 'utf8');
const lines = h.split('\n');

const renderStart = lines.findIndex(l => l.includes('function renderTeacherDashboard'));
if (renderStart !== -1) {
  lines.slice(renderStart + 110, renderStart + 145).forEach((l, i) => {
    console.log(`Line ${renderStart + 110 + i + 1}: ${l}`);
  });
}
