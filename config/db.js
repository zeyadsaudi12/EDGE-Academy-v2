const mongoose = require('mongoose');

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    try {
        if (!process.env.MONGODB_URI) {
            console.warn('⚠️ MONGODB_URI غير معرّف في متغيرات البيئة (Environment Variables)');
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ تم الاتصال بقاعدة بيانات MongoDB بنجاح');
    } catch (err) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
        // لا يتم استدعاء process.exit(1) لضمان عدم توقف السيرفر وانهيار تحميل ملفات الـ CSS والـ JS
    }
};

module.exports = connectDB;
