require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');

// Database Connection
const connectDB = require('./config/db');
connectDB();

// Express App
const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(compression()); // ✅ Gzip compression
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files with caching
app.use(express.static(path.join(__dirname), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    etag: true
}));

// Route Definitions
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const videoRoutes = require('./routes/video.routes');
const codeRoutes = require('./routes/code.routes');
const teacherRoutes = require('./routes/teacher.routes');
const securityRoutes = require('./routes/security.routes');
const examRoutes = require('./routes/exam.routes');
const bannerRoutes = require('./routes/banner.routes');
const courseRoutes = require('./routes/course.routes');

app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/codes', codeRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/courses', courseRoutes);

// Centralized Error Handler
const errorHandler = require('./middleware/error');
app.use(errorHandler);

app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'MASAR API is running 🚀'
    });
});
// Local development only
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`🚀 الخادم يعمل على: http://localhost:${port}`);
    });
}

module.exports = app;