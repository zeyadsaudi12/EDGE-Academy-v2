// ─── Polyfills for Vercel Serverless (pdf-parse requires browser APIs) ──────
if (typeof globalThis.DOMMatrix === 'undefined') {
    globalThis.DOMMatrix = class DOMMatrix {
        constructor() { this.a=1;this.b=0;this.c=0;this.d=1;this.e=0;this.f=0; }
        static fromMatrix() { return new DOMMatrix(); }
        static fromFloat32Array() { return new DOMMatrix(); }
        static fromFloat64Array() { return new DOMMatrix(); }
        multiply() { return new DOMMatrix(); }
        translate() { return new DOMMatrix(); }
        scale() { return new DOMMatrix(); }
        rotate() { return new DOMMatrix(); }
        inverse() { return new DOMMatrix(); }
        transformPoint(p) { return p || { x:0, y:0 }; }
    };
}
if (typeof globalThis.ImageData === 'undefined') {
    globalThis.ImageData = class ImageData {
        constructor(w, h) { this.width=w; this.height=h; this.data=new Uint8ClampedArray(w*h*4); }
    };
}
if (typeof globalThis.Path2D === 'undefined') {
    globalThis.Path2D = class Path2D {
        constructor() {}
        moveTo() {} lineTo() {} closePath() {} arc() {} rect() {}
        addPath() {} bezierCurveTo() {} quadraticCurveTo() {}
    };
}
// ─────────────────────────────────────────────────────────────────────────────

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
try {
    const tmpUploads = path.join('/tmp', 'uploads');
    if (fs.existsSync(tmpUploads)) {
        app.use('/uploads', express.static(tmpUploads, { maxAge: '7d', etag: true }));
    }
} catch (e) {}

// ============================================================
// CLEAN URLs: Redirect *.html, *.php, /index to clean extensionless URLs
// e.g. /courses.html -> /courses, /admin.html -> /admin, /index.html -> /
// ============================================================
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();

    // 1. If path is /index, /index.html, /index.php -> 301 redirect to /
    if (req.path === '/index' || req.path === '/index.html' || req.path === '/index.php') {
        const queryIdx = req.url.indexOf('?');
        const query = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
        return res.redirect(301, '/' + query);
    }

    // 2. If path ends with .html or .php -> 301 redirect to clean path
    if (req.path.endsWith('.html') || req.path.endsWith('.php')) {
        const cleanPath = req.path.replace(/\.(html|php)$/i, '');
        const queryIdx = req.url.indexOf('?');
        const query = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
        return res.redirect(301, cleanPath + query);
    }

    // 3. Remove trailing slashes (except root /)
    if (req.path.length > 1 && req.path.endsWith('/')) {
        const cleanPath = req.path.slice(0, -1);
        const queryIdx = req.url.indexOf('?');
        const query = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
        return res.redirect(301, cleanPath + query);
    }

    next();
});

// Static assets — CSS, JS, images served directly with correct Content-Type
app.use(express.static(path.join(__dirname), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    index: false
}));

// Database Connection Middleware for API routes: ensures DB is connected before any query runs
app.use('/api', async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات قبل تنفيذ الطلب:', err.message);
        return res.status(503).json({
            success: false,
            message: 'تعذر الاتصال بقاعدة البيانات. تأكد من إضافة 0.0.0.0/0 في Network Access في MongoDB Atlas.',
            error: err.message
        });
    }
});

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

    // Skip requests for static file extensions — already handled above
    const staticExts = /\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|mp4|webm|pdf|json|map)$/i;
    if (staticExts.test(req.path)) {
        return next();
    }

    let reqPath = req.path;
    if (reqPath === '/' || reqPath === '') {
        res.setHeader('Cache-Control', 'no-cache');
        return res.sendFile(path.join(__dirname, 'index.html'));
    }

    // Remove leading slash
    const cleanPath = reqPath.replace(/^\//, '');

    // 1. If path ends with .php, check corresponding .html file
    if (cleanPath.endsWith('.php')) {
        const htmlEquivalent = cleanPath.replace(/\.php$/, '.html');
        const fullHtmlPath = path.join(__dirname, htmlEquivalent);
        if (fs.existsSync(fullHtmlPath) && fs.statSync(fullHtmlPath).isFile()) {
            res.setHeader('Cache-Control', 'no-cache');
            return res.sendFile(fullHtmlPath);
        }
    }

    // 2. If path is extensionless (e.g. /courses or /admin), check if .html exists
    const candidateHtml = path.join(__dirname, cleanPath + '.html');
    if (fs.existsSync(candidateHtml) && fs.statSync(candidateHtml).isFile()) {
        res.setHeader('Cache-Control', 'no-cache');
        return res.sendFile(candidateHtml);
    }

    next();
});

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