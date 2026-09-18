const VideoQuestion = require('../models/videoQuestion.model');
const mongoose = require('mongoose');

// POST /api/video-questions
exports.createQuestion = async (req, res, next) => {
    try {
        const { videoId, videoTitle, question, studentId, studentName, studentPhone } = req.body;

        if (!videoId || !question || !studentId) {
            return res.status(400).json({ success: false, message: 'البيانات غير مكتملة' });
        }

        const newQuestion = new VideoQuestion({
            videoId,
            videoTitle: videoTitle || 'فيديو غير معروف',
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

// GET /api/video-questions
exports.getAllQuestions = async (req, res, next) => {
    try {
        const questions = await VideoQuestion.find().sort({ createdAt: -1 }).lean();
        res.json({ success: true, data: questions });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/video-questions/:id
exports.deleteQuestion = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'معرف سؤال غير صالح' });
        }

        const deleted = await VideoQuestion.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'السؤال غير موجود' });
        }

        res.json({ success: true, message: 'تم حذف السؤال بنجاح' });
    } catch (err) {
        next(err);
    }
};
