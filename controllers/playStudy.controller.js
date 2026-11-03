const PlayStudy = require('../models/playStudy.model');
const Exam = require('../models/exam.model');
const Video = require('../models/video.model');
const Code = require('../models/code.model');
const User = require('../models/user.model');
const crypto = require('crypto');

// Rich curriculum questions organized strictly by Subject and Unit/Topic
const CURRICULUM_QUESTIONS = {
    'اللغة العربية': {
        'النحو والقواعد': [
            { text: 'ما إعراب كلمة "العلمُ" في جملة: "العلمُ نورٌ"؟', options: ['مبتدأ مرفوع وعلامة رفعه الضمة', 'خبر مرفوع وعلامة رفعه الضمة', 'فاعل مرفوع بالضمة', 'مفعول به منصوب'], correctAnswer: '0' },
            { text: 'أي من الكلمات التالية تعتبر من الأسماء الخمسة؟', options: ['أبوك', 'أبي', 'آباء', 'أبوان'], correctAnswer: '0' },
            { text: 'الفعل "يكتبون" مرفوع وعلامة رفعه:', options: ['ثبوت النون', 'الضمة الظاهرة', 'الواو', 'الفتحة'], correctAnswer: '0' },
            { text: 'نوع "لا" في جملة "لا تؤجل عمل اليوم إلى الغد":', options: ['ناهية جازمة', 'نافية مهملة', 'عاطفة', 'نافية للجنس'], correctAnswer: '0' },
            { text: 'كان وأخواتها تدخل على الجملة الاسمية فـ:', options: ['ترفع المبتدأ وتنصب الخبر', 'تنصب المبتدأ وترفع الخبر', 'ترفع الاثنين', 'تنصب الاثنين'], correctAnswer: '0' }
        ],
        'البلاغة والأدب': [
            { text: 'الجندي يزأر في الميدان كأنه الأسد. نوع الصورة البيانية:', options: ['تشبيه تام', 'استعارة مكنية', 'استعارة تصريحية', 'مجاز مرسل'], correctAnswer: '0' },
            { text: 'الطباق والمقابلة يعتبران من المحسنات:', options: ['المعنوية', 'اللفظية', 'الصوتية', 'العروضية'], correctAnswer: '0' },
            { text: 'اتفاق نهايات الفواصل في النثر يسمى:', options: ['سجع', 'جناس', 'حسن تقسيم', 'تصريع'], correctAnswer: '0' },
            { text: 'التصريع يأتي دائماً في:', options: ['البيت الأول من القصيدة', 'البيت الأخير', 'وسط القصيدة', 'النثر فقط'], correctAnswer: '0' },
            { text: 'سر جمال التشبيه حين يشبه المعنوي بالمادي هو:', options: ['التجسيم', 'التشخيص', 'التوضيح', 'الإيجاز'], correctAnswer: '0' }
        ],
        'القراءة والنصوص': [
            { text: 'مرادف كلمة "الريادة" في السياق الأدبي:', options: ['السبق والتقدم', 'الهدوء والسكينة', 'التردد', 'الخوف'], correctAnswer: '0' },
            { text: 'مضاد كلمة "الإيثار":', options: ['الأثرة والأنانية', 'التضحية', 'الكرم', 'الجود'], correctAnswer: '0' },
            { text: 'الفكرة العامة للنص الأدبي تدور حول:', options: ['الهدف والمضمون الرئيسي للكاتب', 'إعراب الكلمات', 'أوزان الأبيات', 'تاريخ الشاعر'], correctAnswer: '0' },
            { text: 'جمع كلمة "حياة":', options: ['حَيَوَات', 'حيات', 'أحياء', 'حيوة'], correctAnswer: '0' },
            { text: 'مفرد كلمة "مكارم":', options: ['مَكْرُمة', 'كريم', 'كرامة', 'مكرم'], correctAnswer: '0' }
        ]
    },
    'اللغة الإنجليزية': {
        'Grammar & Tenses': [
            { text: 'Choose the correct answer: If he _____ hard, he will succeed.', options: ['studies', 'study', 'studied', 'will study'], correctAnswer: '0' },
            { text: 'I have lived in Cairo _____ 2018.', options: ['since', 'for', 'ago', 'in'], correctAnswer: '0' },
            { text: 'While I _____ dinner, the phone rang.', options: ['was having', 'had', 'have', 'am having'], correctAnswer: '0' },
            { text: 'She is _____ intelligent than her classmate.', options: ['more', 'most', 'much', 'as'], correctAnswer: '0' },
            { text: 'By the time my father arrived, we _____ our homework.', options: ['had finished', 'have finished', 'finish', 'are finishing'], correctAnswer: '0' }
        ],
        'Vocabulary & Idioms': [
            { text: 'The synonym of the word "Essential" is:', options: ['Necessary', 'Optional', 'Minor', 'Unimportant'], correctAnswer: '0' },
            { text: 'The antonym of the word "Artificial" is:', options: ['Natural', 'Fake', 'Made', 'Plastic'], correctAnswer: '0' },
            { text: 'A person who writes code for software is a:', options: ['Programmer', 'Author', 'Journalist', 'Dentist'], correctAnswer: '0' },
            { text: 'To "give up" means to:', options: ['Quit / Stop trying', 'Continue', 'Start', 'Win'], correctAnswer: '0' },
            { text: 'Solar panels generate energy from the:', options: ['Sun', 'Wind', 'Water', 'Coal'], correctAnswer: '0' }
        ]
    },
    'الفيزياء': {
        'التيار والدوائر الكهربية': [
            { text: 'وحدة قياس شدة التيار الكهربي في النظام الدولي هي:', options: ['الأمبير (A)', 'الفولت (V)', 'الأوم (Ω)', 'الكولوم (C)'], correctAnswer: '0' },
            { text: 'قانون أوم يربط بين فرق الجهد وشدة التيار والمقاومة بالعلاقة:', options: ['V = I × R', 'V = I / R', 'I = V × R', 'R = V × I'], correctAnswer: '0' },
            { text: 'عند توصيل عدة مقاومات متساوية على التوالي فإن المقاومة المكافئة:', options: ['تزداد وتكون أكبر من أي مقاومة', 'تقل وتكون أصغر من أي مقاومة', 'تظل ثابتة', 'تساوي صفراً'], correctAnswer: '0' },
            { text: 'الجهاز المستخدم لقياس فرق الجهد في الدائرة الكهربية هو:', options: ['الفولتميتر', 'الأميتر', 'الأوميتر', 'المانومتر'], correctAnswer: '0' },
            { text: 'كمية الشحنة الكهربية التي تمر عبر مقطع في زمن ثانية واحدة تسمى:', options: ['شدة التيار', 'فرق الجهد', 'المقاومة النوعية', 'القدرة الكهربية'], correctAnswer: '0' }
        ],
        'المغناطيسية والحث الكهرومغناطيسي': [
            { text: 'وحدة قياس كثافة الفيض المغناطيسي هي:', options: ['التسلا (Tesla)', 'الويبر (Weber)', 'الهنري', 'الفاراد'], correctAnswer: '0' },
            { text: 'قاعدة لينز تستخدم في تحديد اتجاه:', options: ['التيار المستحث', 'المجال المغناطيسي', 'حركة السلك', 'القوة الدافعة الكهربية'], correctAnswer: '0' },
            { text: 'المحول الكهربي يعمل بالتيار:', options: ['المتردد فقط', 'المستمر فقط', 'المتردد والمستمر', 'البطاريات فقط'], correctAnswer: '0' },
            { text: 'تنشأ قوة تجاذب بين سلكين مستقيمين متوازيين إذا كان التياران:', options: ['في نفس الاتجاه', 'في اتجاهين متضادين', 'أحدهما متردد والآخر مستمر', 'معدومين'], correctAnswer: '0' },
            { text: 'دينامو التيار المتردد يحول الطاقة:', options: ['الميكانيكية إلى كهربية', 'الكهربية إلى ميكانيكية', 'الحرارية إلى كهربية', 'الضوئية إلى ميكانيكية'], correctAnswer: '0' }
        ]
    },
    'العلوم والكيمياء': {
        'العناصر والجدول الدوري': [
            { text: 'الرمز الكيميائي لعنصر الصوديوم هو:', options: ['Na', 'S', 'So', 'N'], correctAnswer: '0' },
            { text: 'العدد الذري لعنصر الكربون يساوي:', options: ['6', '12', '8', '14'], correctAnswer: '0' },
            { text: 'الغاز النبيل الذي يقع في الدورة الأولى هو:', options: ['الهيليوم (He)', 'النيون (Ne)', 'الأرجون (Ar)', 'الكربتون (Kr)'], correctAnswer: '0' },
            { text: 'الرابطة في جزيء ملح الطعام (NaCl) هي رابطة:', options: ['أيونية', 'تساهمية نقية', 'فلزية', 'هيدروجينية'], correctAnswer: '0' },
            { text: 'عناصر المجموعة الأولى في الجدول الدوري تسمى:', options: ['الفلزات القلوية', 'الهالوجينات', 'الغازات الخاملة', 'أشباه الفلزات'], correctAnswer: '0' }
        ],
        'المعادلات والتفاعلات الكيميائية': [
            { text: 'الرقم الهيدروجيني (pH) للمحلول الحمضي يكون:', options: ['أقل من 7', 'أكبر من 7', 'يساوي 7', 'يساوي 14'], correctAnswer: '0' },
            { text: 'عملية فقدان الإلكترونات في التفاعل الكيميائي تسمى:', options: ['أكسدة', 'اختزال', 'تعادل', 'ترسيب'], correctAnswer: '0' },
            { text: 'تفاعل الحمض مع القلوي لإنتاج ملح وماء يسمى تفاعل:', options: ['تعادل', 'أكسدة واختزال', 'إحلال بسيط', 'انحلال حراري'], correctAnswer: '0' },
            { text: 'المادة التي تزيد من سرعة التفاعل الكيميائي دون أن تستهلك هي:', options: ['العامل الحفاز', 'المادة المتفاعلة', 'الناتج', 'المذيب'], correctAnswer: '0' },
            { text: 'الصيغة الكيميائية لغاز ثاني أكسيد الكربون هي:', options: ['CO2', 'CO', 'C2O', 'CH4'], correctAnswer: '0' }
        ]
    },
    'الرياضيات': {
        'الجبر والمعادلات': [
            { text: 'إذا كانت س + 5 = 12، فإن قيمة س تساوي:', options: ['7', '6', '17', '5'], correctAnswer: '0' },
            { text: 'مجموعة حل المعادلة س² - 9 = 0 في ح هي:', options: ['{3, -3}', '{3}', '{-3}', '{9, -9}'], correctAnswer: '0' },
            { text: 'قيمة 2 أس 5 (2⁵) تساوي:', options: ['32', '10', '16', '64'], correctAnswer: '0' },
            { text: 'المقدار (س + 2)(س - 2) بعد فكه يساوي:', options: ['س² - 4', 'س² + 4', 'س² - 2', 'س² - 4س + 4'], correctAnswer: '0' },
            { text: 'أي مما يلي يمثل معادلة خطية من الدرجة الأولى؟', options: ['2س + 3 = 7', 'س² + 2 = 6', 'س³ = 8', '1/س = 4'], correctAnswer: '0' }
        ],
        'الهندسة وحساب المثلثات': [
            { text: 'مجموع قياسات زوايا المثلث الداخلة يساوي:', options: ['180°', '360°', '90°', '270°'], correctAnswer: '0' },
            { text: 'في المثلث القائم الزاوية، جيب الزاوية (جا / Sin) يساوي:', options: ['المقابل / الوتر', 'المجاور / الوتر', 'المقابل / المجاور', 'الوتر / المقابل'], correctAnswer: '0' },
            { text: 'مساحة المربع الذي طول ضلعه 6 سم تساوي:', options: ['36 سم²', '24 سم²', '12 سم²', '30 سم²'], correctAnswer: '0' },
            { text: 'الزاويتان المتتامتان مجموع قياسهما يساوي:', options: ['90°', '180°', '360°', '45°'], correctAnswer: '0' },
            { text: 'طول الوتر في مثلث قائم طولا ضلعي القائمة فيه 3 سم و 4 سم هو:', options: ['5 سم', '7 سم', '6 سم', '8 سم'], correctAnswer: '0' }
        ]
    },
    'الأحياء': {
        'الخلية ووظائف الأعضاء': [
            { text: 'ما هي عُضية الخلية المسؤولة عن إنتاج وتخزين الطاقة (ATP)؟', options: ['الميتوكوندريا', 'الريبوسومات', 'جهاز جولجي', 'النواة'], correctAnswer: '0' },
            { text: 'المسؤول عن نقل الأكسجين في دم الإنسان هو بروتين:', options: ['الهيموجلوبين', 'الأنسولين', 'الكيراتين', 'الألبومين'], correctAnswer: '0' },
            { text: 'الوحدة البنائية للبروتينات هي:', options: ['الأحماض الأمينية', 'الأحماض الدهنية', 'الجلوكوز', 'النيوكليوتيدات'], correctAnswer: '0' },
            { text: 'العملية التي يقوم بها النبات لصنع غذائه باستخدام الضوء تسمى:', options: ['البناء الضوئي', 'التنفس الخلوي', 'النتح', 'الخاصية الأسموزية'], correctAnswer: '0' },
            { text: 'عضو الجهاز الهضمي الذي يتم فيه امتصاص معظم العناصر الغذائية هو:', options: ['الأمعاء الدقيقة', 'المعدة', 'الأمعاء الغليظة', 'المريء'], correctAnswer: '0' }
        ],
        'الوراثة والحمض النووي': [
            { text: 'القاعدة النيتروجينية التي توجد في RNA ولا توجد في DNA هي:', options: ['اليوراسيل (U)', 'الثايمين (T)', 'الأدينين (A)', 'الجوانين (G)'], correctAnswer: '0' },
            { text: 'عدد الكروموسومات في الخلية الجسدية للإنسان السليم هو:', options: ['46 كروموسوم', '23 كروموسوم', '44 كروموسوم', '48 كروموسوم'], correctAnswer: '0' },
            { text: 'مؤسس علم الوراثة الكلاسيكية هو العالم:', options: ['جريجور مندل', 'تشارلز داروين', 'واطسون وكريك', 'روبرت هوك'], correctAnswer: '0' },
            { text: 'الجين السائد هو الجين الذي:', options: ['يظهر أثره في وجود الجين المتنحي', 'يختفي دائماً', 'لا ينتقل للأبناء', 'يسبب طفرة دائماً'], correctAnswer: '0' },
            { text: 'الحمض النووي الذي يحمل الشفرة الوراثية ويوجد في النواة هو:', options: ['DNA', 'RNA', 'ATP', 'tRNA'], correctAnswer: '0' }
        ]
    }
};

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

        if (ps.isBanned) {
            return res.status(403).json({
                success: false,
                isBanned: true,
                message: ps.banReason || 'لقد تم حظرك بسبب الغش!'
            });
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
                availableTopics: Object.keys(CURRICULUM_QUESTIONS).reduce((acc, sub) => {
                    acc[sub] = Object.keys(CURRICULUM_QUESTIONS[sub]);
                    return acc;
                }, {})
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
        const { subject, topic } = req.body;
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

        // Deduct 1 energy
        ps.dailyEnergy = Math.max(0, ps.dailyEnergy - 1);
        ps.totalAttempts += 1;
        await ps.save();

        let pool = [];

        // STRICT Subject & Topic Matching:
        if (subject && subject !== 'الكل' && subject !== 'all' && CURRICULUM_QUESTIONS[subject]) {
            const subjectUnits = CURRICULUM_QUESTIONS[subject];
            if (topic && topic !== 'الكل' && topic !== 'all' && subjectUnits[topic]) {
                // Strict unit selection requested by student
                pool = [...subjectUnits[topic]];
            } else {
                // All units of that specific subject only!
                Object.values(subjectUnits).forEach(questionsList => {
                    pool.push(...questionsList);
                });
            }
        } else {
            // General mixed quiz: collect from all subjects
            Object.values(CURRICULUM_QUESTIONS).forEach(subUnits => {
                Object.values(subUnits).forEach(questionsList => {
                    pool.push(...questionsList);
                });
            });
        }

        // Shuffle questions
        pool.sort(() => 0.5 - Math.random());
        const selectedQuestions = pool.slice(0, 5);

        // Sanitize question data sent to frontend (do not send correctAnswer)
        const clientQuestions = selectedQuestions.map((q, idx) => ({
            id: idx,
            text: q.text,
            options: q.options,
            subject: subject || 'عام'
        }));

        const rawAnswers = selectedQuestions.map(q => q.correctAnswer);
        const quizToken = Buffer.from(JSON.stringify({
            userId,
            answers: rawAnswers,
            subject: subject || 'عام',
            topic: topic || 'شامل',
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
            subject: tokenData.subject ? `${tokenData.subject} (${tokenData.topic || 'شامل'})` : 'عام',
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


// ══════════════════════════════════════════════════════
// 🛡️ ADMIN MANAGEMENT CONTROLLERS FOR PLAY & STUDY
// ══════════════════════════════════════════════════════

// 5. Admin: Get all student records in Play & Study
exports.adminGetAllPlayers = async (req, res) => {
    try {
        const records = await PlayStudy.find()
            .populate('userId', 'firstName lastName phone grade')
            .sort({ points: -1 });

        const players = records.map(r => ({
            id: r._id,
            userId: r.userId ? r.userId._id : null,
            name: r.userId ? `${r.userId.firstName} ${r.userId.lastName}` : 'مستخدم محذوف',
            phone: r.userId ? r.userId.phone : '-',
            grade: r.userId ? r.userId.grade : '-',
            points: r.points,
            dailyEnergy: r.dailyEnergy,
            totalAttempts: r.totalAttempts,
            totalWins: r.totalWins,
            perfectWins: r.perfectWins,
            isBanned: r.isBanned || false,
            banReason: r.banReason || '',
            bannedAt: r.bannedAt,
            couponsCount: (r.redeemedCoupons || []).length
        }));

        res.json({ success: true, players });
    } catch (err) {
        console.error('Admin getAllPlayers error:', err);
        res.status(500).json({ success: false, message: 'تعذر جلب سجلات الطلاب' });
    }
};

// 6. Admin: Toggle Ban (حظر الطالب من اللعبة)
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

// 7. Admin: Adjust Student Points / Rank (خصم أو إضافة نقاط)
exports.adminAdjustPoints = async (req, res) => {
    try {
        const { recordId, pointsChange, newPoints } = req.body;
        const record = await PlayStudy.findById(recordId);
        if (!record) {
            return res.status(404).json({ success: false, message: 'سجل الطالب غير موجود' });
        }

        if (newPoints !== undefined && newPoints !== null) {
            record.points = Math.max(0, Number(newPoints));
        } else if (pointsChange !== undefined) {
            record.points = Math.max(0, record.points + Number(pointsChange));
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

// 8. Admin: Reset Daily Energy (إعادة شحن المحاولات)
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
