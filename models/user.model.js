const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    secondName: { type: String, default: '' },
    thirdName: { type: String, default: '' },
    lastName: { type: String, required: true },
    birthDate: { type: Date, required: true },
    phone: { type: String, required: true, unique: true },
    parentPhone: { type: String, required: true },
    nationalId: { type: String, required: true, unique: true },
    governorate: { type: String, required: true },
    grade: { type: String, required: true },
    section: { type: String }, // Optional for prep school
    secondLanguage: { type: String }, // Optional for prep school
    password: { type: String, required: true, select: false },
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
    // Lectures the student has actually opened. Without this field Mongoose
    // silently discarded writes from markVideoWatched, so Play & Study could
    // never unlock a watched lecture.
    watchedVideos: [{
        _id: false,
        videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
        watchedAt: { type: Date, default: Date.now },
        watchCount: { type: Number, default: 1 }
    }],
    isBlocked: { type: Boolean, default: false },
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

userSchema.pre('save', async function hashPassword() {
    if (!this.isModified('password') || String(this.password).startsWith('$2')) return;
    this.password = await bcrypt.hash(String(this.password), 12);
});

// Query patterns used by admin lists, online presence, teacher scoping and
// course watcher lookups.
userSchema.index({ role: 1, grade: 1 });
userSchema.index({ role: 1, lastActive: -1 });
userSchema.index({ teacherId: 1, role: 1 });
userSchema.index({ subscribedVideos: 1 });
userSchema.index({ 'subscribedCourses.courseId': 1 });

module.exports = mongoose.model('User', userSchema);
