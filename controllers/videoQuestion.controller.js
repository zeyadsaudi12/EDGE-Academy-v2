const VideoQuestion = require('../models/videoQuestion.model');
const Video = require('../models/video.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

async function getQuestionScope(userId) {
    if (userId === 'admin-master-id') return { admin: true };
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const user = await User.findById(userId).select('role teacherId').lean();
    if (!user) return null;
    if (user.role === 'admin') return { admin: true };
    if (user.role === 'assistant' && user.teacherId) {
        return { teacherId: String(user.teacherId) };
    }
    if (user.role === 'teacher') {
        return { teacherId: String(user.teacherId || user._id) };
    }
    return null;
}

// POST /api/video-questions
exports.createQuestion = async (req, res, next) => {
    try {
        const { videoId, videoTitle, question } = req.body;
        const studentId = String(req.user._id);
        const studentName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
        const studentPhone = req.user.phone || '';

        if (!videoId || !question || !studentId) {
            return res.status(400).json({ success: false, message: 'البيانات غير مكتملة' });
        }

        const video = await Video.findById(videoId).select('title teacherId').lean();
        if (!video) return res.status(404).json({ success: false, message: 'المحاضرة غير موجودة' });
        if (!video.teacherId) return res.status(400).json({ success: false, message: 'لا يوجد مدرس محدد لهذه المحاضرة' });

        const newQuestion = new VideoQuestion({
            videoId: String(videoId),
            videoTitle: videoTitle || video.title || 'فيديو غير معروف',
            teacherId: String(video.teacherId),
            question,
            studentId,
            studentName: studentName || 'طالب مجهول',
            studentPhone: studentPhone || '',
            status: 'pending'
        });

        await newQuestion.save();
        res.status(201).json({ success: true, data: newQuestion });
    } catch (err) {
        next(err);
    }
};

// GET /api/video-questions?userId=...
exports.getAllQuestions = async (req, res, next) => {
    try {
        const scope = await getQuestionScope(String(req.user._id));
        if (!scope) return res.status(403).json({ success: false, message: 'يلزم تسجيل الدخول بحساب مساعد أو مدرس' });

        let targetTeacherId = null;
        if (scope.admin) {
            if (req.query.teacherId) {
                targetTeacherId = String(req.query.teacherId);
            } else if (req.query.userId && req.query.userId !== 'admin-master-id') {
                const targetScope = await getQuestionScope(String(req.query.userId));
                if (targetScope && targetScope.teacherId) {
                    targetTeacherId = targetScope.teacherId;
                }
            }
            if (!targetTeacherId) {
                // Return all questions belonging to existing videos
                const allVideos = await Video.find().select('_id').lean();
                const allVideoIds = allVideos.map(v => String(v._id));
                const questions = await VideoQuestion.find({
                    videoId: { $in: allVideoIds }
                }).sort({ createdAt: -1 }).lean();
                return res.json({ success: true, data: questions });
            }
        } else {
            targetTeacherId = scope.teacherId;
        }

        if (!targetTeacherId) {
            return res.json({ success: true, data: [] });
        }

        // Get all videos strictly owned by this teacher
        const ownedVideos = await Video.find({ teacherId: targetTeacherId }).select('_id').lean();
        const videoIds = ownedVideos.map(video => String(video._id));

        if (!videoIds.length) {
            return res.json({ success: true, data: [] });
        }

        // Questions must strictly belong to one of this teacher's videos
        const questions = await VideoQuestion.find({
            videoId: { $in: videoIds }
        }).sort({ createdAt: -1 }).lean();

        res.json({ success: true, data: questions });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/video-questions/:id?userId=...
exports.deleteQuestion = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'معرف سؤال غير صالح' });
        }

        const scope = await getQuestionScope(String(req.user._id));
        if (!scope) return res.status(403).json({ success: false, message: 'غير مصرح بحذف السؤال' });
        const question = await VideoQuestion.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ success: false, message: 'السؤال غير موجود' });
        }
        if (!scope.admin && String(question.teacherId || '') !== scope.teacherId) {
            const video = await Video.findById(question.videoId).select('teacherId').lean();
            if (!video || String(video.teacherId) !== scope.teacherId) {
                return res.status(403).json({ success: false, message: 'لا تملك صلاحية هذا السؤال' });
            }
        }
        await question.deleteOne();

        res.json({ success: true, message: 'تم حذف السؤال بنجاح' });
    } catch (err) {
        next(err);
    }
};
