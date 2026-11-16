/**
 * services/rag.service.js
 * قلب نظام RAG: يجيب على أسئلة المستخدمين من خلال البحث في ChromaDB واستدعاء GPT
 */

const { searchDocuments } = require('./vector.service');
const { SYSTEM_PROMPT, USER_PROMPT } = require('../prompts/system.prompt');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// حد الـ distance في ChromaDB (أقل = أقرب، أعلى = أبعد)
// نرفض أي نتيجة distance أعلى من هذا الحد (يعني مفيش ارتباط كافي)
const SIMILARITY_THRESHOLD = 0.75;

// رسالة الرد عند عدم وجود معلومات
const NOT_FOUND_MSG = 'عذراً، هذه المعلومة غير متوفرة في الملفات المتاحة حالياً على EDGE Academy.';

// حد أقصى لعدد الرسائل السابقة المُرسلة مع الـ prompt
const MAX_HISTORY = 5;

/**
 * بناء نص الـ context من نتائج البحث
 * @param {Array} results - نتائج ChromaDB
 * @returns {string}
 */
function buildContext(results) {
    return results
        .map((r, idx) => {
            const src = r.metadata?.fileName || 'ملف غير معروف';
            const page = r.metadata?.page || '؟';
            return `[${idx + 1}] (المصدر: ${src} - صفحة ${page})\n${r.pageContent}`;
        })
        .join('\n\n---\n\n');
}

/**
 * استخراج المصادر من نتائج البحث
 * @param {Array} results - نتائج ChromaDB
 * @returns {Array<{file: string, page: number}>}
 */
function extractSources(results) {
    const seen = new Set();
    return results
        .map(r => ({
            file: r.metadata?.fileName || 'ملف غير معروف',
            page: r.metadata?.page || 1
        }))
        .filter(s => {
            const key = `${s.file}::${s.page}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

/**
 * استدعاء Google Gemini (مجاني)
 * يجرب النماذج المتاحة بالترتيب مع معالجة ذكية للضغط والـ fallback
 */
async function callGemini(systemPrompt, userPrompt, history = []) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY غير موجود في متغيرات البيئة');

    const genAI = new GoogleGenerativeAI(apiKey);
    // نضع النماذج الخفيفة والسريعة المتاحة في البداية لتفادي الـ Quota Limits
    // النماذج المجانية المتاحة بالترتيب (الأسرع أولاً)
    const candidateModels = [
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
        'gemini-flash-latest'
    ];

    // تنظيف وترتيب السجل ليتوافق بدقة مع متطلبات Google Gemini:
    // 1. يجب أن يبدأ بـ 'user'
    // 2. يجب أن تتناوب الأدوار (user ثم model)
    const chatHistory = [];
    let expectedRole = 'user';
    const recent = (history || []).slice(-MAX_HISTORY);
    for (const h of recent) {
        const role = h.role === 'assistant' ? 'model' : 'user';
        if (role === expectedRole && h.content && typeof h.content === 'string') {
            chatHistory.push({
                role: role,
                parts: [{ text: h.content.trim() }]
            });
            expectedRole = expectedRole === 'user' ? 'model' : 'user';
        }
    }
    // يجب أن ينتهي بـ model لأن الرسالة الحالية للمستخدم سترسل تالياً
    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
        chatHistory.pop();
    }

    let lastError = null;
    for (const modelName of candidateModels) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemPrompt,
                generationConfig: {
                    temperature: 0,
                    topP: 0.1,
                    maxOutputTokens: 600,
                    candidateCount: 1
                }
            });

            const chat = model.startChat({ history: chatHistory });
            const result = await chat.sendMessage(userPrompt);
            const text = result.response.text()?.trim();
            if (text) return text;
        } catch (err) {
            lastError = err;
            console.warn(`[RAG] فشل النموذج ${modelName}:`, err.message);
        }
    }

    throw lastError || new Error('فشلت جميع نماذج Gemini المتاحة');
}

/**
 * الدالة الرئيسية للإجابة على سؤال المستخدم
 * @param {string} question - سؤال المستخدم
 * @param {Array} sessionHistory - سجل المحادثة (اختياري)
 * @returns {Promise<{answer: string, sources: Array<{file: string, page: number}>}>}
 */
async function answerQuestion(question, sessionHistory = []) {
    if (!question || !question.trim()) {
        return { answer: 'الرجاء كتابة سؤالك.', sources: [] };
    }

    // --- الخطوة 1: بحث دلالي في ChromaDB ---
    let searchResults;
    try {
        searchResults = await searchDocuments(question, 4);
    } catch (err) {
        console.error('[RAG] خطأ في البحث:', err.message);
        // لو ChromaDB مش شغال، نرد برسالة واضحة بدون استدعاء LLM
        return {
            answer: 'عذراً، خدمة البحث في الملفات غير متاحة مؤقتاً. الرجاء المحاولة لاحقاً.',
            sources: []
        };
    }

    // --- الخطوة 2: فلترة النتائج بناءً على حد الـ distance ---
    const relevantResults = searchResults.filter(r => r.distance <= SIMILARITY_THRESHOLD);

    // لو مفيش نتائج قريبة كفاية → رد فوري بدون استدعاء LLM (توفير في التكلفة)
    if (relevantResults.length === 0) {
        return { answer: NOT_FOUND_MSG, sources: [] };
    }

    // --- الخطوة 3: بناء الـ context والـ prompt ---
    const context = buildContext(relevantResults);
    const userPrompt = USER_PROMPT
        .replace('{context}', context)
        .replace('{question}', question.trim());

    // --- الخطوة 4: استدعاء Gemini (مجاني) ---
    let answer;
    try {
        answer = await callGemini(SYSTEM_PROMPT, userPrompt, sessionHistory);
    } catch (err) {
        console.error('[RAG] خطأ في استدعاء Gemini:', err.message);
        return {
            answer: 'عذراً، حدث خطأ في معالجة سؤالك. الرجاء المحاولة مرة أخرى.',
            sources: []
        };
    }

    // --- الخطوة 5: استخراج المصادر وإرجاع النتيجة ---
    const sources = extractSources(relevantResults);
    return { answer, sources };
}

module.exports = { answerQuestion };

