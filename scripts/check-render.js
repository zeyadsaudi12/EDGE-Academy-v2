const fs = require('fs');
const h = fs.readFileSync('teacher-dashboard.html','utf8');
const lines = h.split('\n');

// Find renderTeacherDashboard function
const startIdx = lines.findIndex(l => l.includes('function renderTeacherDashboard'));
console.log('renderTeacherDashboard starts at line:', startIdx+1);
if(startIdx > -1) {
  lines.slice(startIdx, startIdx+60).forEach((l,i) => {
    console.log((startIdx+i+1)+': '+l.substring(0,150));
  });
}

// Find where exams tab content ends and if inquiries tab exists
console.log('\n=== tab-exams content area range ===');
const examStart = lines.findIndex(l => l.includes('id="tab-exams"'));
if(examStart > -1) {
  lines.slice(examStart, examStart+60).forEach((l,i) => {
    console.log((examStart+i+1)+': '+l.substring(0,120));
  });
}

