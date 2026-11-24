const User = require('../models/user.model');
const Code = require('../models/code.model');
const Course = require('../models/course.model');
const Video = require('../models/video.model');
const Attendance = require('../models/attendance.model');
const mongoose = require('mongoose');
const { cloudinary } = require('../middleware/upload');

const SELF_UPDATE_FIELDS = new Set([
    'firstName', 'secondName', 'thirdName', 'lastName', 'parentPhone',
    'governorate', 'section', 'secondLanguage'
]);
const ADMIN_UPDATE_FIELDS = new Set([
    ...SELF_UPDATE_FIELDS, 'phone', 'nationalId', 'birthDate', 'grade',
    'balance', 'role', 'isTeacherAccount', 'teacherId'
]);

// Letters (any language), combining marks, spaces, dot and hyphen only. This
// deliberately rejects quotes, angle brackets, semicolons, parentheses and
// backticks, which are the characters used to break out of inline JavaScript
// handlers in the admin UI.
const SAFE_NAME_PATTERN = /^[\p{L}\p{M}\s.-]+$/u;
const NAME_FIELDS = ['firstName', 'secondName', 'thirdName', 'lastName'];

function normalizeName(value) {
    return String(value).trim().replace(/\s+/g, ' ');
}

function validateNames(payload) {
    for (const field of NAME_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(payload, field)) continue;
        const normalized = normalizeName(payload[field] ?? '');
        const optionalMiddleName = field === 'secondName' || field === 'thirdName';
        // Middle names are optional on existing records, so an empty value is
        // accepted there. First/last names must still be real names.
        if (optionalMiddleName && normalized === '') {
            payload[field] = '';
            continue;
        }
        if (normalized.length > 60 || !SAFE_NAME_PATTERN.test(normalized)) {
            return { error: 'يجب أن يحتوي الاسم على حروف فقط بدون رموز أو علامات' };
        }
        if ((field === 'firstName' || field === 'lastName') && normalized.length < 2) {
            return { error: 'الاسم الأول واسم العائلة مطلوبان' };
        }
        payload[field] = normalized;
    }
    return null;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pickAllowedUpdates(payload, allowedFields) {
    return Object.fromEntries(Object.entries(payload || {}).filter(([key]) => allowedFields.has(key)));
}

function extractCloudinaryPublicId(url) {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return null;
        let startIdx = uploadIndex + 1;
        if (parts[startIdx] && /^v\d+$/.test(parts[startIdx])) startIdx++;
        const fileWithExt = parts.slice(startIdx).join('/');
        return fileWithExt.replace(/\.[^/.]+$/, '');
    } catch (e) {
        return null;
    }
}

exports.follow = async (req, res, next) => {
    try {
        const { teacherId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(req.params.id) || req.params.id === 'admin-master-id') {
            return res.status(400).json({ success: false, message: 'معرف مستخدم غير صالح' });
        }
        if (!mongoose.Types.ObjectId.isValid(teacherId)) {
            return res.status(400).json({ success: false, message: 'معرف المعلم غير صالح' });
        }
        const Teacher = require('../models/teacher.model');
        const teacher = await Teacher.findById(teacherId).select('hidden').lean();
        if (!teacher || teacher.hidden) {
            return res.status(404).json({ success: false, message: 'المعلم غير موجود' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        if (!user.followedTeachers) user.followedTeachers = [];

        const index = user.followedTeachers.indexOf(teacherId);
        let isFollowing = false;

        if (index > -1) {
            user.followedTeachers.splice(index, 1); // إلغاء المتابعة
        } else {
            user.followedTeachers.push(teacherId); // تفعيل المتابعة
            isFollowing = true;
        }

        await user.save();
        res.json({ success: true, isFollowing, followedTeachers: user.followedTeachers });
    } catch (err) {
        next(err);
    }
};

exports.subscribe = async (req, res, next) => {
    try {
        const { codeStr, videoId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(req.params.id) || req.params.id === 'admin-master-id') {
            return res.status(400).json({ success: false, message: 'معرف مستخدم غير صالح' });
        }
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json({ success: false, message: 'معرف المحاضرة غير صالح' });
        }

        const [video, code] = await Promise.all([
            Video.findById(videoId).select('hidden grades closed').lean(),
            Code.findOne({ code: codeStr, videoId })
        ]);
        if (!video || video.hidden || video.closed) {
            return res.status(404).json({ success: false, message: 'المحاضرة غير متاحة' });
        }
        // 1. التحقق من كود الشحن وصلاحيته لهذا الفيديو
        if (!code) {
            return res.status(404).json({ success: false, message: 'كود الشحن غير صحيح أو لا يخص هذه المحاضرة' });
        }
        if (code.views >= 1) {
            return res.status(400).json({ success: false, message: 'هذا الكود مستخدم بالفعل (صالح للاستخدام مرة واحدة فقط)' });
        }
        if (code.studentId && code.studentId.toString() !== req.params.id) {
            return res.status(403).json({ success: false, message: 'كود الشحن مستخدم بالفعل بواسطة طالب آخر' });
        }

        // 2. تحديث بيانات المستخدم (إضافة المحاضرة لكورسات الطالب)
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        if (user.role === 'student' && Array.isArray(video.grades) && video.grades.length && !video.grades.includes(user.grade)) {
            return res.status(403).json({ success: false, message: 'هذه المحاضرة غير متاحة لصفك الدراسي' });
        }

        // Claim the code atomically so two students cannot spend it at once.
        const claimed = await Code.findOneAndUpdate(
            {
                _id: code._id,
                views: { $lt: 1 },
                $or: [{ studentId: { $exists: false } }, { studentId: null }, { studentId: req.params.id }]
            },
            { $inc: { views: 1 }, $set: { used: true, studentId: req.params.id } },
            { new: true }
        );
        if (!claimed) {
            return res.status(400).json({ success: false, message: 'هذا الكود مستخدم بالفعل (صالح للاستخدام مرة واحدة فقط)' });
        }

        if (!user.subscribedVideos) user.subscribedVideos = [];
        const alreadySubscribed = user.subscribedVideos.map(String).includes(String(videoId));
        if (!alreadySubscribed) {
            user.subscribedVideos.push(videoId);
        }
        await user.save();
        res.json({ success: true, remainingViews: 0, user });
    } catch (err) {
        next(err);
    }
};

// Free lectures still require a one-click subscription.  This gives teachers
// an accurate watcher list without requiring a recharge code from students.
exports.subscribeFree = async (req, res, next) => {
    try {
        const { videoId } = req.body;
        const studentId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ success: false, message: 'معرف المستخدم غير صالح' });
        }
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json({ success: false, message: 'معرف المحاضرة غير صالح' });
        }

        const [user, video, codeCount] = await Promise.all([
            User.findById(studentId),
            Video.findById(videoId),
            Code.countDocuments({ videoId })
        ]);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        if (!video || video.hidden) return res.status(404).json({ success: false, message: 'المحاضرة غير موجودة' });
        if (video.closed) return res.status(403).json({ success: false, message: 'هذه المحاضرة مغلقة حالياً' });
        if (user.role === 'student' && Array.isArray(video.grades) && video.grades.length && !video.grades.includes(user.grade)) {
            return res.status(403).json({ success: false, message: 'هذه المحاضرة غير متاحة لصفك الدراسي' });
        }

        // A zero/blank price with no generated codes is a free lecture.
        if (Number(video.price || 0) !== 0 || codeCount > 0) {
            return res.status(400).json({ success: false, requiresCode: true, message: 'هذه المحاضرة تحتاج كود اشتراك' });
        }

        if (!user.subscribedVideos) user.subscribedVideos = [];
        if (!user.subscribedVideos.map(String).includes(String(videoId))) {
            user.subscribedVideos.push(videoId);
            await user.save();
        }
        res.json({ success: true, message: 'تم الاشتراك المجاني في المحاضرة بنجاح', subscribedVideos: user.subscribedVideos });
    } catch (err) {
        next(err);
    }
};

exports.subscribeCourse = async (req, res, next) => {
    try {
        const { codeStr, courseId } = req.body;
        const studentId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(studentId) || studentId === 'admin-master-id') {
            return res.status(400).json({ success: false, message: 'معرف طالب غير صالح' });
        }
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: 'معرف الكورس غير صالح' });
        }

        const course = await Course.findById(courseId).select('hidden grades').lean();
        if (!course || course.hidden) return res.status(404).json({ success: false, message: 'الكورس غير موجود' });
        const code = await Code.findOne({ code: codeStr, videoId: courseId });
        if (!code) {
            return res.status(404).json({ success: false, message: 'كود الاشتراك غير صحيح أو لا يخص هذا الكورس' });
        }
        if (code.views >= 1) {
            return res.status(400).json({ success: false, message: 'هذا الكود مستخدم بالفعل' });
        }

        const user = await User.findById(studentId);
        if (!user) return res.status(404).json({ success: false, message: 'الطالب غير موجود' });
        if (user.role === 'student' && Array.isArray(course.grades) && course.grades.length && !course.grades.includes(user.grade)) {
            return res.status(403).json({ success: false, message: 'هذا الكورس غير متاح لصفك الدراسي.' });
        }
        if (user.subscribedCourses && user.subscribedCourses.some(c => String(c.courseId) === String(courseId))) {
            return res.status(400).json({ success: false, message: 'أنت مشترك بالفعل في هذا الكورس' });
        }

        // Claim the code atomically so two students cannot spend it at once.
        const claimed = await Code.findOneAndUpdate(
            {
                _id: code._id,
                views: { $lt: 1 },
                $or: [{ studentId: { $exists: false } }, { studentId: null }, { studentId }]
            },
            { $inc: { views: 1 }, $set: { used: true, studentId } },
            { new: true }
        );
        if (!claimed) {
            return res.status(400).json({ success: false, message: 'هذا الكود مستخدم بالفعل' });
        }

        if (!user.subscribedCourses) user.subscribedCourses = [];
        user.subscribedCourses.push({
            courseId,
            purchasedAt: new Date(),
            codeUsed: codeStr
        });
        await user.save();
        res.json({ success: true, message: 'تم الاشتراك في الكورس بنجاح 🎉', user });
    } catch (err) {
        next(err);
    }
};

exports.buyCourseBalance = async (req, res, next) => {
    try {
        const { courseId } = req.body;
        const studentId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(studentId) || studentId === 'admin-master-id') {
            return res.status(400).json({ success: false, message: 'معرف طالب غير صالح' });
        }
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: 'معرف الكورس غير صالح' });
        }

        const course = await Course.findById(courseId);
        if (!course || course.hidden) return res.status(404).json({ success: false, message: 'الكورس غير موجود' });

        const user = await User.findById(studentId);
        if (!user) return res.status(404).json({ success: false, message: 'الطالب غير موجود' });
        if (user.role === 'student' && Array.isArray(course.grades) && course.grades.length && !course.grades.includes(user.grade)) {
            return res.status(403).json({ success: false, message: 'هذا الكورس غير متاح لصفك الدراسي.' });
        }

        if (!user.subscribedCourses) user.subscribedCourses = [];
        const alreadySubscribed = user.subscribedCourses.some(c => c.courseId === courseId);
        if (alreadySubscribed) {
            return res.status(400).json({ success: false, message: 'أنت مشترك بالفعل في هذا الكورس' });
        }

        const price = course.price || 0;
        if ((user.balance || 0) < price) {
            return res.status(400).json({ success: false, message: 'رصيد المحفظة غير كافٍ لشراء هذا الكورس' });
        }

        user.balance = (user.balance || 0) - price;
        user.subscribedCourses.push({
            courseId,
            purchasedAt: new Date(),
            codeUsed: 'WALLET_BALANCE'
        });

        await user.save();
        res.json({ success: true, message: 'تم شراء الكورس بنجاح من رصيد المحفظة 🎉', balance: user.balance, user });
    } catch (err) {
        next(err);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({ role: 'student' }).select('-password');
        res.json(users);
    } catch (err) {
        next(err);
    }
};

exports.getUserById = async (req, res, next) => {
    try {
        if (req.params.id === 'admin-master-id') {
            return res.json({
                success: true,
                user: {
                    _id: 'admin-master-id',
                    role: 'admin',
                    firstName: 'الإدارة',
                    lastName: '',
                    phone: '01556448880'
                }
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'معرف مستخدم غير صالح' });
        }

        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (user && user.imagePath) {
            try {
                const publicId = extractCloudinaryPublicId(user.imagePath);
                if (publicId) await cloudinary.uploader.destroy(publicId);
            } catch (e) {
                console.error('Error deleting user avatar from Cloudinary:', e);
            }
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'معرف المستخدم غير صالح' });
        }
        const allowedFields = req.user.role === 'admin' ? ADMIN_UPDATE_FIELDS : SELF_UPDATE_FIELDS;
        const updateData = pickAllowedUpdates(req.body, allowedFields);
        const nameError = validateNames(updateData);
        if (nameError) {
            return res.status(400).json({ success: false, message: nameError.error });
        }
        if (Object.prototype.hasOwnProperty.call(updateData, 'balance')) {
            updateData.balance = Math.max(0, Number(updateData.balance) || 0);
        }
        if (Object.prototype.hasOwnProperty.call(updateData, 'role') && !['student', 'admin', 'teacher', 'assistant'].includes(updateData.role)) {
            return res.status(400).json({ success: false, message: 'صلاحية المستخدم غير صحيحة' });
        }
        if (!Object.keys(updateData).length) {
            return res.status(400).json({ success: false, message: 'لا توجد بيانات مسموح بتحديثها' });
        }

        const updated = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
        if (!updated) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        res.json({ success: true, user: updated });
    } catch (err) {
        next(err);
    }
};

exports.uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'لم يتم تحديد أي صورة لرفعها' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        if (user.imagePath) {
            try {
                const publicId = extractCloudinaryPublicId(user.imagePath);
                if (publicId) await cloudinary.uploader.destroy(publicId);
            } catch (e) {
                console.error('Error deleting old avatar from Cloudinary:', e);
            }
        }

        user.imagePath = req.file.path;
        await user.save();

        const userData = user.toObject();
        delete userData.password;

        res.json({
            success: true,
            message: 'تم تحديث الصورة الشخصية بنجاح ✅',
            imagePath: user.imagePath,
            user: userData
        });
    } catch (err) {
        next(err);
    }
};

exports.removeDevice = async (req, res, next) => {
    try {
        const { id, deviceId } = req.params;
        if (!id || !deviceId) {
            return res.status(400).json({ success: false, message: 'معرف المستخدم ومعرف الجهاز مطلوبان' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        user.devices = (user.devices || []).filter(d => d.deviceId !== deviceId);
        await user.save();

        res.json({ success: true, message: 'تم إلغاء ربط الجهاز بنجاح ✅' });
    } catch (err) {
        next(err);
    }
};

exports.studentAttendance = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id) && id !== 'admin-master-id') {
            return res.status(400).json({ success: false, message: 'معرف غير صالح' });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        const username = user.username || '';
        const phone = user.phone || '';
        const conditions = [{ studentId: id }];
        if (phone) conditions.push({ studentPhone: phone });
        if (username) {
            // Escape the username before building the prefix expression;
            // otherwise a crafted username turns the query into a wildcard
            // that returns every student's attendance records.
            conditions.push({ studentEmail: new RegExp('^' + escapeRegExp(username) + '@', 'i') });
        }

        const records = await Attendance.find({ $or: conditions }).sort({ scannedAt: -1 });

        res.json({ success: true, attendance: records });
    } catch (err) {
        next(err);
    }
};

exports.registerAttendance = async (req, res, next) => {
    try {
        const { studentId: scannedData, videoId, center, day, grade, time } = req.body;

        if (!scannedData) {
            return res.status(400).json({ success: false, message: 'بيانات الطالب مطلوبة' });
        }

        // استخراج اسم المستخدم (username) من البريد الإلكتروني أو كود الطالب
        // يقبل QR أو البريد الأكاديمي (username@...) أو اسم المستخدم أو رقم الهاتف.
        const isAdmin = req.user.role === 'admin';
        const accountTeacherId = req.user.teacherId ? String(req.user.teacherId) : null;
        if (!isAdmin && !accountTeacherId) {
            return res.status(403).json({ success: false, message: 'حساب المدرس أو المساعد غير مرتبط بمدرس' });
        }

        const hasVideo = videoId && videoId !== 'none' && videoId !== 'pending' && videoId !== 'null' && String(videoId).trim() !== '';

        // Attendance belongs to the lecture owner or to the teacher of the assistant/session.
        let attendanceTeacherId = accountTeacherId;
        if (hasVideo) {
            if (!mongoose.Types.ObjectId.isValid(videoId)) {
                return res.status(400).json({ success: false, message: 'بيانات المحاضرة غير صالحة' });
            }
            const video = await Video.findById(videoId).select('teacherId').lean();
            if (!video || !video.teacherId) {
                return res.status(404).json({ success: false, message: 'المحاضرة أو مدرسها غير موجود' });
            }
            attendanceTeacherId = String(video.teacherId);
            if (!isAdmin && attendanceTeacherId !== accountTeacherId) {
                return res.status(403).json({ success: false, message: 'لا تملك صلاحية تسجيل حضور لمحاضرة مدرس آخر' });
            }
        } else if (isAdmin && !attendanceTeacherId && req.body.teacherId) {
            attendanceTeacherId = String(req.body.teacherId);
        }

        const normalizedScannedData = String(scannedData).trim().toLowerCase();
        const username = normalizedScannedData.includes('@') ? normalizedScannedData.split('@')[0] : normalizedScannedData;

        const user = await User.findOne({
            $or: [
                { username: new RegExp('^' + username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
                { phone: username },
                ...(mongoose.Types.ObjectId.isValid(username) ? [{ _id: username }] : [])
            ]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'الطالب غير مسجل بالمنصة' });
        }

        if (hasVideo) {
            if (!user.subscribedVideos) user.subscribedVideos = [];
            if (!user.subscribedVideos.map(String).includes(String(videoId))) {
                user.subscribedVideos.push(videoId);
                await user.save();
            }
        }

        const attendance = new Attendance({
            studentId: user._id,
            studentName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
            studentPhone: user.phone || '',
            studentEmail: `${user.username}@edgeacademy.edu`,
            videoId: hasVideo ? videoId : 'none',
            teacherId: attendanceTeacherId,
            center: center || '—',
            day: day || '—',
            grade: grade || '—',
            time: time || '—',
            scannedAt: new Date()
        });

        await attendance.save();

        res.json({
            success: true,
            message: hasVideo
                ? 'تم تسجيل الحضور وفتح المحاضرة للطالب بنجاح ✅'
                : 'تم تسجيل حضور الطالب في السنتر بنجاح ✅',
            studentName: attendance.studentName,
            hasVideo
        });
    } catch (err) {
        next(err);
    }
};

exports.pendingSessions = async (req, res, next) => {
    try {
        const match = { videoId: 'pending' };
        if (req.user.role !== 'admin') {
            if (!req.user.teacherId) {
                return res.status(403).json({ success: false, message: 'حساب المدرس أو المساعد غير مرتبط بمدرس' });
            }
            match.teacherId = String(req.user.teacherId);
        }
        const results = await Attendance.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        center: '$center',
                        day: '$day',
                        grade: '$grade'
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const sessions = results.map(doc => ({
            center: doc._id.center,
            day: doc._id.day,
            grade: doc._id.grade,
            count: doc.count
        }));

        res.json({ success: true, sessions });
    } catch (err) {
        next(err);
    }
};
