/**
 * controllers/chat.controller.js
 * الـ Chat Controller المُحدَّث — يعتمد على نظام RAG (PDF-based) أساساً
 * مع fallback على المنطق القديم (كتالوج المنصة) لو ChromaDB مش متاح
 */

const MAX_MESSAGE_LENGTH = 1200;
const MAX_HISTORY_ITEMS = 5; // آخر 5 رسائل فقط تُرسل في الجلسة
const MAX_CATALOGUE_ITEMS = 30;

const Course = require('../models/course.model');
const Video = require('../models/video.model');
const { answerQuestion } = require('../services/rag.service');

// ─── Session Store: تخزين آخر 5 رسائل لكل sessionId في الذاكرة ──────────────
// (بسيط وكافي — يُفضَّل Redis في الإنتاج)
const sessionStore = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 دقيقة

function getSessionHistory(sessionId) {
    if (!sessionId) return [];
    const entry = sessionStore.get(sessionId);
    if (!entry) return [];
    // حذف الجلسة لو انتهت مدتها
    if (Date.now() - entry.updatedAt > SESSION_TTL_MS) {
        sessionStore.delete(sessionId);
        return [];
    }
    return entry.history;
}

function saveSessionHistory(sessionId, history) {
    if (!sessionId) return;
    sessionStore.set(sessionId, {
        history: history.slice(-MAX_HISTORY_ITEMS),
        updatedAt: Date.now()
    });
}

// ─── Fallback: ردود جاهزة عندما لا يكون ChromaDB متاحاً ────────────────────
function isPrivileged(user) {
    return ['admin', 'teacher', 'assistant'].includes(user?.role);
}

function readablePrice(value) {
    const price = Number(value);
    return Number.isFinite(price) && price > 0 ? `${price} جنيه` : 'مجاني';
}

function courseMatchesStudent(course, user) {
    return isPrivileged(user)
        || !Array.isArray(course.grades)
        || course.grades.length === 0
        || course.grades.includes(user?.grade);
}

function compactText(value, limit = 220) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

async function buildPlatformContext(user) {
    const includeHidden = user?.role === 'admin';
    const courseFilter = includeHidden ? {} : { hidden: { $ne: true } };
    const videoFilter = includeHidden ? {} : { hidden: { $ne: true } };

    try {
        const [allCourses, allVideos] = await Promise.all([
            Course.find(courseFilter)
                .select('title description price grades hidden')
                .sort({ createdAt: -1 })
                .limit(MAX_CATALOGUE_ITEMS)
                .lean(),
            Video.find(videoFilter)
                .select('title price grades courseId playlistName startDate endDate closed releaseAfterDays hidden')
                .sort({ createdAt: -1 })
                .limit(MAX_CATALOGUE_ITEMS * 2)
                .lean()
        ]);

        const visibleCourses = allCourses.filter(course => courseMatchesStudent(course, user));
        const visibleCourseIds = new Set(visibleCourses.map(course => String(course._id)));
        const visibleVideos = allVideos.filter(video =>
            courseMatchesStudent(video, user)
            && (!video.courseId || visibleCourseIds.has(String(video.courseId)))
        );
        const subscriptionIds = new Set((user?.subscribedCourses || []).map(item => String(item.courseId)));
        const directVideoIds = new Set((user?.subscribedVideos || []).map(String));
        const courseSummaries = visibleCourses.map(course => {
            const lessonCount = visibleVideos.filter(video => String(video.courseId) === String(course._id)).length;
            const status = subscriptionIds.has(String(course._id)) ? 'مشترك به بالفعل' : 'غير مشترك به';
            return `- ${compactText(course.title, 90)} | السعر: ${readablePrice(course.price)} | الصفوف: ${(course.grades || []).join('، ') || 'كل الصفوف'} | عدد المحاضرات الظاهر: ${lessonCount} | الحالة: ${status}${course.description ? ` | التفاصيل: ${compactText(course.description)}` : ''}`;
        });
        const standaloneVideos = visibleVideos
            .filter(video => !video.courseId)
            .slice(0, MAX_CATALOGUE_ITEMS)
            .map(video => `- ${compactText(video.title, 90)} | السعر: ${readablePrice(video.price)} | الصفوف: ${(video.grades || []).join('، ') || 'كل الصفوف'}${video.startDate ? ` | يبدأ: ${video.startDate}` : ''}${video.endDate ? ` | ينتهي: ${video.endDate}` : ''}${video.closed ? ' | مغلق حاليًا' : ''}${directVideoIds.has(String(video._id)) ? ' | مشترك به بالفعل' : ''}`);

        const identity = user
            ? `المستخدم الحالي: ${[user.firstName, user.secondName, user.thirdName, user.lastName].filter(Boolean).join(' ')}. الدور: ${user.role}. الصف: ${user.grade || 'غير محدد'}.`
            : 'المستخدم الحالي زائر غير مسجل؛ لا تدّعِ معرفة صفه أو اشتراكاته.';
        return [
            identity,
            `الكتالوج المتاح في هذه اللحظة: ${visibleCourses.length} كورس و${visibleVideos.length} محاضرة ظاهرة ضمن نتائج السياق.`,
            'الكورسات:',
            courseSummaries.join('\n') || '- لا توجد كورسات ظاهرة حاليًا.',
            'محاضرات مستقلة:',
            standaloneVideos.join('\n') || '- لا توجد محاضرات مستقلة ظاهرة حاليًا.'
        ].join('\n');
    } catch (error) {
        console.error('Chat platform context unavailable:', error.name);
        return user
            ? `المستخدم الحالي مسجل بدور ${user.role} وصف ${user.grade || 'غير محدد'}. بيانات الكتالوج غير متاحة مؤقتًا.`
            : 'بيانات الكتالوج غير متاحة مؤقتًا.';
    }
}

function fallbackReply(message, platformContext = '') {
    const text = message.toLowerCase().trim();
    if (/(ازيك|عامل ايه|شخبارك|أهلاً|اهلا|مرحبا|سلام عليكم|السلام عليكم|صباح الخير|مساء الخير|هلا)/.test(text)) {
        return 'أهلاً بك يا بطل! 👋 أنا روبوت EDGE، مساعدك الذكي في منصة EDGE Academy. أنا هنا لمساعدتك في أي سؤال عن الكورسات، المحاضرات، الامتحانات، وشحن الأكواد.. اسألني أي وقت!';
    }
    if (/(شكرا|شكراً|تسلم|الله يخليك|تمام)/.test(text)) {
        return 'العفو، أنا في خدمتك دايماً وبتمنى لك أعلى درجات التفوق! 🚀✨ لو احتجت أي مساعدة تانية ناديني.';
    }
    if (/(مين انت|اسمك ايه|انت مين|عرفني بيك)/.test(text)) {
        return 'أنا روبوت EDGE، المساعد الذكي الرسمي لمنصة EDGE Academy التعليمية! 🤖✨ تم برمجتي لمساعدتك في الوصول لدروسك، حل مشاكلك، وإرشادك لكل ما تحتاجه في المنصة.';
    }
    if (/(نكت|نكتة|اضحك|ضحكني)/.test(text)) {
        const jokes = [
            'مرة طالب قال للمدرس: ينفع أتعلم من غير ما أذاكر؟ قاله: ينفع، بس النتيجة مش هتتعلم معاك 😄',
            'ليه الكتاب زعلان؟ عشان كل يوم بيتفتح في الامتحان ويتقفل بسرعة 😂',
            'طالب سأل: الامتحان سهل؟ المدرس قال: سهل جدًا… بس الإجابات محتاجة شوية مذاكرة 😅'
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
    }
    if (/(كود|شحن|تفعيل)/.test(text)) return 'لتفعيل كود محاضرة، افتح المحاضرة من الكورسات ثم أدخل كود الشحن في المكان المخصص. تأكد أن الكود يخص نفس المحاضرة.';
    if (/(امتحان|اختبار|درجات)/.test(text)) return 'هتلاقي الامتحانات من قسم «الامتحانات». اختَر الامتحان المناسب لصفك، وجهّز اتصال إنترنت ثابت قبل البدء.';
    if (/(فيديو|محاضرة|مش شغال|لا تعمل)/.test(text)) return 'جرّب تحديث الصفحة، وتأكد أنك مشترك في المحاضرة وأن اتصال الإنترنت ثابت. لو استمرت المشكلة، أرسل للدعم اسم المحاضرة وصورة للخطأ.';
    if (/(كورس|كورسات|مادة|متاح|سعر|بكام)/.test(text)) {
        const courseLines = platformContext.split('\n').filter(line => line.startsWith('- ')).slice(0, 4);
        return courseLines.length
            ? `هذه بعض المحتويات الظاهرة لك الآن:\n${courseLines.join('\n')}\n\nاسألني باسم الكورس لو حابب تفاصيل أدق.`
            : 'لا أستطيع الوصول للكتالوج الآن. جرّب فتح صفحة الكورسات أو أعد المحاولة بعد قليل.';
    }
    return 'أنا جاهز أساعدك في الكورسات والامتحانات وأكواد الاشتراك، أو نحكي نكتة خفيفة 😄 اكتب سؤالك بالطريقة التي تحبها.';
}

function normaliseHistory(history) {
    if (!Array.isArray(history)) return [];
    return history.slice(-MAX_HISTORY_ITEMS).flatMap(item => {
        if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') return [];
        return [{ role: item.role, content: item.content.slice(0, MAX_MESSAGE_LENGTH) }];
    });
}

// ─── Handler الرئيسي ─────────────────────────────────────────────────────────

/**
 * POST /api/chat
 * يستقبل { message, sessionId, history } ويرد من نظام RAG أو fallback
 */
exports.reply = async (req, res) => {
    const message = typeof req.body.message === 'string'
        ? req.body.message.trim().slice(0, MAX_MESSAGE_LENGTH)
        : '';

    if (!message) {
        return res.status(400).json({ success: false, message: 'اكتب رسالة أولاً' });
    }

    // استخدام sessionId لتتبع المحادثة (اختياري)
    const sessionId = typeof req.body.sessionId === 'string'
        ? req.body.sessionId.trim().slice(0, 64)
        : null;

    // استرجاع سجل المحادثة: من الـ session store أو من req.body.history
    const incomingHistory = normaliseHistory(req.body.history);
    const storedHistory = getSessionHistory(sessionId);
    const sessionHistory = storedHistory.length > 0 ? storedHistory : incomingHistory;

    const timestamp = new Date().toISOString();

    // ─── المسار الأساسي: RAG من ملفات PDF ───────────────────────────────────
    if (process.env.GEMINI_API_KEY) {
        try {
            const { answer, sources } = await answerQuestion(message, sessionHistory);

            // لو الـ RAG جاوب (سواء وجد معلومة أو قال غير متوفرة)، نرجع إجابته مباشرة دون الرجوع للردود الافتراضية
            if (answer) {
                const updatedHistory = [
                    ...sessionHistory,
                    { role: 'user', content: message },
                    { role: 'assistant', content: answer }
                ];
                saveSessionHistory(sessionId, updatedHistory);

                return res.json({
                    success: true,
                    reply: answer,
                    sources: sources || [],
                    timestamp,
                    provider: 'rag'
                });
            }
        } catch (ragErr) {
            console.error('[Chat] RAG error:', ragErr.message);
        }
    }

    // ─── Fallback: كتالوج المنصة أو ردود جاهزة ──────────────────────────────
    const platformContext = await Promise.race([
        buildPlatformContext(req.user),
        new Promise(resolve => setTimeout(() => resolve(''), 2000))
    ]).catch(() => '');

    const fallback = fallbackReply(message, platformContext);

    // تحديث سجل الجلسة أيضاً في الـ fallback
    const updatedHistory = [
        ...sessionHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: fallback }
    ];
    saveSessionHistory(sessionId, updatedHistory);

    return res.json({
        success: true,
        reply: fallback,
        sources: [],
        timestamp,
        provider: 'fallback'
    });
};
