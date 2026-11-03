const fs = require('fs');
const h = fs.readFileSync('teacher-dashboard.html', 'utf8');

console.log('=== Checking sideBadgeSales ===');
const m1 = h.match(/sideBadgeSales/g);
console.log('Occurrences of sideBadgeSales:', m1 ? m1.length : 0);
const lines = h.split('\n');
lines.forEach((l, i) => {
  if (l.includes('sideBadgeSales')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});

console.log('\n=== Checking scrollToSection ===');
lines.forEach((l, i) => {
  if (l.includes('scrollToSection')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});

console.log('\n=== Checking renderTeacherDashboard for avatar and badges ===');
const renderStart = lines.findIndex(l => l.includes('function renderTeacherDashboard'));
if (renderStart !== -1) {
  lines.slice(renderStart, renderStart + 45).forEach((l, i) => {
    console.log(`Line ${renderStart + i + 1}: ${l}`);
  });
}
