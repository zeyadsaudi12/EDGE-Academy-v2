const mongoose = require('mongoose');

// Cache the connection promise to avoid reconnecting on every serverless invocation
let connectionPromise = null;

const connectDB = async () => {
    // Already connected
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    // Return existing connection promise if one is in progress
    if (connectionPromise) {
        return connectionPromise;
    }

    if (!process.env.MONGODB_URI) {
        console.warn('⚠️ MONGODB_URI غير معرّف في متغيرات البيئة (Environment Variables)');
        throw new Error('MONGODB_URI is not defined in environment variables');
    }

    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,            // Reuse connections in the pool
        minPoolSize: 1,
        socketTimeoutMS: 45000,
        family: 4,                  // Force IPv4 — faster on Vercel
    }).then(conn => {
        console.log('✅ تم الاتصال بقاعدة بيانات MongoDB بنجاح');
        return conn;
    }).catch(err => {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
        connectionPromise = null;   // Reset so next call retries
        throw err;
    });

    return connectionPromise;
};

module.exports = connectDB;
