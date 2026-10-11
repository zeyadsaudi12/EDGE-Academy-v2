const Teacher = require('../models/teacher.model');
const User = require('../models/user.model');
const Video = require('../models/video.model');
const Exam = require('../models/exam.model');
const VideoQuestion = require('../models/videoQuestion.model');
const Attendance = require('../models/attendance.model');
const Course = require('../models/course.model');
const Code = require('../models/code.model');
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
        const isAuthorizedTeacher = account && account.role === 'teacher' && String(account.teacherId) === String(req.params.id);
        const isAdmin = account && account.role === 'admin';
        if (!account || (!isAuthorizedTeacher && !isAdmin)) {
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
                .select('_id firstName lastName username phone parentPhone grade governorate').lean()
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
                    studentPhone: student.phone || result.studentPhone || '—',
                    parentPhone: student.parentPhone || '—',
                    grade: student.grade || result.grade || '—',
                    governorate: student.governorate || result.governorate || '—'
                };
            })
        }));
        const uniqueViewers = new Set(videoRows.flatMap(video => video.watchers.map(watcher => watcher.id)));
        const resultsCount = examRows.reduce((count, exam) => count + exam.results.length, 0);

        const queryConditions = [];
        if (videoIds.length) queryConditions.push({ videoId: { $in: videoIds } });
        const relevantStudentIds = [...new Set([...uniqueViewers, ...resultStudentIds])];
        if (relevantStudentIds.length) queryConditions.push({ studentId: { $in: relevantStudentIds } });

        const attendances = queryConditions.length
            ? await Attendance.find({ $or: queryConditions }).sort({ scannedAt: -1 }).lean()
            : [];

        // Real students strictly associated with this teacher (followers, video viewers, exam takers, attendees)
        const followerStudents = await User.find({ role: 'student', followedTeachers: String(req.params.id) }).select('_id').lean();
        const followerIds = followerStudents.map(s => String(s._id));

        const allRealTeacherStudents = new Set([
            ...followerIds,
            ...uniqueViewers,
            ...resultStudentIds,
            ...attendances.map(a => String(a.studentId)).filter(Boolean)
        ]);

        // ── Comprehensive Real Analytics for Teacher Dashboard ──
        const [
            allTeachersList,
            teacherCourses,
            allStudentsList,
            allUsedCodes
        ] = await Promise.all([
            Teacher.find({ hidden: { $ne: true } }).select('_id name subjectAr imagePath phone whatsapp createdAt').sort({ createdAt: -1 }).lean(),
            Course.find({ teacherId: String(req.params.id) }).lean(),
            User.find({ role: 'student' }).select('_id firstName lastName username phone parentPhone grade governorate createdAt subscribedVideos subscribedCourses balance lastActive').sort({ createdAt: -1 }).lean(),
            Code.find({ videoId: { $in: videoIds }, used: true }).sort({ updatedAt: -1 }).lean()
        ]);

        // 1. Demographics & Groups — only THIS teacher's students
        // Build a lookup map for fast access to student objects by ID
        const allStudentsMap = Object.fromEntries(allStudentsList.map(s => [String(s._id), s]));

        // Only students who interacted with this teacher (viewed, attended, took exam, follow)
        const teacherStudentIds = [...allRealTeacherStudents];
        const teacherStudents = teacherStudentIds
            .map(id => allStudentsMap[id])
            .filter(Boolean);

        const gradesCounts = {};
        const govsCounts = {};
        teacherStudents.forEach(s => {
            if (s.grade && s.grade.trim()) {
                const g = s.grade.trim();
                gradesCounts[g] = (gradesCounts[g] || 0) + 1;
            }
            if (s.governorate && s.governorate.trim()) {
                const gov = s.governorate.trim();
                govsCounts[gov] = (govsCounts[gov] || 0) + 1;
            }
        });

        const topGrades = Object.entries(gradesCounts)
            .map(([grade, count]) => ({ grade, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        const topGovs = Object.entries(govsCounts)
            .map(([governorate, count]) => ({ governorate, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 2. Active vs Inactive — only from THIS teacher's students
        const activeStudentObjects = [];
        const inactiveStudentObjects = [];
        teacherStudents.forEach(s => {
            const sId = String(s._id);
            // "Active" = subscribed to any of this teacher's videos or courses
            const hasVideoSub = Array.isArray(s.subscribedVideos) &&
                s.subscribedVideos.some(vid => videoIds.includes(String(vid)));
            const hasCoursesSub = Array.isArray(s.subscribedCourses) &&
                s.subscribedCourses.some(c => {
                    const cId = c && (c.courseId || c);
                    return teacherCourses.some(tc => String(tc._id) === String(cId));
                });
            const isViewer = uniqueViewers.has(sId);
            const isAttendee = attendances.some(a => String(a.studentId) === sId);
            const hasResult = resultStudentIds.includes(sId);
            const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.username || 'طالب';

            const studentObj = {
                _id: s._id,
                name: fullName,
                phone: s.phone || '—',
                governorate: s.governorate || '—',
                grade: s.grade || '—',
                createdAt: s.createdAt ? new Date(s.createdAt).toISOString().replace('T', ' ').slice(0, 16) : '—'
            };

            if (hasVideoSub || hasCoursesSub || isViewer || isAttendee || hasResult) {
                activeStudentObjects.push({ ...studentObj, status: 'مفعل' });
            } else {
                inactiveStudentObjects.push({ ...studentObj, status: 'لم يشترك بعد' });
            }
        });

        const inactiveStudentsTable = inactiveStudentObjects.map((s, idx) => ({
            index: idx + 1,
            ...s
        }));

        // 3. Top Interactive Students (Strictly Real)
        const studentActivityScores = {};
        videoRows.forEach(v => {
            (v.watchers || []).forEach(w => {
                const wid = String(w.id || w._id);
                studentActivityScores[wid] = (studentActivityScores[wid] || { name: w.name, count: 0 });
                studentActivityScores[wid].count += 1;
            });
        });
        examRows.forEach(e => {
            (e.results || []).forEach(r => {
                const sid = String(r.studentId);
                if (sid) {
                    studentActivityScores[sid] = (studentActivityScores[sid] || { name: r.studentName, count: 0 });
                    studentActivityScores[sid].count += 1;
                }
            });
        });

        const topInteractiveStudents = Object.values(studentActivityScores)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 4. Recent Lists (Strictly Real)
        // Recent students = only THIS teacher's students, sorted by join date
        const recentStudents = teacherStudents
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 6)
            .map(s => {
                let timeAgo = 'حديثاً';
                if (s.createdAt) {
                    const diffHours = Math.round((Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60));
                    if (diffHours < 1) timeAgo = 'الآن';
                    else if (diffHours < 24) timeAgo = `منذ ${diffHours} ساعة`;
                    else {
                        const days = Math.round(diffHours / 24);
                        timeAgo = days === 1 ? 'منذ يوم' : `منذ ${days} أيام`;
                    }
                }
                return {
                    name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.username,
                    grade: s.grade || '—',
                    timeAgo
                };
            });

        const recentLectures = videoRows.slice(0, 6).map(v => ({
            title: v.title,
            teacherName: teacher.name,
            price: v.price != null ? v.price : 0
        }));

        const recentTeachers = allTeachersList.slice(0, 5).map(t => ({
            _id: t._id,
            name: t.name,
            subjectAr: t.subjectAr,
            imagePath: t.imagePath || '',
            phone: t.phone || '',
            whatsapp: t.whatsapp || t.phone || ''
        }));

        // 5. Monthly Sales & Timeline (Strictly Real Last 6 Months)
        const now = new Date();
        const monthlySales = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const y = d.getFullYear();
            const monthKey = `${m}/${y}`;
            const nextD = new Date(d.getFullYear(), d.getMonth() + 1, 1);

            const codesInMonth = allUsedCodes.filter(c => {
                const cd = new Date(c.updatedAt || c.createdAt);
                return cd >= d && cd < nextD;
            });
            const lecturesAmount = codesInMonth.reduce((sum, c) => sum + (Number(c.value) || 0), 0);

            const regsInMonth = allStudentsList.filter(s => {
                const sd = new Date(s.createdAt);
                return sd >= d && sd < nextD;
            }).length;

            monthlySales.push({
                month: monthKey,
                total: lecturesAmount,
                courses: 0,
                packages: 0,
                lectures: lecturesAmount,
                centers: 0,
                registrations: regsInMonth
            });
        }

        const totalUsedCodesAmount = allUsedCodes.reduce((sum, c) => sum + (Number(c.value) || 0), 0);

        const realStats = {
            videosCount: videoRows.length,
            viewersCount: uniqueViewers.size,
            questionsCount: questions.length,
            examsCount: examRows.length,
            resultsCount,
            attendancesCount: attendances.length,
            totalStudentsCount: allRealTeacherStudents.size,
            teachersCount: allTeachersList.length,
            coursesCount: teacherCourses.length,
            studentsCount: allStudentsList.length
        };

        res.json({
            success: true,
            teacher: { _id: teacher._id, name: teacher.name, subjectAr: teacher.subjectAr, imagePath: teacher.imagePath, grades: teacher.grades },
            stats: realStats,
            analytics: {
                teachersCount: allTeachersList.length,
                studentsCount: allStudentsList.length,
                coursesCount: teacherCourses.length,
                lecturesCount: videoRows.length,
                platformOverview: {
                    teachers: allTeachersList.length,
                    students: allStudentsList.length,
                    courses: teacherCourses.length,
                    lectures: videoRows.length
                },
                monthlySales,
                salesSummary: {
                    totalSales: totalUsedCodesAmount,
                    courses: { amount: 0, count: 0 },
                    packages: { amount: 0, count: 0 },
                    lectures: { amount: totalUsedCodesAmount, count: allUsedCodes.length },
                    centers: { amount: 0, count: attendances.length }
                },
                topInteractiveStudents,
                topGrades,
                topGovs,
                activeStudentsStats: {
                    activeCount: activeStudentObjects.length,
                    inactiveCount: inactiveStudentObjects.length,
                    totalCount: allStudentsList.length
                },
                inactiveStudents: inactiveStudentsTable,
                recentLectures,
                recentTeachers,
                recentStudents
            },
            videos: videoRows,
            questions,
            exams: examRows,
            attendances
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
                return res.status(409).json({
                    success: false,
                    code: 'PHONE_ALREADY_USED',
                    message: 'هذا الرقم مسجل بالفعل في حساب آخر. اختر رقمًا مختلفًا لحساب المدرس؛ لا يمكن ربط رقم واحد بحسابين.'
                });
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
