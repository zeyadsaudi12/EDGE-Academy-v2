const fs = require('fs');
let code = fs.readFileSync('controllers/playStudy.controller.js', 'utf8');

// 1. In getProfile, check if banned
const oldGetProfile = `exports.getProfile = async (req, res) => {
    try {
        const userId = req.user ? req.user.id || req.user._id : req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
        }

        const ps = await getOrCreatePlayStudy(userId);`;

const newGetProfile = `exports.getProfile = async (req, res) => {
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
        }`;

code = code.replace(oldGetProfile, newGetProfile);

// 2. In startQuiz, check if banned
const oldStartQuiz = `exports.startQuiz = async (req, res) => {
    try {
        const userId = req.user ? req.user.id || req.user._id : req.body.userId;
        const { subject, topic } = req.body;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
        }

        const ps = await getOrCreatePlayStudy(userId);`;

const newStartQuiz = `exports.startQuiz = async (req, res) => {
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
        }`;

code = code.replace(oldStartQuiz, newStartQuiz);

// 3. Add Admin Management APIs: List all players, toggle ban, adjust points, reset energy
const adminApis = `
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
            name: r.userId ? \`\${r.userId.firstName} \${r.userId.lastName}\` : 'مستخدم محذوف',
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
`;

code += '\n' + adminApis;
fs.writeFileSync('controllers/playStudy.controller.js', code, 'utf8');
console.log('✅ Added admin ban & points adjustment controllers');

