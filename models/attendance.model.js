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

module.exports = mongoose.model('Attendance', attendanceSchema);
