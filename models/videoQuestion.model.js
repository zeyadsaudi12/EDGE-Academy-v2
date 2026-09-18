const mongoose = require('mongoose');

const videoQuestionSchema = new mongoose.Schema({
    videoId: {
        type: String,
        required: true
    },
    videoTitle: {
        type: String,
        default: 'فيديو غير معروف'
    },
    question: {
        type: String,
        required: true
    },
    studentId: {
        type: String,
        required: true
    },
    studentName: {
        type: String,
        default: 'طالب مجهول'
    },
    studentPhone: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'answered'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'video_questions' });

module.exports = mongoose.model('VideoQuestion', videoQuestionSchema);
