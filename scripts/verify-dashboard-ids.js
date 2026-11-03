const fs = require('fs');
const html = fs.readFileSync('teacher-dashboard.html', 'utf8');

const requiredIds = [
  'dashSidebar', 'sidebarAvatarImg', 'sidebarAvatarFallback', 'sidebarTeacherName', 'sidebarTeacherSubject',
  'sideBadgeSales', 'sideBadgeVideos', 'sideBadgeExams', 'sideBadgeQuestions', 'sideBadgeCenters', 'sideBadgeInactive',
  'tab-overview', 'tab-sales', 'tab-videos', 'tab-exams', 'tab-questions', 'tab-centers', 'tab-students',
  'chartPlatformOverview', 'chartActiveVsInactive', 'chartMonthlySales', 'chartTopInteractiveStudents', 'chartTopGrades', 'chartTopGovs', 'chartCentersDonut',
  'salesGrandVal', 'subSalesCoursesVal', 'subSalesPackagesVal', 'subSalesLecturesVal', 'subSalesCentersVal',
  'tableInactiveStudentsWrap', 'inactiveSearchInput', 'inactiveStudentsTbody',
  'attendanceSearchInput', 'totalAttendRecords', 'attendanceTableBody',
  'searchVideosInput', 'tabVideosCount', 'videosAccordionWrap',
  'searchExamsInput', 'selectExamFilter', 'examResultsTbody',
  'searchQuestionsInput', 'tabQuestionsCount', 'questionsCardsGrid'
];

let missing = [];
for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) {
    missing.push(id);
  }
}

if (missing.length) {
  console.error('❌ Missing IDs:', missing);
  process.exit(1);
} else {
  console.log(`✅ ALL ${requiredIds.length} IDs are present and verified in teacher-dashboard.html!`);
}

