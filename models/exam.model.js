const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [{ type: String }],       // MCQ options (A, B, C, D)
    correctAnswer: { type: String, default: '' }, // index/text of correct answer, or model answer for essay
    type: { type: String, default: 'mcq' }  // 'mcq', 'truefalse', or 'essay'
}, { _id: true });

const examSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    teacherId: { type: String, default: null },
    teacherName: { type: String, default: '' },
    subject: { type: String, default: '' },
    grades: { type: [String], default: [] },
    duration: { type: Number, default: 30 }, // minutes
    totalMarks: { type: Number, default: 0 },
    questions: [questionSchema],
    isActive: { type: Boolean, default: true },
    // Results stored per student
    results: [{
        studentId: { type: String },
        studentName: { type: String },
        studentPhone: { type: String },
        score: { type: Number }, // score from auto-graded MCQ/TF + graded essays
        percentage: { type: Number },
        answers: [{ type: String }], // student's answers (aligned with questions array index)
        essayScores: [{
            questionIndex: { type: Number },
            score: { type: Number, default: 0 }
        }],
        isGraded: { type: Boolean, default: true }, // false if contains essays that haven't been graded yet
        submittedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

examSchema.index({ isActive: 1, createdAt: -1 });
examSchema.index({ teacherId: 1, createdAt: -1 });
examSchema.index({ grades: 1 });
examSchema.index({ 'results.studentId': 1 });

module.exports = mongoose.model('Exam', examSchema);
