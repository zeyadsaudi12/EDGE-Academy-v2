const PlayStudy = require('../models/playStudy.model');
const Exam = require('../models/exam.model');
const Video = require('../models/video.model');
const Code = require('../models/code.model');
const User = require('../models/user.model');
const crypto = require('crypto');

// Default built-in questions pool per subject and grade when custom exams don't have enough questions
const DEFAULT_QUESTIONS = [
    {
        subject: 'اللغة العربية',
        grade: 'all',
        text: 'ما إعراب كلمة "العلمُ" في جملة: "العلمُ نورٌ"؟',
        options: ['مبتدأ مرفوع وعلامة رفعه الضمة', 'خبر مرفوع وعلامة رفعه الضمة', 'فاعل مرفوع بالضمة', 'مفعول به منصوب'],
        correctAnswer: '0'
    },
    {
        subject: 'اللغة العربية',
        grade: 'all',
        text: 'أي من الكلمات التالية تعتبر من الأسماء الخمسة؟',
        options: ['أبوك', 'أبي', 'آباء', 'أبوان'],
        correctAnswer: '0'
    },
    {
        subject: 'اللغة الإنجليزية',
        grade: 'all',
        text: 'Choose the correct form: If he _____ hard, he will succeed.',
        options: ['studies', 'study', 'studied', 'will study'],
        correctAnswer: '0'
    },
    {
        subject: 'اللغة الإنجليزية',
        grade: 'all',
        text: 'The synonym of the word "Essential" is:',
        options: ['Necessary', 'Optional', 'Minor', 'Unimportant'],
        correctAnswer: '0'
    },
    {
        subject: 'الرياضيات',
        grade: 'all',
        text: 'إذا كانت س + 5 = 12، فإن قيمة س تساوي:',
        options: ['7', '6', '17', '5'],
        correctAnswer: '0'
    },
    {
        subject: 'الرياضيات',
        grade: 'all',
        text: 'مجموع قياسات زوايا المثلث الداخلة يساوي:',
        options: ['180°', '360°', '90°', '270°'],
        correctAnswer: '0'
    },
    {
        subject: 'العلوم والكيمياء',
        grade: 'all',
        text: 'الرمز الكيميائي لعنصر الصوديوم هو:',
        options: ['Na', 'S', 'So', 'N'],
        correctAnswer: '0'
    },
    {
        subject: 'الفيزياء',
        grade: 'all',
        text: 'وحدة قياس القوة في النظام الدولي للوحدات (SI) هي:',
        options: ['النيوتن (N)', 'الجول (J)', 'الواط (W)', 'الباسكال (Pa)'],
        correctAnswer: '0'
    },
    {
        subject: 'الأحياء',
        grade: 'all',
        text: 'ما هي عُضية الخلية المسؤولة عن إنتاج الطاقة (ATP)؟',
        options: ['الميتوكوندريا', 'الريبوسومات', 'جهاز جولجي', 'النواة'],
        correctAnswer: '0'
    },
    {
        subject: 'الدراسات والتاريخ',
        grade: 'all',
        text: 'مؤسس الدولة الأيوبية في مصر هو:',
        options: ['صلاح الدين الأيوبي', 'قطز', 'الظاهر بيبرس', 'المعز لدين الله'],
        correctAnswer: '0'
    }
];

// Helper to get or create student's PlayStudy record
async function getOrCreatePlayStudy(userId) {
    let ps = await PlayStudy.findOne({ userId });
    if (!ps) {
        ps = new PlayStudy({
            userId,
            points: 0,
            dailyEnergy: 4,
            lastEnergyReset: new Date()
        });
        await ps.save();
    } else {
        ps.checkDailyEnergy();
        await ps.save();
    }
    return ps;
}

// 1. Get Play & Study Profile & Stats
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user ? req.user.id || req.user._id : req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
        }

        const ps = await getOrCreatePlayStudy(userId);

        // Fetch top 10 leaderboard
        const leaderboard = await PlayStudy.find()
            .sort({ points: -1 })
            .limit(10)
            .populate('userId', 'firstName lastName grade');

        const formattedLeaderboard = leaderboard.map((item, idx) => ({
            rank: idx + 1,
            name: item.userId ? `${item.userId.firstName} ${item.userId.lastName}` : 'طالب متفوق',
            grade: item.userId ? item.userId.grade : '-',
            points: item.points
        }));

        res.json({
            success: true,
            data: {
                points: ps.points,
                dailyEnergy: ps.dailyEnergy,
                totalAttempts: ps.totalAttempts,
                totalWins: ps.totalWins,
                perfectWins: ps.perfectWins,
                redeemedCoupons: ps.redeemedCoupons,
                history: ps.history.slice(-10).reverse(),
                leaderboard: formattedLeaderboard
            }
        });
    } catch (err) {
        console.error('PlayStudy getProfile error:', err);
        res.status(500).json({ success: false, message: 'حدث خطأ في تحميل بيانات اللعب والتعلم' });
    }
};

// 2. Start a New Challenge / Quiz Session (Consumes 1 Energy)
exports.startQuiz = async (req, res) => {
    try {
        const userId = req.user ? req.user.id || req.user._id : req.body.userId;
        const { subject } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
        }

        const ps = await getOrCreatePlayStudy(userId);

        if (ps.dailyEnergy <= 0) {
            return res.status(400).json({
                success: false,
                message: 'نفدت محاولاتك اليومية (4/4)! ستتجدد الطاقة تلقائياً غداً ⏳'
            });
        }

        // Deduct 1 energy
        ps.dailyEnergy = Math.max(0, ps.dailyEnergy - 1);
        ps.totalAttempts += 1;
        await ps.save();

        // Collect 5 random questions
        let selectedQuestions = [];
        
        // Try fetching questions from real exams if any
        try {
            const query = { isActive: true, 'questions.0': { $exists: true } };
            if (subject && subject !== 'الكل' && subject !== 'all') {
                query.subject = new RegExp(subject, 'i');
            }
            const exams = await Exam.find(query).limit(5);
            let pool = [];
            exams.forEach(e => {
                if (Array.isArray(e.questions)) {
                    e.questions.forEach(q => {
                        if (q.options && q.options.length >= 2 && q.correctAnswer !== undefined) {
                            pool.push({
                                text: q.text,
                                options: q.options,
                                correctAnswer: String(q.correctAnswer),
                                subject: e.subject || 'عام'
                            });
                        }
                    });
                }
            });

            if (pool.length >= 5) {
                pool.sort(() => 0.5 - Math.random());
                selectedQuestions = pool.slice(0, 5);
            }
        } catch (_) {}

        // Fallback to built-in curated questions if pool < 5
        if (selectedQuestions.length < 5) {
            let defPool = [...DEFAULT_QUESTIONS];
            if (subject && subject !== 'الكل' && subject !== 'all') {
                const subFiltered = defPool.filter(q => q.subject.includes(subject));
                if (subFiltered.length >= 3) defPool = subFiltered;
            }
            defPool.sort(() => 0.5 - Math.random());
            selectedQuestions = selectedQuestions.concat(defPool.slice(0, 5 - selectedQuestions.length));
        }

        // Strip correctAnswer from questions sent to client to prevent inspect cheating
        // Store the correct answers encrypted or encoded in a quiz token
        const clientQuestions = selectedQuestions.map((q, idx) => ({
            id: idx,
            text: q.text,
            options: q.options,
            subject: q.subject
        }));

        const rawAnswers = selectedQuestions.map(q => q.correctAnswer);
        const quizToken = Buffer.from(JSON.stringify({
            userId,
            answers: rawAnswers,
            subject: subject || 'عام',
            timestamp: Date.now()
        })).toString('base64');

        res.json({
            success: true,
            quizToken,
            remainingEnergy: ps.dailyEnergy,
            questions: clientQuestions
        });
    } catch (err) {
        console.error('PlayStudy startQuiz error:', err);
        res.status(500).json({ success: false, message: 'حدث خطأ في بدء التحدي' });
    }
};

// 3. Submit Answers and Calculate Points
exports.submitQuiz = async (req, res) => {
    try {
        const userId = req.user ? req.user.id || req.user._id : req.body.userId;
        const { quizToken, userAnswers } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
        }
        if (!quizToken || !Array.isArray(userAnswers)) {
            return res.status(400).json({ success: false, message: 'بيانات التحدي غير مكتملة' });
        }

        let tokenData;
        try {
            tokenData = JSON.parse(Buffer.from(quizToken, 'base64').toString('utf8'));
        } catch (_) {
            return res.status(400).json({ success: false, message: 'رمز التحدي غير صالح' });
        }

        if (String(tokenData.userId) !== String(userId)) {
            return res.status(403).json({ success: false, message: 'رمز التحدي غير مطابق للمستخدم' });
        }

        const correctAnswers = tokenData.answers || [];
        const totalCount = correctAnswers.length || 5;
        let score = 0;

        correctAnswers.forEach((ans, idx) => {
            const userAns = String(userAnswers[idx] ?? '').trim();
            if (userAns !== '' && (userAns === String(ans).trim())) {
                score++;
            }
        });

        const percentage = Math.round((score / totalCount) * 100);
        let pointsEarned = 0;

        // Rules established:
        // 100% -> 10 points
        // 70% to 99% -> 5 points
        // < 70% -> 0 points
        if (percentage === 100) {
            pointsEarned = 10;
        } else if (percentage >= 70) {
            pointsEarned = 5;
        }

        const ps = await getOrCreatePlayStudy(userId);
        ps.points += pointsEarned;
        if (percentage >= 70) ps.totalWins += 1;
        if (percentage === 100) ps.perfectWins += 1;

        ps.history.push({
            subject: tokenData.subject || 'عام',
            score,
            percentage,
            pointsEarned,
            date: new Date()
        });

        await ps.save();

        res.json({
            success: true,
            score,
            totalCount,
            percentage,
            pointsEarned,
            totalPoints: ps.points,
            dailyEnergy: ps.dailyEnergy,
            correctAnswers
        });
    } catch (err) {
        console.error('PlayStudy submitQuiz error:', err);
        res.status(500).json({ success: false, message: 'حدث خطأ في احتساب نتيجة التحدي' });
    }
};

// 4. Redeem 200 Points for a 100 EGP Voucher / Code on Video of Choice
exports.redeemPoints = async (req, res) => {
    try {
        const userId = req.user ? req.user.id || req.user._id : req.body.userId;
        const { videoId } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
        }

        const ps = await getOrCreatePlayStudy(userId);

        if (ps.points < 200) {
            return res.status(400).json({
                success: false,
                message: `رصيد نقاطك (${ps.points}) غير كافٍ. تحتاج إلى 200 نقطة لاستبدالها بكوبون 100 جنيه.`
            });
        }

        let targetVideo = null;
        if (videoId) {
            targetVideo = await Video.findById(videoId);
        }

        // Deduct 200 points
        ps.points -= 200;

        // Generate unique discount code
        const rawCode = 'EDGE-PLAY-' + crypto.randomBytes(3).toString('hex').toUpperCase();

        // Create the Code document in DB so student can activate it via standard code recharge
        if (targetVideo) {
            try {
                await Code.create({
                    code: rawCode,
                    videoId: targetVideo._id,
                    videoTitle: targetVideo.title,
                    value: 100,
                    used: false
                });
            } catch (_) {}
        }

        const couponRecord = {
            code: rawCode,
            value: 100,
            used: false,
            videoId: targetVideo ? targetVideo._id : null,
            videoTitle: targetVideo ? targetVideo.title : 'كود خصم 100 جنيه للمنصة',
            createdAt: new Date()
        };

        ps.redeemedCoupons.push(couponRecord);
        await ps.save();

        res.json({
            success: true,
            message: '🎉 تهانينا! تم استبدال 200 نقطة بكود خصم بقيمة 100 جنيه بنجاح!',
            code: rawCode,
            value: 100,
            remainingPoints: ps.points,
            videoTitle: couponRecord.videoTitle
        });
    } catch (err) {
        console.error('PlayStudy redeem error:', err);
        res.status(500).json({ success: false, message: 'حدث خطأ في عملية استبدال النقاط' });
    }
};
