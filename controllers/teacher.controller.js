const Teacher = require('../models/teacher.model');
const User = require('../models/user.model');
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
        const includeHidden = req.query.includeHidden === 'true';
        const teachers = await Teacher.find(includeHidden ? {} : { hidden: { $ne: true } }).lean();
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
        if (!teacher || (teacher.hidden && req.query.includeHidden !== 'true')) {
            return res.status(404).json({ success: false, message: 'المعلم غير موجود' });
        }

        res.json(teacher);
    } catch (err) {
        next(err);
    }
};

exports.toggleTeacherVisibility = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'معرف المعلم غير صالح' });
        }
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) return res.status(404).json({ success: false, message: 'المعلم غير موجود' });
        teacher.hidden = !teacher.hidden;
        await teacher.save();
        res.json({ success: true, hidden: teacher.hidden, message: teacher.hidden ? 'تم إخفاء المعلم ومحتواه عن الطلاب' : 'تم إظهار المعلم ومحتواه للطلاب' });
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
