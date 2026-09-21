const Code = require('../models/code.model');
const Video = require('../models/video.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

exports.verifyCode = async (req, res, next) => {
    try {
        const { codeStr, videoId, studentId } = req.body;

        // 0. التحقق من حالة قفل المحاضرة أولاً
        const video = await Video.findById(videoId);
        if (!video) return res.status(404).json({ success: false, message: 'المحاضرة غير موجودة' });
        if (video.closed) {
            return res.status(403).json({ success: false, message: 'هذه المحاضرة مغلقة حالياً بواسطة الإدارة' });
        }

        // 1. الأدمن والطلاب المشتركون فقط يمرون مباشرة. المحاضرة المجانية
        // تحتاج اشتراكاً مجانياً صريحاً حتى تظهر في قائمة المشاهدين.
        if (studentId === 'admin-master-id') {
            return res.json({ success: true, remainingViews: 'مفتوحة دائماً', alreadySubscribed: true });
        }

        if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
            const user = await User.findById(studentId);
            if (user) {
                const isAdmin = user.role === 'admin' || user.phone === '01556448880' || user.phone === '01234567890';
                const hasVideoSubscription = Array.isArray(user.subscribedVideos) && user.subscribedVideos
                    .map(id => String(id))
                    .includes(String(videoId));
                // الاشتراك في الكورس يفتح جميع محاضراته؛ كان التحقق ينظر
                // لاشتراك الفيديو المنفرد فقط، فيمنع الطالب المشترك في الكورس.
                const hasCourseSubscription = Boolean(video.courseId) && Array.isArray(user.subscribedCourses) && user.subscribedCourses
                    .some(enrollment => String(typeof enrollment === 'string' ? enrollment : enrollment.courseId) === String(video.courseId));
                if (isAdmin || hasVideoSubscription || hasCourseSubscription) {
                    return res.json({ success: true, remainingViews: 'مفتوحة دائماً', alreadySubscribed: true });
                }
            }
        }

        // 2. إذا لم يكن مشتركاً، نطالبه بالتحقق من كود الشحن
        if (!codeStr) {
            return res.status(400).json({ success: false, message: 'يرجى إدخال كود الشحن لتفعيل الاشتراك' });
        }

        const code = await Code.findOne({ code: codeStr, videoId });
        if (!code) {
            return res.status(404).json({ success: false, message: 'كود غير صحيح' });
        }
        if (code.views >= 1) {
            return res.status(400).json({ success: false, message: 'هذا الكود تم استخدامه بالفعل (صالح للاستخدام مرة واحدة فقط)' });
        }
        if (code.studentId && code.studentId.toString() !== studentId) {
            return res.status(403).json({ success: false, message: 'كود مستخدم من طالب آخر' });
        }

        // تفعيل الاشتراك الدائم للطالب في الداتابيز ليراها في بروفايله وتفتح له دائماً
        if (studentId && mongoose.Types.ObjectId.isValid(studentId) && studentId !== 'admin-master-id') {
            const user = await User.findById(studentId);
            if (user) {
                if (!user.subscribedVideos) user.subscribedVideos = [];
                if (!user.subscribedVideos.includes(videoId)) {
                    user.subscribedVideos.push(videoId);
                    await user.save();
                }
            }
        }

        code.views += 1;
        code.used = true;
        if (!code.studentId && studentId && mongoose.Types.ObjectId.isValid(studentId) && studentId !== 'admin-master-id') {
            code.studentId = studentId;
        }
        await code.save();

        res.json({ success: true, remainingViews: 1 - code.views, code });
    } catch (err) {
        next(err);
    }
};

exports.getAllCodes = async (req, res, next) => {
    try {
        const codes = await Code.find().sort({ createdAt: -1 }).lean();
        res.json(codes);
    } catch (err) {
        next(err);
    }
};

exports.generateCodes = async (req, res, next) => {
    try {
        const { videoId, videoTitle, value } = req.body;
        // Sanitize and validate generated codes count between 1 and 1000
        const count = Math.min(Math.max(parseInt(req.body.count) || 1, 1), 1000);

        const newCodes = [];
        for (let i = 0; i < count; i++) {
            const codeStr = 'MS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            newCodes.push({ code: codeStr, videoId, videoTitle, value });
        }
        const savedCodes = await Code.insertMany(newCodes);
        res.status(201).json({ success: true, codes: savedCodes });
    } catch (err) {
        next(err);
    }
};

exports.updateCode = async (req, res, next) => {
    try {
        const { used } = req.body;
        await Code.findByIdAndUpdate(req.params.id, { used });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};

exports.deleteCode = async (req, res, next) => {
    try {
        await Code.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};

exports.deleteAllCodes = async (req, res, next) => {
    try {
        await Code.deleteMany({});
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};
