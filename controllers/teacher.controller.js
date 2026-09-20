const Teacher = require('../models/teacher.model');
const User = require('../models/user.model');
const Video = require('../models/video.model');
const Course = require('../models/course.model');
const Exam = require('../models/exam.model');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { cloudinary } = require('../middleware/upload');

// استخراج public_id من Cloudinary URL لحذف الصورة
function extractCloudinaryPublicId(url) {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return null;
        // تخطي version (v1234567)
        let startIdx = uploadIndex + 1;
        if (parts[startIdx] && /^v\d+$/.test(parts[startIdx])) startIdx++;
        const fileWithExt = parts.slice(startIdx).join('/');
        return fileWithExt.replace(/\.[^/.]+$/, ''); // إزالة الامتداد
    } catch (e) {
        return null;
    }
}

exports.getFollowerCounts = async (req, res, next) => {
    try {
        const students = await User.find({ role: 'student' }).select('followedTeachers');
        const counts = {};
        students.forEach(s => {
            (s.followedTeachers || []).forEach(tid => {
                counts[tid] = (counts[tid] || 0) + 1;
            });
        });
        res.json(counts);
    } catch (err) {
        next(err);
    }
};

exports.getAllTeachers = async (req, res, next) => {
    try {
        const teachers = await Teacher.find().lean();
        res.json(teachers);
    } catch (err) {
        next(err);
    }
};

exports.getTeacherById = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'المعلم غير موجود' });
        }

        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'المعلم غير موجود' });
        }

        res.json(teacher);
    } catch (err) {
        next(err);
    }
};

exports.registerTeacherAccount = async (req, res, next) => {
    try {
        const { name, phone, password, subjectAr, bio, grades } = req.body;
        if (!name || !phone || !password || !subjectAr || !Array.isArray(grades) || !grades.length) {
            return res.status(400).json({ success: false, message: 'أكمل الاسم والهاتف وكلمة المرور والمادة والصفوف الدراسية' });
        }
        if (!/^01[0125]\d{8}$/.test(phone)) return res.status(400).json({ success: false, message: 'رقم الهاتف غير صحيح' });
        if (await User.findOne({ phone })) return res.status(400).json({ success: false, message: 'رقم الهاتف مسجل بالفعل' });

        const teacher = await Teacher.create({ name: String(name).trim(), subjectAr: String(subjectAr).trim(), bio: String(bio || '').trim(), grades });
        const safePhone = String(phone).trim();
        const user = await User.create({
            phone: safePhone, password, role: 'teacher', teacherId: teacher._id,
            firstName: teacher.name, lastName: 'معلم', username: `teacher_${safePhone}`,
            nationalId: `teacher_${safePhone}`, grade: 'All', governorate: 'الكل', parentPhone: safePhone,
            birthDate: new Date(), devices: []
        });
        const userData = user.toObject(); delete userData.password;
        res.status(201).json({ success: true, teacher, user: userData, message: 'تم إنشاء حساب المعلم بنجاح' });
    } catch (err) { next(err); }
};

exports.getTeacherDashboard = async (req, res, next) => {
    try {
        const teacherId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(teacherId)) return res.status(400).json({ success: false, message: 'معرف المعلم غير صالح' });
        const teacher = await Teacher.findById(teacherId).lean();
        if (!teacher) return res.status(404).json({ success: false, message: 'المعلم غير موجود' });
        const [videos, courses, exams, followers] = await Promise.all([
            Video.find({ teacherId }).sort({ createdAt: -1 }).lean(),
            Course.find({ teacherId }).sort({ createdAt: -1 }).lean(),
            Exam.find({ teacherId }).sort({ createdAt: -1 }).lean(),
            User.countDocuments({ role: 'student', followedTeachers: teacherId })
        ]);
        const ids = videos.map(v => String(v._id));
        const subscribers = ids.length ? await User.find({ role: 'student', subscribedVideos: { $in: ids } }).select('subscribedVideos').lean() : [];
        const viewsByVideo = Object.fromEntries(ids.map(id => [id, 0]));
        subscribers.forEach(student => (student.subscribedVideos || []).map(String).forEach(id => { if (id in viewsByVideo) viewsByVideo[id]++; }));
        const videoRows = videos.map(video => ({ ...video, views: viewsByVideo[String(video._id)] || 0 }));
        const examRows = exams.map(exam => ({
            _id: exam._id, title: exam.title, subject: exam.subject, grades: exam.grades, totalMarks: exam.totalMarks,
            resultsCount: (exam.results || []).length,
            average: (exam.results || []).length ? Math.round((exam.results || []).reduce((sum, r) => sum + (Number(r.percentage) || 0), 0) / exam.results.length) : null,
            recentResults: (exam.results || []).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).slice(0, 5)
        }));
        res.json({ success: true, teacher, stats: { videos: videoRows.length, videoViews: videoRows.reduce((sum, v) => sum + v.views, 0), courses: courses.length, exams: examRows.length, examSubmissions: examRows.reduce((sum, e) => sum + e.resultsCount, 0), followers }, videos: videoRows, courses, exams: examRows });
    } catch (err) { next(err); }
};

exports.createTeacher = async (req, res, next) => {
    try {
        const { name, subjectAr, bio, grades } = req.body;
        if (!name || !subjectAr) {
            return res.status(400).json({ success: false, message: 'الاسم والمادة مطلوبان' });
        }

        // req.file.path = Cloudinary URL بعد الرفع
        const imagePath = req.file ? req.file.path : '';
        let gradesArray = [];
        if (grades) {
            gradesArray = Array.isArray(grades) ? grades : grades.split(',').map(g => g.trim());
        }

        const newTeacher = new Teacher({
            name,
            subjectAr,
            bio: bio || '',
            imagePath,
            grades: gradesArray
        });

        await newTeacher.save();

        // 1. توليد رقم هاتف عشوائي فريد يبدأ بـ 05
        let uniquePhone = '';
        let existing = null;
        do {
            uniquePhone = '05' + Math.floor(100000000 + Math.random() * 900000000);
            existing = await User.findOne({ phone: uniquePhone });
        } while (existing !== null);

        // 2. توليد كلمة مرور عشوائية
        const randomPassword = crypto.randomBytes(4).toString('hex');

        // 3. تسجيل الحساب تلقائياً برتبة "teacher" كمساعد للمعلم
        const assistantUser = new User({
            phone: uniquePhone,
            password: randomPassword,
            role: 'teacher',
            teacherId: newTeacher._id,
            firstName: 'مساعد ' + name,
            lastName: 'التعليمي',
            username: 'helper_' + uniquePhone,
            nationalId: 'helper_' + uniquePhone,
            grade: 'All',
            governorate: 'الكل',
            parentPhone: uniquePhone,
            birthDate: new Date()
        });

        await assistantUser.save();

        res.status(201).json({
            success: true,
            teacher: newTeacher,
            assistantAccount: {
                phone: uniquePhone,
                password: randomPassword
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.updateTeacher = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'المعلم غير موجود' });
        }

        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'المعلم غير موجود' });
        }

        const { name, subjectAr, bio, grades, schedule } = req.body;

        if (name) teacher.name = name;
        if (subjectAr) teacher.subjectAr = subjectAr;
        if (bio !== undefined) teacher.bio = bio;

        if (grades !== undefined) {
            teacher.grades = Array.isArray(grades) ? grades : grades.split(',').map(g => g.trim());
        }

        if (schedule !== undefined) {
            try {
                teacher.schedule = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
            } catch (e) {
                console.error('Error parsing schedule:', e);
            }
        }

        if (req.file) {
            // حذف الصورة القديمة من Cloudinary
            const oldPublicId = extractCloudinaryPublicId(teacher.imagePath);
            if (oldPublicId) {
                cloudinary.uploader.destroy(oldPublicId).catch(e => console.error('خطأ في حذف الصورة القديمة من Cloudinary:', e));
            }
            teacher.imagePath = req.file.path; // Cloudinary URL الجديد
        }

        await teacher.save();
        res.json({ success: true, teacher });
    } catch (err) {
        next(err);
    }
};

exports.deleteTeacher = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, message: 'المعلم غير موجود' });
        }

        const teacher = await Teacher.findByIdAndDelete(req.params.id);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'المعلم غير موجود' });
        }

        // حذف الصورة من Cloudinary
        const publicId = extractCloudinaryPublicId(teacher.imagePath);
        if (publicId) {
            cloudinary.uploader.destroy(publicId).catch(e => console.error('خطأ في حذف صورة المعلم من Cloudinary:', e));
        }

        await User.deleteMany({ teacherId: req.params.id });

        res.json({ success: true, message: 'تم حذف المعلم بنجاح' });
    } catch (err) {
        next(err);
    }
};
