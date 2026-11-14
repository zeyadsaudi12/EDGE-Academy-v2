const mongoose = require('mongoose');

// A quiz attempt is issued by startQuiz and consumed exactly once by submitQuiz.
// Answers stay on the server, so the browser never receives the answer key and
// cannot replay or forge a completed attempt.
const quizSessionSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers: { type: [String], default: [] },
    lectureTitle: { type: String, default: 'عام' },
    subject: { type: String, default: 'عام' },
    consumed: { type: Boolean, default: false },
    consumedAt: { type: Date },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

quizSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('QuizSession', quizSessionSchema);
