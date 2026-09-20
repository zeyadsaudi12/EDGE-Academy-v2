const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    // A blank price means that this lecture is included/free.  Keeping it as
    // null lets the client distinguish it from a paid lecture priced at zero.
    price: { type: Number, default: null },
    link: { type: String, default: "" },
    imagePath: { type: String, required: true },
    videoPath: { type: String, default: "" },
    grades: { type: [String], default: [] },
    teacherId: { type: String, default: null }, // تم وضع الفاصلة هنا لتفادي انهيار الكود
    closed: { type: Boolean, default: false } ,
    playlistName: { type: String, default: "" },
    courseId: { type: String, default: "" }, // معرف الكورس / الباقة التابع لها الفيديو
    releaseAfterDays: { type: Number, default: 0 }, // بعد كام يوم من شراء الكورس يتفتح الفيديو
    examLink: { type: String, default: "" }, // رابط الامتحان المرتبط بالمحاضرة
    requiredExamId: { type: String, default: "" }, // معرف الامتحان القبلي المطلوب لاجتيازه (50% على الأقل) لفتح المحاضرة
    bookletFiles: { type: Array, default: [] }, // مصفوفة ملفات المذكرة المرفقة [{ name, url, size }]
    homeworkFiles: { type: Array, default: [] }, // مصفوفة ملفات الواجب المرفقة [{ name, url, size }]
    likes: {
        type: [String],
        default: [] // مصفوفة لتخزين معرفات الطلاب المعجبين بالفيديو
    }, // حقل قفل وفتح المحاضرات من لوحة الأدمن
    startDate: { type: String, default: "" }, // تاريخ بداية عرض المحاضرة
    endDate: { type: String, default: "" }, // تاريخ نهاية عرض المحاضرة
    hidden: { type: Boolean, default: false }, // حقل إخفاء المحاضرة
    scheduleGroup: {
        center: { type: String, default: "" },
        day: { type: String, default: "" },
        grade: { type: String, default: "" },
        time: { type: String, default: "" }
    }
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
