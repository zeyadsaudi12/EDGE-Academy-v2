const fs = require('fs');
const h = fs.readFileSync('admin.html', 'utf8');

console.log('section-play-study:', h.includes('id="section-play-study"'));
console.log('loadAdminPlayStudy:', h.includes('function loadAdminPlayStudy'));
console.log('nav-item play-study:', h.includes("showSection('play-study'"));

