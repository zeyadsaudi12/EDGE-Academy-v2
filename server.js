require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Database Connection
const connectDB = require('./config/db');
connectDB();

// Express App
const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(compression()); // Gzip compression
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads folder
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
const videoQuestionRoutes = require('./routes/videoQuestion.routes');
const attendanceRoutes = require('./routes/attendance.routes');

app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/codes', codeRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/video-questions', videoQuestionRoutes);
app.use('/api/attendance', attendanceRoutes);

// Smart Page Router: Supports Clean URLs, .html, and legacy .php requests
app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
        return next();
    }

    let reqPath = req.path;
    if (reqPath === '/' || reqPath === '') {
        return res.sendFile(path.join(__dirname, 'index.html'));
    }

    // Remove leading slash
    const cleanPath = reqPath.replace(/^\//, '');

    // 1. If path ends with .php, check corresponding .html file
    if (cleanPath.endsWith('.php')) {
        const htmlEquivalent = cleanPath.replace(/\.php$/, '.html');
        const fullHtmlPath = path.join(__dirname, htmlEquivalent);
        if (fs.existsSync(fullHtmlPath) && fs.statSync(fullHtmlPath).isFile()) {
            return res.sendFile(fullHtmlPath);
        }
    }

    // 2. If path is extensionless (e.g. /courses or /admin), check if .html exists
    const candidateHtml = path.join(__dirname, cleanPath + '.html');
    if (fs.existsSync(candidateHtml) && fs.statSync(candidateHtml).isFile()) {
        return res.sendFile(candidateHtml);
    }

    // 3. If exact file exists (e.g. .html, .css, .js, images)
    const exactFile = path.join(__dirname, cleanPath);
    if (fs.existsSync(exactFile) && fs.statSync(exactFile).isFile()) {
        return res.sendFile(exactFile);
    }

    next();
});

// Static assets (CSS, JS, images, icons)
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

// Fallback for 404 on frontend: send index.html or 404 json
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'المسار غير موجود' });
    }
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    res.status(404).send('الصفحة غير موجودة');
});

// Centralized Error Handler
const errorHandler = require('./middleware/error');
app.use(errorHandler);

// Local development server listener
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`🚀 خادم منصة EDGE Academy (Node.js) يعمل بنجاح على: http://localhost:${port}`);
    });
}

module.exports = app;