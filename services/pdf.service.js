/**
 * services/pdf.service.js
 * استخراج النص من ملفات PDF وتقطيعها إلى chunks جاهزة للتخزين في Vector DB
 */

const pdfParseModule = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// دعم كلاً من إصدار pdf-parse v2 (Class) وإصدار v1 (Function)
async function parsePDFBuffer(dataBuffer) {
    if (pdfParseModule.PDFParse) {
        const parser = new pdfParseModule.PDFParse({ data: dataBuffer });
        try {
            const result = await parser.getText();
            return {
                text: result?.text || '',
                numpages: result?.total || result?.pages || 1
            };
        } finally {
            if (typeof parser.destroy === 'function') {
                await parser.destroy();
            }
        }
    } else if (typeof pdfParseModule === 'function') {
        const res = await pdfParseModule(dataBuffer);
        return {
            text: res.text || '',
            numpages: res.numpages || 1
        };
    } else {
        throw new Error('حزمة pdf-parse غير مهيأة بالشكل الصحيح');
    }
}

// حجم الـ chunk وعدد الكلمات المتداخلة بين الـ chunks
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

/**
 * تقطيع النص الطويل إلى chunks بحجم ثابت مع تداخل
 * @param {string} text - النص الكامل
 * @param {string} fileName - اسم الملف للـ metadata
 * @param {number} pageNumber - رقم الصفحة للـ metadata
 * @returns {Array<{pageContent: string, metadata: object}>}
 */
function splitTextIntoChunks(text, fileName, pageNumber) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + CHUNK_SIZE, text.length);
        const chunkText = text.slice(start, end).trim();

        // تخطي الـ chunks الفارغة
        if (chunkText.length > 20) {
            chunks.push({
                pageContent: chunkText,
                metadata: {
                    source: fileName,
                    fileName: fileName,
                    page: pageNumber
                }
            });
        }

        // تقدم بـ (CHUNK_SIZE - CHUNK_OVERLAP) لضمان التداخل
        start += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    return chunks;
}

/**
 * استخراج النص من ملف PDF وتقطيعه إلى chunks
 * يدعم القراءة من رابط URL (Cloudinary) أو مسار محلي
 * @param {string} filePath - مسار الملف المحلي أو رابط URL
 * @param {string} fileName - اسم الملف الأصلي (للـ metadata)
 * @returns {Promise<Array<{pageContent: string, metadata: object}>>}
 */
async function extractAndSplitPDF(filePath, fileName) {
    let dataBuffer;

    // قراءة الملف: من URL (Cloudinary) أو من مسار محلي
    if (/^https?:\/\//i.test(filePath)) {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`تعذر تنزيل ملف PDF من Cloudinary (HTTP ${response.status})`);
        }
        dataBuffer = Buffer.from(await response.arrayBuffer());
    } else {
        if (!fs.existsSync(filePath)) {
            throw new Error(`الملف غير موجود: ${filePath}`);
        }
        dataBuffer = await fs.promises.readFile(filePath);
    }

    // استخراج النص من PDF
    let pdfData;
    try {
        pdfData = await parsePDFBuffer(dataBuffer);
    } catch (err) {
        throw new Error(`فشل في قراءة ملف PDF: ${err.message}`);
    }

    // التحقق من وجود نص قابل للقراءة (ليس PDF مصوّر)
    const extractedText = pdfData.text ? pdfData.text.trim() : '';
    if (!extractedText || extractedText.length < 50) {
        throw new Error(
            'لا يحتوي ملف PDF على نص قابل للاستخراج. ' +
            'يبدو أنه ملف مصوّر (Scanned PDF). ' +
            'يرجى رفع ملف PDF يحتوي على نص حقيقي أو استخدام OCR أولاً.'
        );
    }

    // ⚠️ ملاحظة: pdf-parse قد يعكس ترتيب النص العربي (RTL) في بعض الحالات.
    // هذا بسبب طريقة ترميز النص في الـ PDF وليس خطأ في الكود.
    // الحل: تأكد أن الـ PDF مُصدَّر من برنامج يدعم النص العربي (مثل Word أو Adobe).

    const allChunks = [];
    const totalPages = pdfData.numpages || 1;

    // تقطيع النص كاملاً مع تتبع رقم الصفحة التقريبي
    // pdf-parse يدمج النص في string واحد، نقدّر الصفحات بالتقسيم
    const textPerPage = Math.ceil(extractedText.length / totalPages);

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const pageStart = pageIdx * textPerPage;
        const pageEnd = Math.min(pageStart + textPerPage, extractedText.length);
        const pageText = extractedText.slice(pageStart, pageEnd);

        if (pageText.trim().length > 20) {
            const pageChunks = splitTextIntoChunks(pageText, fileName, pageIdx + 1);
            allChunks.push(...pageChunks);
        }
    }

    if (allChunks.length === 0) {
        throw new Error('لم يتم استخراج أي محتوى نصي من الملف بعد التقطيع');
    }

    return allChunks;
}

module.exports = { extractAndSplitPDF };

