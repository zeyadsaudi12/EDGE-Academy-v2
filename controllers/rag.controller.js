/**
 * controllers/rag.controller.js (admin PDF management)
 * التحكم في عمليات رفع وحذف ملفات PDF وإدارتها في ChromaDB
 */

const fs = require('fs');
const path = require('path');
const { extractAndSplitPDF } = require('../services/pdf.service');
const { addDocuments, deleteDocument, listDocuments } = require('../services/vector.service');

/**
 * رفع ملف PDF ومعالجته وتخزينه في ChromaDB
 * POST /api/admin/rag/upload-pdf
 */
async function uploadPDF(req, res) {
    // التحقق من وجود ملف في الطلب
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'الرجاء رفع ملف PDF'
        });
    }

    const file = req.file;

    // التحقق من نوع الملف (PDF فقط)
    const originalName = file.originalname || '';
    const ext = path.extname(originalName).toLowerCase();
    const mime = file.mimetype || '';

    if (ext !== '.pdf' || !mime.includes('pdf')) {
        // حذف الملف المؤقت إن وجد
        await cleanupTempFile(file.path);
        return res.status(400).json({
            success: false,
            message: 'يُسمح برفع ملفات PDF فقط'
        });
    }

    // اسم الملف للتخزين: بدون مسار (فقط الاسم الأصلي)
    const fileName = sanitizeFileName(originalName);

    // مسار الملف: إما رابط Cloudinary (file.path = URL) أو مسار محلي
    const filePath = file.path;

    try {
        // --- الخطوة 1: استخراج النص وتقطيعه ---
        const chunks = await extractAndSplitPDF(filePath, fileName);

        // --- الخطوة 2: تخزين الـ chunks في ChromaDB ---
        const { count } = await addDocuments(chunks, fileName);

        // --- الخطوة 3: حذف الملف المؤقت بعد المعالجة ---
        await cleanupTempFile(filePath);

        return res.status(200).json({
            success: true,
            message: `تم رفع الملف ومعالجته بنجاح`,
            fileName,
            chunksCount: count
        });

    } catch (err) {
        // حذف الملف المؤقت في حالة الخطأ أيضاً
        await cleanupTempFile(filePath);
        console.error('[uploadPDF] خطأ:', err.message);

        return res.status(500).json({
            success: false,
            message: err.message || 'حدث خطأ أثناء معالجة الملف'
        });
    }
}

/**
 * حذف ملف PDF من ChromaDB
 * DELETE /api/admin/rag/delete-pdf/:fileName
 */
async function deletePDF(req, res) {
    const fileName = req.params.fileName
        ? decodeURIComponent(req.params.fileName).trim()
        : '';

    if (!fileName) {
        return res.status(400).json({
            success: false,
            message: 'اسم الملف مطلوب'
        });
    }

    try {
        await deleteDocument(fileName);

        return res.status(200).json({
            success: true,
            message: `تم حذف الملف "${fileName}" من قاعدة بيانات الـ RAG بنجاح`
        });

    } catch (err) {
        console.error('[deletePDF] خطأ:', err.message);
        return res.status(500).json({
            success: false,
            message: err.message || 'حدث خطأ أثناء حذف الملف'
        });
    }
}

/**
 * استرجاع قائمة الملفات المُخزّنة في ChromaDB
 * GET /api/admin/rag/list-pdfs
 */
async function listPDFs(req, res) {
    try {
        const files = await listDocuments();
        return res.status(200).json({
            success: true,
            files,
            count: files.length
        });
    } catch (err) {
        console.error('[listPDFs] خطأ:', err.message);
        return res.status(500).json({
            success: false,
            message: err.message || 'حدث خطأ أثناء استرجاع قائمة الملفات'
        });
    }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * حذف الملف المؤقت بعد المعالجة (فقط لو مسار محلي وليس URL)
 */
async function cleanupTempFile(filePath) {
    try {
        if (filePath && !/^https?:\/\//i.test(filePath) && fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    } catch (_) {
        // تجاهل أخطاء الحذف
    }
}

/**
 * تنظيف اسم الملف من الأحرف الخطرة
 */
function sanitizeFileName(name) {
    return path.basename(name)
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .slice(0, 200);
}

module.exports = { uploadPDF, deletePDF, listPDFs };

