const Teacher = require('../models/teacher.model');
const User = require('../models/user.model');
const Video = require('../models/video.model');
const Exam = require('../models/exam.model');
const VideoQuestion = require('../models/videoQuestion.model');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { cloudinary } = require('../middleware/upload');

// المواد المعتمدة فقط؛ تمنع أخطاء الكتابة من إنشاء مادة جديدة في المنصة.
const ALLOWED_SUBJECTS = new Set([
    'اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'الفيزياء',
    'الكيمياء', 'الأحياء', 'الجيولوجيا', 'التاريخ', 'الجغرافيا',
    'الفلسفة والمنطق', 'علم النفس والاجتماع', 'اللغة الفرنسية',
    'اللغة الألمانية', 'اللغة الإيطالية', 'البرمجة'
]);

function normalizeTeacherSubjects(value) {
    const subjects = String(value || '').split('|').map(subject => subject.trim()).filter(Boolean);
    if (!subjects.length || subjects.some(subject => !ALLOWED_SUBJECTS.has(subject))) return null;
    return [...new Set(subjects)].join(' | ');
}

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

// Dashboard data is deliberately resolved from the signed-in teacher account,
// not from a teacherId supplied by the browser alone.
exports.getTeacherDashboard = async (req, res, next) => {
    try {
        const { userId } = req.query;
        if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'بيانات الحساب غير صالحة' });
        }

        const account = await User.findById(userId).select('role teacherId isTeacherAccount');
        if (!account || account.role !== 'teacher' || !account.isTeacherAccount || String(account.teacherId) !== String(req.params.id)) {
            return res.status(403).json({ success: false, message: 'هذه اللوحة متاحة لحساب المدرس فقط' });
        }

        const [teacher, videos, exams] = await Promise.all([
            Teacher.findById(req.params.id).lean(),
            Video.find({ teacherId: String(req.params.id) }).sort({ createdAt: -1 }).lean(),
            Exam.find({ teacherId: String(req.params.id) }).sort({ createdAt: -1 }).lean()
        ]);
        if (!teacher) return res.status(404).json({ success: false, message: 'المعلم غير موجود' });

        const videoIds = videos.map(video => String(video._id));
        const questions = videoIds.length
            ? await VideoQuestion.find({
                $or: [
                    { teacherId: String(req.params.id) },
                    { teacherId: { $in: ['', null] }, videoId: { $in: videoIds } }
                ]
            }).sort({ createdAt: -1 }).lean()
            : [];

        const watchersByVideo = await Promise.all(videos.map(async video => {
            const conditions = [{ subscribedVideos: String(video._id) }];
            if (video.courseId) conditions.push({ 'subscribedCourses.courseId': String(video.courseId) });
            const watchers = await User.find({ role: 'student', $or: conditions })
                .select('_id firstName lastName username phone grade governorate')
                .lean();
            return [String(video._id), watchers.map(student => ({
                id: String(student._id),
                name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.username || 'طالب',
                phone: student.phone || '—',
                grade: student.grade || '—',
                governorate: student.governorate || '—'
            }))];
        }));
        const watcherMap = Object.fromEntries(watchersByVideo);

        const resultStudentIds = [...new Set(exams.flatMap(exam => (exam.results || []).map(result => result.studentId).filter(Boolean)))];
        const resultStudents = resultStudentIds.length
            ? await User.find({ _id: { $in: resultStudentIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } })
                .select('_id firstName lastName username grade governorate').lean()
            : [];
        const studentsMap = Object.fromEntries(resultStudents.map(student => [String(student._id), student]));

        const videoRows = videos.map(video => ({ ...video, watchers: watcherMap[String(video._id)] || [] }));
        const examRows = exams.map(exam => ({
            ...exam,
            results: (exam.results || []).map(result => {
                const student = studentsMap[String(result.studentId)] || {};
                return {
                    ...result,
                    studentName: result.studentName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.username || 'طالب',
                    grade: student.grade || '—',
                    governorate: student.governorate || '—'
                };
            })
        }));
        const uniqueViewers = new Set(videoRows.flatMap(video => video.watchers.map(watcher => watcher.id)));
        const resultsCount = examRows.reduce((count, exam) => count + exam.results.length, 0);

        res.json({
            success: true,
            teacher: { _id: teacher._id, name: teacher.name, subjectAr: teacher.subjectAr, imagePath: teacher.imagePath },
            stats: { videosCount: videoRows.length, viewersCount: uniqueViewers.size, questionsCount: questions.length, examsCount: examRows.length, resultsCount },
            videos: videoRows,
            questions,
            exams: examRows
        });
    } catch (err) { next(err); }
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
        const normalizedSubjects = normalizeTeacherSubjects(subjectAr);
        if (!normalizedSubjects) {
            return res.status(400).json({ success: false, message: 'يرجى اختيار مادة دراسية معتمدة واحدة على الأقل' });
        }

        // req.file.path = Cloudinary URL بعد الرفع
        const imagePath = req.file ? req.file.path : '';
        let gradesArray = [];
        if (grades) {
            gradesArray = Array.isArray(grades) ? grades : grades.split(',').map(g => g.trim());
        }

        const newTeacher = new Teacher({
            name,
            subjectAr: normalizedSubjects,
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

        // 3. حساب المساعد منفصل تماماً عن حساب المدرس الشخصي.
        const assistantUser = new User({
            phone: uniquePhone,
            password: randomPassword,
            role: 'assistant',
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

        const { name, subjectAr, bio, grades, schedule, teacherAccountPhone, teacherAccountPassword } = req.body;

        if (name) teacher.name = name;
        if (subjectAr) {
            const normalizedSubjects = normalizeTeacherSubjects(subjectAr);
            if (!normalizedSubjects) {
                return res.status(400).json({ success: false, message: 'يرجى اختيار مواد دراسية معتمدة فقط' });
            }
            teacher.subjectAr = normalizedSubjects;
        }
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

        const phone = String(teacherAccountPhone || '').trim();
        const password = String(teacherAccountPassword || '');
        if (phone) {
            if (!/^01[0125]\d{8}$/.test(phone)) {
                return res.status(400).json({ success: false, message: 'رقم حساب المدرس غير صحيح' });
            }
            // teacherId was stored as either ObjectId or string in older data.
            const accountTeacherIds = [teacher._id, String(teacher._id)];
            let teacherAccount = await User.findOne({ teacherId: { $in: accountTeacherIds }, role: 'teacher', isTeacherAccount: true });
            const takenByAnother = await User.findOne({ phone, _id: { $ne: teacherAccount ? teacherAccount._id : null } });
            if (takenByAnother) {
                return res.status(400).json({ success: false, message: 'رقم الهاتف مستخدم في حساب آخر' });
            }
            if (!teacherAccount) {
                if (!password) return res.status(400).json({ success: false, message: 'أدخل كلمة المرور لإنشاء حساب المدرس' });
                teacherAccount = new User({
                    phone,
                    password,
                    role: 'teacher',
                    isTeacherAccount: true,
                    teacherId: teacher._id,
                    firstName: teacher.name,
                    lastName: 'المدرس',
                    username: `teacher_${phone}`,
                    nationalId: `teacher_${phone}`,
                    grade: 'All',
                    governorate: 'الكل',
                    parentPhone: phone,
                    birthDate: new Date()
                });
            } else {
                teacherAccount.phone = phone;
                teacherAccount.firstName = teacher.name;
                if (password) teacherAccount.password = password;
            }
            await teacherAccount.save();
            teacher.teacherAccountPhone = phone;
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
