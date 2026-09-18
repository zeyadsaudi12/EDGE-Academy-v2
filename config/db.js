const mongoose = require('mongoose');

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }
    if (mongoose.connection.readyState === 2) {
        // Currently connecting, wait for it
        return new Promise((resolve, reject) => {
            mongoose.connection.once('connected', () => resolve(mongoose.connection));
            mongoose.connection.once('error', (err) => reject(err));
        });
    }
    try {
        if (!process.env.MONGODB_URI) {
            console.warn('⚠️ MONGODB_URI غير معرّف في متغيرات البيئة (Environment Variables)');
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
        });
        console.log('✅ تم الاتصال بقاعدة بيانات MongoDB بنجاح');
        return mongoose.connection;
    } catch (err) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
        throw err;
    }
};

module.exports = connectDB;
