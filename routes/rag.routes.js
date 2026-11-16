/**
 * routes/rag.routes.js
 * Routes الخاصة بنظام RAG (رفع وحذف ملفات PDF) - للأدمن فقط
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, allowRoles } = require('../middleware/auth');
const ragController = require('../controllers/rag.controller');

const router = express.Router();

// ─── Multer: تخزين محلي مؤقت للـ PDF قبل إرساله لـ ChromaDB ───────────────
// نستخدم تخزين محلي مؤقت (وليس Cloudinary) لأن pdf-parse يحتاج الـ buffer
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'pdfs');

// إنشاء مجلد الرفع إن لم يكن موجوداً
try {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
} catch (_) {}

const pdfStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        // اسم فريد لتجنب التعارض
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `pdf-${unique}${ext}`);
    }
});

const pdfUpload = multer({
    storage: pdfStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // حد أقصى 20MB
    fileFilter: (_req, file, cb) => {
        // قبول PDF فقط
        if (
            file.mimetype === 'application/pdf' ||
            path.extname(file.originalname).toLowerCase() === '.pdf'
        ) {
            cb(null, true);
        } else {
            cb(new Error('يُسمح برفع ملفات PDF فقط'), false);
        }
    }
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// رفع ملف PDF ومعالجته وحفظه في ChromaDB
router.post(
    '/upload-pdf',
    authenticate,
    allowRoles('admin'),
    pdfUpload.single('pdf'),
    ragController.uploadPDF
);

// حذف ملف من ChromaDB
router.delete(
    '/delete-pdf/:fileName',
    authenticate,
    allowRoles('admin'),
    ragController.deletePDF
);

// قائمة الملفات المُخزّنة
router.get(
    '/list-pdfs',
    authenticate,
    allowRoles('admin'),
    ragController.listPDFs
);

// معالجة أخطاء multer
router.use((err, _req, res, _next) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'حجم الملف يتجاوز الحد المسموح به (20MB)' });
    }
    return res.status(400).json({ success: false, message: err.message || 'خطأ في رفع الملف' });
});

module.exports = router;

