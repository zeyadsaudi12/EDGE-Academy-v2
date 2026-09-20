const User = require('../models/user.model');
const Code = require('../models/code.model');
const Course = require('../models/course.model');
const Video = require('../models/video.model');
const Attendance = require('../models/attendance.model');
const mongoose = require('mongoose');
const { cloudinary } = require('../middleware/upload');

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

        // 1. التحقق من كود الشحن وصلاحيته لهذا الفيديو
        const code = await Code.findOne({ code: codeStr, videoId });
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

        if (!user.subscribedVideos) user.subscribedVideos = [];
        if (!user.subscribedVideos.includes(videoId)) {
            user.subscribedVideos.push(videoId);
        }

        // 3. ربط الكود بالطالب وزيادة الـ views
        code.views += 1;
        code.used = true;
        code.studentId = req.params.id;

        await Promise.all([user.save(), code.save()]);
        res.json({ success: true, remainingViews: 1 - code.views, user });
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
        if (!video) return res.status(404).json({ success: false, message: 'المحاضرة غير موجودة' });
        if (video.closed) return res.status(403).json({ success: false, message: 'هذه المحاضرة مغلقة حالياً' });

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

        const code = await Code.findOne({ code: codeStr, videoId: courseId });
        if (!code) {
            return res.status(404).json({ success: false, message: 'كود الاشتراك غير صحيح أو لا يخص هذا الكورس' });
        }
        if (code.views >= 1) {
            return res.status(400).json({ success: false, message: 'هذا الكود مستخدم بالفعل' });
        }

        const user = await User.findById(studentId);
        if (!user) return res.status(404).json({ success: false, message: 'الطالب غير موجود' });

        if (!user.subscribedCourses) user.subscribedCourses = [];
        const alreadySubscribed = user.subscribedCourses.some(c => c.courseId === courseId);
        if (alreadySubscribed) {
            return res.status(400).json({ success: false, message: 'أنت مشترك بالفعل في هذا الكورس' });
        }

        user.subscribedCourses.push({
            courseId,
            purchasedAt: new Date(),
            codeUsed: codeStr
        });

        code.views += 1;
        code.used = true;
        code.studentId = studentId;

        await Promise.all([user.save(), code.save()]);
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

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: 'الكورس غير موجود' });

        const user = await User.findById(studentId);
        if (!user) return res.status(404).json({ success: false, message: 'الطالب غير موجود' });

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
        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.password;
        if (updateData.lastActive) delete updateData.lastActive;

        const updated = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
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

        const records = await Attendance.find({
            $or: [
                { studentId: id },
                { studentPhone: phone },
                { studentEmail: new RegExp('^' + username + '@', 'i') }
            ]
        }).sort({ scannedAt: -1 });

        res.json({ success: true, attendance: records });
    } catch (err) {
        next(err);
    }
};

exports.registerAttendance = async (req, res, next) => {
    try {
        const { studentId: scannedData, videoId, center, day, grade, time } = req.body;

        if (!scannedData || !videoId) {
            return res.status(400).json({ success: false, message: 'بيانات الطالب والمحاضرة مطلوبة' });
        }

        // استخراج اسم المستخدم (username) من البريد الإلكتروني أو كود الطالب
        // يقبل QR أو البريد الأكاديمي (username@...) أو اسم المستخدم أو رقم الهاتف.
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

        if (!user.subscribedVideos) user.subscribedVideos = [];
        if (videoId !== 'pending' && !user.subscribedVideos.map(String).includes(String(videoId))) {
            user.subscribedVideos.push(videoId);
            await user.save();
        }

        const attendance = new Attendance({
            studentId: user._id,
            studentName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            studentPhone: user.phone || '',
            studentEmail: `${user.username}@edgeacademy.edu`,
            videoId: videoId === 'pending' ? 'pending' : videoId,
            center: center || '—',
            day: day || '—',
            grade: grade || '—',
            time: time || '—',
            scannedAt: new Date()
        });

        await attendance.save();

        res.json({
            success: true,
            message: 'تم تسجيل الحضور وفتح المحاضرة للطالب بنجاح ✅',
            studentName: attendance.studentName
        });
    } catch (err) {
        next(err);
    }
};

exports.pendingSessions = async (req, res, next) => {
    try {
        const results = await Attendance.aggregate([
            { $match: { videoId: 'pending' } },
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
