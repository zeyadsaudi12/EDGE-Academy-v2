const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subjectAr: { type: String, required: true },
    bio: { type: String, default: '' },
    studentsCount: { type: Number, default: 0 },
    rating: { type: Number, default: 5 },
    imagePath: { type: String, default: '' },
    // The password is deliberately never stored here; it is stored in the
    // linked User account.  This field is only a safe indicator for admin UI.
    teacherAccountPhone: { type: String, default: '' },
    // الإخفاء يعطّل ظهور المدرس وكل محتواه للطلاب دون حذف البيانات.
    hidden: { type: Boolean, default: false },
    grades: [{ type: String }],
    schedule: [{
        center: { type: String },
        day: { type: String },
        grade: { type: String },
        time: { type: String }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
