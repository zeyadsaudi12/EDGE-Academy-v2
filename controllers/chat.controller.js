const MAX_MESSAGE_LENGTH = 1200;
const MAX_HISTORY_ITEMS = 10;

function fallbackReply(message) {
    const text = message.toLowerCase();
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
    return 'أنا جاهز أساعدك في الكورسات والامتحانات وأكواد الاشتراك، أو نحكي نكتة خفيفة 😄 اكتب سؤالك بالطريقة التي تحبها.';
}

function normaliseHistory(history) {
    if (!Array.isArray(history)) return [];
    return history.slice(-MAX_HISTORY_ITEMS).flatMap(item => {
        if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') return [];
        return [{ role: item.role, content: item.content.slice(0, MAX_MESSAGE_LENGTH) }];
    });
}

exports.reply = async (req, res) => {
    const message = typeof req.body.message === 'string' ? req.body.message.trim().slice(0, MAX_MESSAGE_LENGTH) : '';
    if (!message) return res.status(400).json({ success: false, message: 'اكتب رسالة أولاً' });

    if (!process.env.OPENAI_API_KEY) {
        return res.json({ success: true, reply: fallbackReply(message), provider: 'fallback' });
    }

    const history = normaliseHistory(req.body.history);
    const conversation = [...history, { role: 'user', content: message }]
        .map(item => `${item.role === 'assistant' ? 'المساعد' : 'الطالب'}: ${item.content}`)
        .join('\n');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    try {
        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || 'gpt-5-mini',
                instructions: 'أنت مساعد EDGE Academy الودود. تحدث بالعربية المصرية السهلة وباختصار. ساعد في الدراسة وتنظيم المذاكرة واستخدام المنصة، وقل نكتة لطيفة غير جارحة عندما يطلب المستخدم ذلك. لا تدّعِ أنك نفذت عمليات داخل حساب المستخدم أو رأيت بياناته. لا تطلب كلمات مرور أو بيانات شخصية أو حساسة. عند عدم التأكد من معلومة عن المنصة، وضح ذلك واقترح التواصل مع الدعم.',
                input: conversation,
                max_output_tokens: 350,
                store: false
            })
        });
        const payload = await response.json();
        if (!response.ok || !payload.output_text) {
            console.error('OpenAI chat error:', payload?.error?.message || response.status);
            return res.json({ success: true, reply: fallbackReply(message), provider: 'fallback' });
        }
        return res.json({ success: true, reply: payload.output_text.trim(), provider: 'openai' });
    } catch (error) {
        console.error('OpenAI chat request failed:', error.name);
        return res.json({ success: true, reply: fallbackReply(message), provider: 'fallback' });
    } finally {
        clearTimeout(timeout);
    }
};
