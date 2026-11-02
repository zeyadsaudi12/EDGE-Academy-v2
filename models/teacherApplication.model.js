const mongoose = require('mongoose');

const teacherApplicationSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true, maxlength: 140 },
    subject: { type: String, required: true, trim: true },
    grades: [{ type: String, required: true }],
    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, required: true, trim: true },
    // This is an application asset only. It is never copied to the public
    // teacher profile automatically; the admin chooses the public design.
    photoPath: { type: String, required: true },
    photoPublicId: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null }
}, { timestamps: true });

module.exports = mongoose.model('TeacherApplication', teacherApplicationSchema);
