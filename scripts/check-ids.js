const fs = require('fs');
const h = fs.readFileSync('teacher-dashboard.html','utf8');
const ids = [
  'tab-overview','tab-sales','tab-students','tab-videos','tab-exams','tab-inquiries','tab-centers',
  'subSalesCoursesVal','subSalesPackagesVal','subSalesLecturesVal','subSalesCentersVal','salesGrandVal',
  'chartMonthlySales','inactiveStudentsTbody','chartTopInteractiveStudents',
  'chartPlatformOverview','chartActiveVsInactive','chartTopGrades','chartTopGovs','chartCentersDonut',
  'recentLecturesList','recentStudentsList','sideBadgeSales',
  'teacherAvatar','teacherName','teacherSubject'
];
let allOk = true;
ids.forEach(id => {
  const count = (h.match(new RegExp('id=["\']' + id + '["\']','g')) || []).length;
  const status = count === 0 ? ' ❌ MISSING' : count > 1 ? ' ⚠️  DUPLICATE ('+count+')' : ' ✅';
  if(count !== 1) allOk = false;
  console.log(id + status);
});
console.log('\nTotal lines:', h.split('\n').length);
if(allOk) console.log('\n🎉 All IDs OK!');
else console.log('\n⚠️  Some IDs need fixing!');

// Also check scrollToSection function
const scrollMatch = h.match(/function\s+scrollToSection[\s\S]{0,500}/);
if(scrollMatch) console.log('\nscrollToSection snippet:\n', scrollMatch[0].substring(0,300));
else console.log('\nscrollToSection: ❌ NOT FOUND');

// Check activateTab 
const tabMatch = h.match(/function\s+activateTab[\s\S]{0,600}/);
if(tabMatch) console.log('\nactivateTab snippet:\n', tabMatch[0].substring(0,400));
else console.log('\nactivateTab: ❌ NOT FOUND');

