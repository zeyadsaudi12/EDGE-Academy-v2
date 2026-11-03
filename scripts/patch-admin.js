const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'admin.html');
let adminHtml = fs.readFileSync(adminPath, 'utf8');

const target = `<button class="action-btn" onclick="openEditTeacherModal('\${t._id}')" title="تعديل"><i class="ti ti-edit"></i></button>`;
const replacement = `<a href="teacher-profile?id=\${t._id}" target="_blank" class="action-btn" title="معاينة بروفايل المعلم للطلاب"><i class="ti ti-external-link"></i></a>
                            <a href="teacher-dashboard?teacherId=\${t._id}" target="_blank" class="action-btn" title="فتح لوحة متابعة المعلم"><i class="ti ti-chart-bar"></i></a>
                            <button class="action-btn" onclick="openEditTeacherModal('\${t._id}')" title="تعديل"><i class="ti ti-edit"></i></button>`;

if (adminHtml.includes(target)) {
    adminHtml = adminHtml.replace(target, replacement);
    fs.writeFileSync(adminPath, adminHtml, 'utf8');
    console.log('✅ Successfully added profile and dashboard links to admin.html');
} else {
    console.error('❌ Could not find target in admin.html');
}
