const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthDate: { type: Date, required: true },
    phone: { type: String, required: true, unique: true },
    parentPhone: { type: String, required: true },
    nationalId: { type: String, required: true, unique: true },
    governorate: { type: String, required: true },
    grade: { type: String, required: true },
    section: { type: String }, // Optional for prep school
    secondLanguage: { type: String }, // Optional for prep school
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    role: { type: String, enum: ['student', 'admin', 'teacher', 'assistant'], default: 'student' },
    // True only for the private account created for the teacher himself.  It
    // keeps that account distinct from the attendance assistant account.
    isTeacherAccount: { type: Boolean, default: false },
    imagePath: { type: String, default: '' },
    teacherId: { type: mongoose.Schema.Types.Mixed, default: null },
    devices: [{
        deviceId: { type: String, required: true },
        deviceName: { type: String, default: 'متصفح ويب' },
        ip: { type: String, default: 'unknown' },
        lastUsed: { type: Date, default: Date.now }
    }],
    
    // تم إضافة حقول المتابعة والاشتراك لقاعدة البيانات هنا بشكل صحيح
    followedTeachers: { 
        type: [String], 
        default: [] 
    },
    subscribedVideos: { 
        type: [mongoose.Schema.Types.Mixed], 
        default: [] 
    },
    subscribedCourses: {
        type: [{
            courseId: { type: String, required: true },
            purchasedAt: { type: Date, default: Date.now },
            codeUsed: { type: String, default: '' }
        }],
        default: []
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
    
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
