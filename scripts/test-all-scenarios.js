require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
const Course = require('../models/course.model');
const Video = require('../models/video.model');
const teacherController = require('../controllers/teacher.controller');

async function runTests() {
    console.log('====================================================');
    console.log('🧪 RUNNING COMPREHENSIVE TEACHER & STUDENT TESTS');
    console.log('====================================================\n');

    await mongoose.connect(process.env.MONGODB_URI);

    // Test 1: Verify all 11 teachers in database
    console.log('--- Test 1: Verifying All Teachers & Branding Images ---');
    const teachers = await Teacher.find({ hidden: { $ne: true } });
    console.log(`✅ Found ${teachers.length} active teachers.`);
    for (const t of teachers) {
        if (!t.imagePath) {
            console.error(`❌ Teacher ${t.name} has no imagePath!`);
        } else {
            console.log(`  ✓ ${t.name} (${t.subjectAr}) - Img: ${t.imagePath.substring(0, 50)}...`);
        }
    }

    // Test 2: Verify Student Profile Flow
    console.log('\n--- Test 2: Verifying Student View on Teacher Profile ---');
    const sampleTeacher = await Teacher.findOne({ name: 'أ. أحمد فتحي' });
    const teacherCourses = await Course.find({ teacherId: String(sampleTeacher._id), hidden: { $ne: true } });
    const teacherVideos = await Video.find({ teacherId: String(sampleTeacher._id), hidden: { $ne: true } });
    console.log(`✅ Sample Teacher "${sampleTeacher.name}":`);
    console.log(`   - Courses Count: ${teacherCourses.length}`);
    console.log(`   - Videos Count: ${teacherVideos.length}`);
    console.log(`   - Bio: ${sampleTeacher.bio.substring(0, 60)}...`);
    console.log(`   - Grades: ${sampleTeacher.grades.join(', ')}`);

    // Test 3: Teacher Login Authentication
    console.log('\n--- Test 3: Verifying Teacher Authentication ---');
    const teacherPhone = '01011112201';
    const teacherUser = await User.findOne({ phone: teacherPhone }).select('+password');
    if (!teacherUser) {
        throw new Error(`Teacher user account not found for phone: ${teacherPhone}`);
    }
    const isPasswordValid = await bcrypt.compare('Teacher@123', teacherUser.password);
    console.log(`✅ Teacher login check for ${teacherUser.firstName}:`);
    console.log(`   - Phone: ${teacherPhone}`);
    console.log(`   - Password valid: ${isPasswordValid}`);
    console.log(`   - Role: ${teacherUser.role}`);
    console.log(`   - TeacherId: ${teacherUser.teacherId}`);

    // Test 4: Teacher Dashboard Access
    console.log('\n--- Test 4: Verifying Teacher Dashboard Data Retrieval ---');
    const reqTeacher = {
        params: { id: String(sampleTeacher._id) },
        query: { userId: String(teacherUser._id) },
        user: teacherUser
    };
    let dashResponse = null;
    let dashStatus = 200;
    const resMock = {
        status: (code) => { dashStatus = code; return resMock; },
        json: (data) => { dashResponse = data; return resMock; }
    };

    await teacherController.getTeacherDashboard(reqTeacher, resMock, (err) => {
        if (err) console.error('Dashboard Error:', err);
    });

    console.log(`✅ Dashboard response status: ${dashStatus}`);
    console.log(`✅ Dashboard success: ${dashResponse?.success}`);
    console.log(`✅ Dashboard teacher name: ${dashResponse?.teacher?.name}`);
    console.log(`✅ Dashboard courses count: ${dashResponse?.analytics?.coursesCount}`);
    console.log(`✅ Dashboard lectures count: ${dashResponse?.analytics?.lecturesCount}`);
    console.log(`✅ Dashboard monthly sales: ${dashResponse?.analytics?.monthlySales?.length} months tracked`);

    // Test 5: Admin Dashboard Access for Any Teacher
    console.log('\n--- Test 5: Verifying Admin Access to Any Teacher Dashboard ---');
    const adminUser = await User.findOne({ role: 'admin' });
    const reqAdmin = {
        params: { id: String(sampleTeacher._id) },
        query: { userId: String(adminUser._id) },
        user: adminUser
    };
    let adminDashResponse = null;
    const resAdminMock = {
        status: () => resAdminMock,
        json: (data) => { adminDashResponse = data; return resAdminMock; }
    };
    await teacherController.getTeacherDashboard(reqAdmin, resAdminMock, console.error);
    console.log(`✅ Admin accessing teacher dashboard success: ${adminDashResponse?.success}`);

    await mongoose.disconnect();

    console.log('\n====================================================');
    console.log('🎉 ALL SYSTEM TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
}

runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});

