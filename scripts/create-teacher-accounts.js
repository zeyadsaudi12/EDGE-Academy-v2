require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');

const TEACHER_PHONES = [
    { name: 'أ. أحمد فتحي', phone: '01011112201' },
    { name: 'مستر محمد عبد العزيز', phone: '01011112202' },
    { name: 'أ. خالد مصطفى', phone: '01011112203' },
    { name: 'د. عماد الدين سليم', phone: '01011112204' },
    { name: 'د. شريف حمدي', phone: '01011112205' },
    { name: 'د. ياسر عبد الرحمن', phone: '01011112206' },
    { name: 'أ. هيثم الشناوي', phone: '01011112207' },
    { name: 'أ. طارق عبد الحميد', phone: '01011112208' },
    { name: 'أ. وليد زكي', phone: '01011112209' },
    { name: 'مسيو سيمون سامي', phone: '01011112210' }
];

const DEFAULT_PASSWORD = 'Teacher@123';

async function createAccounts() {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB.');

        console.log('\n--- Creating / Linking Teacher Accounts ---');
        for (const item of TEACHER_PHONES) {
            const teacher = await Teacher.findOne({ name: item.name });
            if (!teacher) {
                console.log(`⚠️ Teacher not found: ${item.name}`);
                continue;
            }

            let teacherUser = await User.findOne({ teacherId: teacher._id, role: 'teacher' });
            if (!teacherUser) {
                // Check if user with phone already exists
                teacherUser = await User.findOne({ phone: item.phone });
                if (!teacherUser) {
                    teacherUser = new User({
                        phone: item.phone,
                        password: DEFAULT_PASSWORD,
                        role: 'teacher',
                        isTeacherAccount: true,
                        teacherId: teacher._id,
                        firstName: teacher.name,
                        lastName: 'معلم',
                        username: 'teacher_' + item.phone,
                        nationalId: 'teacher_' + item.phone,
                        grade: 'All',
                        governorate: 'الكل',
                        parentPhone: item.phone,
                        birthDate: new Date('1985-01-01')
                    });
                    await teacherUser.save();
                    console.log(`✅ Created teacher account for: ${teacher.name} | Phone: ${item.phone} | Pass: ${DEFAULT_PASSWORD}`);
                } else {
                    teacherUser.role = 'teacher';
                    teacherUser.isTeacherAccount = true;
                    teacherUser.teacherId = teacher._id;
                    teacherUser.password = DEFAULT_PASSWORD;
                    await teacherUser.save();
                    console.log(`🔄 Updated existing account for: ${teacher.name} | Phone: ${item.phone}`);
                }
            } else {
                console.log(`ℹ️ Teacher account already exists for: ${teacher.name} | Phone: ${teacherUser.phone}`);
            }

            teacher.teacherAccountPhone = teacherUser.phone;
            await teacher.save();
        }

        console.log('\n🎉 All 10 teachers now have active Teacher accounts for login & dashboard access!');
        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error creating teacher accounts:', err);
        process.exit(1);
    }
}

createAccounts();

