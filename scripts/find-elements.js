const fs = require('fs');
const h = fs.readFileSync('teacher-dashboard.html','utf8');
const lines = h.split('\n');

// Find avatar-related lines
console.log('=== Avatar related lines ===');
lines.forEach((l,i) => {
  if(l.includes('Avatar') || l.includes('avatar') || l.includes('sidebar-name') || l.includes('sidebar-subject') || l.includes('teacherName') || l.includes('teacherSubject')) {
    console.log((i+1)+': '+l.trim().substring(0,120));
  }
});

// Find tab-inquiries
console.log('\n=== Inquiries tab ===');
lines.forEach((l,i) => {
  if(l.includes('inquir') || l.includes('استفسار')) {
    console.log((i+1)+': '+l.trim().substring(0,120));
  }
});

// Find sidebar HTML block
console.log('\n=== Sidebar top block (first 30 lines of sidebar) ===');
const sidebarStart = lines.findIndex(l => l.includes('dashSidebar'));
if(sidebarStart > -1) {
  lines.slice(sidebarStart, sidebarStart+40).forEach((l,i) => {
    console.log((sidebarStart+i+1)+': '+l.trim().substring(0,120));
  });
}

