const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.Mixed, // Supports ObjectId or String
        required: true
    },
    studentName: {
        type: String,
        default: ''
    },
    studentPhone: {
        type: String,
        default: ''
    },
    studentEmail: {
        type: String,
        default: ''
    },
    videoId: {
        type: mongoose.Schema.Types.Mixed, // Supports ObjectId or 'pending'
        default: 'pending'
    },
    // Stored server-side from the lecture owner; never trusted from the browser.
    teacherId: {
        type: String,
        default: null,
        index: true
    },
    center: {
        type: String,
        default: '—'
    },
    day: {
        type: String,
        default: '—'
    },
    grade: {
        type: String,
        default: '—'
    },
    time: {
        type: String,
        default: '—'
    },
    scannedAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'attendances', timestamps: true });

attendanceSchema.index({ studentId: 1, scannedAt: -1 });
attendanceSchema.index({ studentPhone: 1, scannedAt: -1 });
attendanceSchema.index({ studentEmail: 1 });
attendanceSchema.index({ teacherId: 1, scannedAt: -1 });
attendanceSchema.index({ videoId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
