const PlayStudy = require('../models/playStudy.model');
const Exam = require('../models/exam.model');
const Video = require('../models/video.model');
const Code = require('../models/code.model');
const User = require('../models/user.model');
const crypto = require('crypto');

// Fallback curated questions per subject
const FALLBACK_QUESTIONS = {
    'اللغة العربية': [
        { text: 'ما إعراب كلمة "العلمُ" في جملة: "العلمُ نورٌ"؟', options: ['مبتدأ مرفوع وعلامة رفعه الضمة', 'خبر مرفوع وعلامة رفعه الضمة', 'فاعل مرفوع بالضمة', 'مفعول به منصوب'], correctAnswer: '0' },
        { text: 'أي من الكلمات التالية تعتبر من الأسماء الخمسة؟', options: ['أبوك', 'أبي', 'آباء', 'أبوان'], correctAnswer: '0' },
        { text: 'الفعل "يكتبون" مرفوع وعلامة رفعه:', options: ['ثبوت النون', 'الضمة الظاهرة', 'الواو', 'الفتحة'], correctAnswer: '0' },
        { text: 'كان وأخواتها تدخل على الجملة الاسمية فـ:', options: ['ترفع المبتدأ وتنصب الخبر', 'تنصب المبتدأ وترفع الخبر', 'ترفع الاثنين', 'تنصب الاثنين'], correctAnswer: '0' },
        { text: 'الجندي يزأر في الميدان كأنه الأسد. نوع الصورة البيانية:', options: ['تشبيه تام', 'استعارة مكنية', 'استعارة تصريحية', 'مجاز مرسل'], correctAnswer: '0' }
    ],
    'اللغة الإنجليزية': [
        { text: 'Choose the correct answer: If he _____ hard, he will succeed.', options: ['studies', 'study', 'studied', 'will study'], correctAnswer: '0' },
        { text: 'I have lived in Cairo _____ 2018.', options: ['since', 'for', 'ago', 'in'], correctAnswer: '0' },
        { text: 'While I _____ dinner, the phone rang.', options: ['was having', 'had', 'have', 'am having'], correctAnswer: '0' },
        { text: 'She is _____ intelligent than her classmate.', options: ['more', 'most', 'much', 'as'], correctAnswer: '0' },
        { text: 'The synonym of the word "Essential" is:', options: ['Necessary', 'Optional', 'Minor', 'Unimportant'], correctAnswer: '0' }
    ],
    'الفيزياء': [
        { text: 'وحدة قياس شدة التيار الكهربي في النظام الدولي هي:', options: ['الأمبير (A)', 'الفولت (V)', 'الأوم (Ω)', 'الكولوم (C)'], correctAnswer: '0' },
        { text: 'قانون أوم يربط بين فرق الجهد وشدة التيار والمقاومة بالعلاقة:', options: ['V = I × R', 'V = I / R', 'I = V × R', 'R = V × I'], correctAnswer: '0' },
        { text: 'وحدة قياس كثافة الفيض المغناطيسي هي:', options: ['التسلا (Tesla)', 'الويبر (Weber)', 'الهنري', 'الفاراد'], correctAnswer: '0' },
        { text: 'قاعدة لينز تستخدم في تحديد اتجاه:', options: ['التيار المستحث', 'المجال المغناطيسي', 'حركة السلك', 'القوة الدافعة الكهربية'], correctAnswer: '0' },
        { text: 'الجهاز المستخدم لقياس فرق الجهد في الدائرة الكهربية هو:', options: ['الفولتميتر', 'الأميتر', 'الأوميتر', 'المانومتر'], correctAnswer: '0' }
    ],
    'العلوم والكيمياء': [
        { text: 'الرمز الكيميائي لعنصر الصوديوم هو:', options: ['Na', 'S', 'So', 'N'], correctAnswer: '0' },
        { text: 'الرقم الهيدروجيني (pH) للمحلول الحمضي يكون:', options: ['أقل من 7', 'أكبر من 7', 'يساوي 7', 'يساوي 14'], correctAnswer: '0' },
        { text: 'العدد الذري لعنصر الكربون يساوي:', options: ['6', '12', '8', '14'], correctAnswer: '0' },
        { text: 'الرابطة في جزيء ملح الطعام (NaCl) هي رابطة:', options: ['أيونية', 'تساهمية نقية', 'فلزية', 'هيدروجينية'], correctAnswer: '0' },
        { text: 'عملية فقدان الإلكترونات في التفاعل الكيميائي تسمى:', options: ['أكسدة', 'اختزال', 'تعادل', 'ترسيب'], correctAnswer: '0' }
    ],
    'الرياضيات': [
        { text: 'إذا كانت س + 5 = 12، فإن قيمة س تساوي:', options: ['7', '6', '17', '5'], correctAnswer: '0' },
        { text: 'مجموع قياسات زوايا المثلث الداخلة يساوي:', options: ['180°', '360°', '90°', '270°'], correctAnswer: '0' },
        { text: 'مجموعة حل المعادلة س² - 9 = 0 في ح هي:', options: ['{3, -3}', '{3}', '{-3}', '{9, -9}'], correctAnswer: '0' },
        { text: 'قيمة 2 أس 5 (2⁵) تساوي:', options: ['32', '10', '16', '64'], correctAnswer: '0' },
        { text: 'في المثلث القائم الزاوية، جيب الزاوية (جا / Sin) يساوي:', options: ['المقابل / الوتر', 'المجاور / الوتر', 'المقابل / المجاور', 'الوتر / المقابل'], correctAnswer: '0' }
    ],
    'الأحياء': [
        { text: 'ما هي عُضية الخلية المسؤولة عن إنتاج وتخزين الطاقة (ATP)؟', options: ['الميتوكوندريا', 'الريبوسومات', 'جهاز جولجي', 'النواة'], correctAnswer: '0' },
        { text: 'المسؤول عن نقل الأكسجين في دم الإنسان هو بروتين:', options: ['الهيموجلوبين', 'الأنسولين', 'الكيراتين', 'الألبومين'], correctAnswer: '0' },
        { text: 'القاعدة النيتروجينية التي توجد في RNA ولا توجد في DNA هي:', options: ['اليوراسيل (U)', 'الثايمين (T)', 'الأدينين (A)', 'الجوانين (G)'], correctAnswer: '0' },
        { text: 'عدد الكروموسومات في الخلية الجسدية للإنسان السليم هو:', options: ['46 كروموسوم', '23 كروموسوم', '44 كروموسوم', '48 كروموسوم'], correctAnswer: '0' },
        { text: 'الوحدة البنائية للبروتينات هي:', options: ['الأحماض الأمينية', 'الأحماض الدهنية', 'الجلوكوز', 'النيوكليوتيدات'], correctAnswer: '0' }
    ]
};

// Helper: get or create PlayStudy
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

// 1. Mark Video as Watched by Student (Invoked when watching video)
exports.markVideoWatched = async (req, res) => {
    try {
        const { userId, videoId } = req.body;
        if (!userId || !videoId) {
            return res.status(400).json({ success: false, message: 'بيانات غير مكتملة' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

        if (!Array.isArray(user.watchedVideos)) {
            user.watchedVideos = [];
        }

        const existing = user.watchedVideos.find(v => String(v.videoId) === String(videoId));
        if (existing) {
            existing.watchedAt = new Date();
            existing.watchCount = (existing.watchCount || 1) + 1;
        } else {
            user.watchedVideos.push({
                videoId,
                watchedAt: new Date(),
                watchCount: 1
            });
        }

        await user.save();
        res.json({ success: true, message: 'تم تسجيل مشاهدة المحاضرة بنجاح' });
    } catch (err) {
        console.error('markVideoWatched error:', err);
        res.status(500).json({ success: false, message: 'خطأ في تسجيل المشاهدة' });
    }
};

// 2. Get Profile & Watched Videos List Ready for Quiz
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user ? req.user.id || req.user._id : req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
        }

        const ps = await getOrCreatePlayStudy(userId);

        if (ps.isBanned) {
            return res.status(403).json({
                success: false,
                isBanned: true,
                message: ps.banReason || 'لقد تم حظرك بسبب الغش!'
            });
        }

        // Fetch student's watched / unlocked lectures
        const user = await User.findById(userId).lean();
        const watchedVideoIds = new Set();

        // 1. From user.watchedVideos
        if (user && Array.isArray(user.watchedVideos)) {
            user.watchedVideos.forEach(wv => {
                if (wv.videoId) watchedVideoIds.add(String(wv.videoId));
            });
        }

        // 2. From user.subscribedVideos (active lecture passes)
        if (user && Array.isArray(user.subscribedVideos)) {
            user.subscribedVideos.forEach(sv => {
                if (sv) watchedVideoIds.add(String(sv));
            });
        }

        let eligibleLectures = [];
        if (watchedVideoIds.size > 0) {
            const rawVideos = await Video.find({
                _id: { $in: Array.from(watchedVideoIds) }
            }).select('_id title imagePath teacherId playlistName grades').lean();

            eligibleLectures = rawVideos.map(v => ({
                id: v._id,
                title: v.title,
                imagePath: v.imagePath || 'imges/logo-light-mode.png',
                playlistName: v.playlistName || 'محاضرة تعليمية'
            }));
        }

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
                leaderboard: formattedLeaderboard,
                eligibleLectures // Only lectures the student actually watched!
            }
        });
    } catch (err) {
        console.error('PlayStudy getProfile error:', err);
        res.status(500).json({ success: false, message: 'حدث خطأ في تحميل بيانات اللعب والتعلم' });
    }
};

// 3. Start Quiz on a Specific Watched Lecture
exports.startQuiz = async (req, res) => {
    try {
        const userId = req.user ? req.user.id || req.user._id : req.body.userId;
        const { videoId, subject } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
        }

        const ps = await getOrCreatePlayStudy(userId);

        if (ps.isBanned) {
            return res.status(403).json({
                success: false,
                isBanned: true,
                message: ps.banReason || 'لقد تم حظرك بسبب الغش!'
            });
        }

        if (ps.dailyEnergy <= 0) {
            return res.status(400).json({
                success: false,
                message: 'نفدت محاولاتك اليومية (4/4)! ستتجدد الطاقة تلقائياً غداً ⏳'
            });
        }

        // Strict verification: Student must choose a lecture they actually watched
        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: 'يجب تحديد محاضرة قمت بمشاهدتها أولاً لبدء التحدي!'
            });
        }

        const user = await User.findById(userId).lean();
        const watchedSet = new Set();
        if (user && Array.isArray(user.watchedVideos)) {
            user.watchedVideos.forEach(wv => {
                if (wv.videoId) watchedSet.add(String(wv.videoId));
            });
        }
        if (user && Array.isArray(user.subscribedVideos)) {
            user.subscribedVideos.forEach(sv => {
                if (sv) watchedSet.add(String(sv));
            });
        }

        if (!watchedSet.has(String(videoId))) {
            return res.status(403).json({
                success: false,
                message: 'لا يمكنك خوض التحدي على محاضرة لم تشاهدها بعد على المنصة!'
            });
        }

        let selectedLecture = null;
        let pool = [];

        // Check if testing on a specific watched lecture
        if (videoId) {
            selectedLecture = await Video.findById(videoId).lean();
            if (selectedLecture) {
                // 1. Try finding questions attached to this video or exam
                if (selectedLecture.examLink || selectedLecture.requiredExamId) {
                    try {
                        const targetExamId = selectedLecture.requiredExamId || selectedLecture.examLink;
                        const exam = await Exam.findById(targetExamId).lean();
                        if (exam && Array.isArray(exam.questions)) {
                            exam.questions.forEach(q => {
                                if (q.options && q.options.length >= 2) {
                                    pool.push({
                                        text: q.text,
                                        options: q.options,
                                        correctAnswer: String(q.correctAnswer),
                                        subject: selectedLecture.title
                                    });
                                }
                            });
                        }
                    } catch (_) {}
                }
            }
        }

        // If not enough questions from specific exam, pull from relevant subject fallback
        if (pool.length < 5) {
            const subKey = subject && FALLBACK_QUESTIONS[subject] ? subject : 'اللغة العربية';
            const basePool = FALLBACK_QUESTIONS[subKey] || FALLBACK_QUESTIONS['اللغة العربية'];
            pool = pool.concat(basePool);
        }

        // Deduct 1 energy
        ps.dailyEnergy = Math.max(0, ps.dailyEnergy - 1);
        ps.totalAttempts += 1;
        await ps.save();

        pool.sort(() => 0.5 - Math.random());
        const selectedQuestions = pool.slice(0, 5);

        const clientQuestions = selectedQuestions.map((q, idx) => ({
            id: idx,
            text: q.text,
            options: q.options,
            subject: selectedLecture ? selectedLecture.title : (subject || 'عام')
        }));

        const rawAnswers = selectedQuestions.map(q => q.correctAnswer);
        const quizToken = Buffer.from(JSON.stringify({
            userId,
            answers: rawAnswers,
            lectureTitle: selectedLecture ? selectedLecture.title : (subject || 'عام'),
            timestamp: Date.now()
        })).toString('base64');

        res.json({
            success: true,
            quizToken,
            remainingEnergy: ps.dailyEnergy,
            lectureTitle: selectedLecture ? selectedLecture.title : (subject || 'عام'),
            questions: clientQuestions
        });
    } catch (err) {
        console.error('PlayStudy startQuiz error:', err);
        res.status(500).json({ success: false, message: 'حدث خطأ في بدء التحدي' });
    }
};

// 4. Submit Answers and Calculate Points
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
            subject: tokenData.lectureTitle || 'محاضرة تعليمية',
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

// 5. Redeem 200 Points for a 100 EGP Voucher / Code on Video of Choice
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

        const rawCode = 'EDGE-PLAY-' + crypto.randomBytes(3).toString('hex').toUpperCase();

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

// 4. Find Secret Robot "EDGE" Scavenger Hunt Reward (+15 Points)
exports.findEdgeRobot = async (req, res) => {
    // Deprecated: Robot EDGE is now the permanent AI Smart Assistant
    return res.json({
        success: false,
        message: 'تم إيقاف مسابقة البحث عن الروبوت، وأصبح روبوت EDGE رسمياً هو المساعد الذكي للمنصة!'
    });
};

// ══════════════════════════════════════════════════════════════════
// 5. ADMIN CONTROL PANEL ENDPOINTS (Play & Study Monitoring)
// ══════════════════════════════════════════════════════════════════

exports.adminGetAllPlayers = async (req, res) => {
    try {
        const records = await PlayStudy.find()
            .populate('userId', 'firstName lastName phone grade')
            .sort({ points: -1 })
            .lean();

        const players = records.map(r => {
            const u = r.userId;
            const fullName = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'طالب' : 'مستخدم محذوف';
            return {
                id: String(r._id),
                userId: u ? String(u._id) : null,
                name: fullName,
                phone: u && u.phone ? u.phone : '-',
                grade: u && u.grade ? u.grade : '-',
                points: Number(r.points) || 0,
                dailyEnergy: r.dailyEnergy !== undefined ? Number(r.dailyEnergy) : 4,
                totalAttempts: Number(r.totalAttempts) || 0,
                totalWins: Number(r.totalWins) || 0,
                perfectWins: Number(r.perfectWins) || 0,
                isBanned: Boolean(r.isBanned),
                banReason: r.banReason || '',
                bannedAt: r.bannedAt,
                edgeRobotFinds: r.edgeRobotFindsCount || 0,
                couponsCount: (r.redeemedCoupons || []).length
            };
        });

        res.json({ success: true, players });
    } catch (err) {
        console.error('Admin getAllPlayers error:', err);
        res.status(500).json({ success: false, message: 'تعذر جلب سجلات الطلاب', error: err.message });
    }
};

exports.adminToggleBan = async (req, res) => {
    try {
        const { recordId, isBanned, reason } = req.body;
        const record = await PlayStudy.findById(recordId);
        if (!record) {
            return res.status(404).json({ success: false, message: 'سجل الطالب غير موجود' });
        }

        record.isBanned = Boolean(isBanned);
        if (record.isBanned) {
            record.banReason = reason || 'لقد تم حظرك من نظام Play & Study بسبب انتهاك القواعد ومحاولات الغش.';
            record.bannedAt = new Date();
        } else {
            record.banReason = '';
            record.bannedAt = null;
        }

        await record.save();

        res.json({
            success: true,
            message: record.isBanned ? 'تم حظر الطالب بنجاح وإيقاف اللعبة عنده' : 'تم فك حظر الطالب بنجاح',
            isBanned: record.isBanned
        });
    } catch (err) {
        console.error('Admin toggleBan error:', err);
        res.status(500).json({ success: false, message: 'حدث خطأ في تعديل حالة الحظر' });
    }
};

exports.adminAdjustPoints = async (req, res) => {
    try {
        const { recordId, newPoints } = req.body;
        const record = await PlayStudy.findById(recordId);
        if (!record) {
            return res.status(404).json({ success: false, message: 'سجل الطالب غير موجود' });
        }

        if (newPoints !== undefined && newPoints !== null) {
            record.points = Math.max(0, Number(newPoints));
        }

        await record.save();

        res.json({
            success: true,
            message: 'تم تحديث رصيد النقاط بنجاح',
            currentPoints: record.points
        });
    } catch (err) {
        console.error('Admin adjustPoints error:', err);
        res.status(500).json({ success: false, message: 'حدث خطأ في تعديل النقاط' });
    }
};

exports.adminResetEnergy = async (req, res) => {
    try {
        const { recordId } = req.body;
        const record = await PlayStudy.findById(recordId);
        if (!record) {
            return res.status(404).json({ success: false, message: 'سجل الطالب غير موجود' });
        }

        record.dailyEnergy = 4;
        record.lastEnergyReset = new Date();
        await record.save();

        res.json({
            success: true,
            message: 'تمت استعادة محاولات الطاقة (4/4) بنجاح',
            dailyEnergy: record.dailyEnergy
        });
    } catch (err) {
        console.error('Admin resetEnergy error:', err);
        res.status(500).json({ success: false, message: 'حدث خطأ في إعادة شحن الطاقة' });
    }
};
