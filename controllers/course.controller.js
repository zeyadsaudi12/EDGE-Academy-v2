const Course = require('../models/course.model');
const Video = require('../models/video.model');
const User = require('../models/user.model');
const Teacher = require('../models/teacher.model');
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

// GET /api/courses
exports.getCourses = async (req, res, next) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 }).lean();
        for (let course of courses) {
            const count = await Video.countDocuments({ courseId: course._id.toString() });
            course.videoCount = count;
            if (course.teacherId) {
                const teacher = await Teacher.findById(course.teacherId).lean();
                if (teacher) {
                    course.teacherName = teacher.name;
                    course.teacherImage = teacher.imagePath;
                    course.teacherSubject = teacher.subjectAr;
                }
            }
        }
        res.json(courses);
    } catch (err) {
        next(err);
    }
};

// GET /api/courses/:id
exports.getCourseById = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id).lean();
        if (!course) return res.status(404).json({ success: false, message: 'الكورس غير موجود' });

        if (course.teacherId) {
            const teacher = await Teacher.findById(course.teacherId).lean();
            if (teacher) {
                course.teacherName = teacher.name;
                course.teacherImage = teacher.imagePath;
                course.teacherSubject = teacher.subjectAr;
            }
        }

        const videos = await Video.find({ courseId: req.params.id }).sort({ createdAt: 1 }).lean();
        course.videos = videos;
        course.videoCount = videos.length;

        res.json({ success: true, course });
    } catch (err) {
        next(err);
    }
};

// POST /api/courses
exports.createCourse = async (req, res, next) => {
    try {
        const { title, description, price, teacherId, grades, hidden } = req.body;
        const imagePath = req.file ? req.file.path : '';
        const gradesArr = Array.isArray(grades) ? grades : (grades ? grades.split(',').map(s => s.trim()) : []);

        const course = new Course({
            title,
            description: description || '',
            price: Number(price) || 0,
            teacherId: teacherId || null,
            grades: gradesArr,
            imagePath,
            hidden: hidden === 'true' || hidden === true
        });

        await course.save();
        res.status(201).json({ success: true, message: 'تم إنشاء الكورس بنجاح', course });
    } catch (err) {
        next(err);
    }
};

// PUT /api/courses/:id
exports.updateCourse = async (req, res, next) => {
    try {
        const { title, description, price, teacherId, grades, hidden } = req.body;
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = Number(price);
        if (teacherId !== undefined) updateData.teacherId = teacherId;
        if (grades !== undefined) updateData.grades = Array.isArray(grades) ? grades : grades.split(',').map(s => s.trim());
        if (hidden !== undefined) updateData.hidden = hidden === 'true' || hidden === true;

        if (req.file) {
            updateData.imagePath = req.file.path;
            try {
                const oldCourse = await Course.findById(req.params.id);
                if (oldCourse && oldCourse.imagePath) {
                    const publicId = extractCloudinaryPublicId(oldCourse.imagePath);
                    if (publicId) await cloudinary.uploader.destroy(publicId);
                }
            } catch (err) {
                console.error('Error deleting old course image from Cloudinary:', err);
            }
        }

        const updated = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ success: true, message: 'تم تحديث الكورس بنجاح', course: updated });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/courses/:id
exports.deleteCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (course && course.imagePath) {
            try {
                const publicId = extractCloudinaryPublicId(course.imagePath);
                if (publicId) await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.error('Error deleting course image from Cloudinary:', err);
            }
        }

        await Course.findByIdAndDelete(req.params.id);
        await Video.updateMany({ courseId: req.params.id }, { $set: { courseId: '' } });
        res.json({ success: true, message: 'تم حذف الكورس بنجاح' });
    } catch (err) {
        next(err);
    }
};

// GET /api/courses/:id/videos?userId=xxx  → فيديوهات الكورس مع حالة الفتح لطالب معين
exports.getCourseVideosForStudent = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id).lean();
        if (!course) return res.status(404).json({ success: false, message: 'الكورس غير موجود' });

        const videos = await Video.find({ courseId: req.params.id }).sort({ releaseAfterDays: 1, createdAt: 1 }).lean();

        const { userId } = req.query;
        let purchasedAt = null;
        let isEnrolled = false;

        if (userId) {
            const user = await User.findById(userId).lean();
            if (user && user.subscribedCourses) {
                const enrollment = user.subscribedCourses.find(e => e.courseId === req.params.id);
                if (enrollment) {
                    purchasedAt = new Date(enrollment.purchasedAt);
                    isEnrolled = true;
                }
            }
        }

        const now = new Date();
        const videosWithStatus = videos.map(v => {
            let isUnlocked = false;
            let unlocksAt = null;
            let daysRemaining = null;

            if (isEnrolled && purchasedAt) {
                const unlockDate = new Date(purchasedAt);
                unlockDate.setDate(unlockDate.getDate() + (v.releaseAfterDays || 0));
                isUnlocked = now >= unlockDate;
                unlocksAt = unlockDate.toISOString();
                if (!isUnlocked) {
                    daysRemaining = Math.ceil((unlockDate - now) / (1000 * 60 * 60 * 24));
                }
            }

            return {
                _id: v._id,
                title: v.title,
                imagePath: v.imagePath,
                releaseAfterDays: v.releaseAfterDays || 0,
                isUnlocked,
                unlocksAt,
                daysRemaining,
                // البيانات التالية فقط للفيديوهات المفتوحة
                ...(isUnlocked ? { link: v.link, videoPath: v.videoPath, examLink: v.examLink } : {})
            };
        });

        res.json({ success: true, course, videos: videosWithStatus, isEnrolled });
    } catch (err) {
        next(err);
    }
};

// POST /api/courses/:id/buy  → شراء الكورس بكود
exports.subscribeToCourse = async (req, res, next) => {
    try {
        const mongoose = require('mongoose');
        const Code = require('../models/code.model');
        const { codeStr, userId } = req.body;
        const courseId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'معرف مستخدم غير صالح' });
        }

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: 'الكورس غير موجود' });

        // التحقق من الكود
        const code = await Code.findOne({ code: codeStr, videoId: courseId });
        if (!code) {
            return res.status(404).json({ success: false, message: 'كود الاشتراك غير صحيح أو لا يخص هذا الكورس' });
        }
        if (code.views >= 1) {
            return res.status(400).json({ success: false, message: 'هذا الكود مستخدم بالفعل' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        // التحقق إذا الطالب مشترك بالفعل
        const alreadyEnrolled = user.subscribedCourses && user.subscribedCourses.some(e => e.courseId === courseId);
        if (alreadyEnrolled) {
            return res.status(400).json({ success: false, message: 'أنت مشترك في هذا الكورس بالفعل' });
        }

        // إضافة الاشتراك
        if (!user.subscribedCourses) user.subscribedCourses = [];
        user.subscribedCourses.push({ courseId, purchasedAt: new Date(), codeUsed: codeStr });

        // تحديث الكود
        code.views += 1;
        code.used = true;
        code.studentId = userId;

        await Promise.all([user.save(), code.save()]);

        res.json({ success: true, message: `تم الاشتراك في كورس "${course.title}" بنجاح! 🎉` });
    } catch (err) {
        next(err);
    }
};

// GET /api/courses/:id/students  → قائمة الطلاب المشتركين في الكورس
exports.getCourseStudents = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const students = await User.find({
            'subscribedCourses.courseId': courseId
        }).select('_id firstName lastName phone grade parentPhone').lean();

        res.json({ success: true, students });
    } catch (err) {
        next(err);
    }
};
