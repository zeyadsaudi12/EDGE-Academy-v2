const SecurityReport = require('../models/securityReport.model');

// حفظ تقرير أمني جديد في قاعدة البيانات
exports.report = async (req, res) => {
    try {
        const reportData = {
            ...req.body,
            serverTimestamp: new Date(),
            ip: req.ip || req.connection.remoteAddress
        };
        const report = await SecurityReport.create(reportData);
        res.json({ success: true, reportId: report._id });
    } catch (err) {
        console.error('Error saving security report to DB:', err);
        res.status(500).json({ success: false, message: 'Failed to save security report' });
    }
};

// جلب جميع التقارير الأمنية من قاعدة البيانات
exports.reports = async (req, res) => {
    try {
        const reports = await SecurityReport.find().sort({ createdAt: -1 }).limit(1000).lean();
        res.json({ success: true, reports });
    } catch (err) {
        console.error('Error fetching security reports from DB:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch reports' });
    }
};

// حذف جميع التقارير الأمنية من قاعدة البيانات
exports.deleteAll = async (req, res) => {
    try {
        await SecurityReport.deleteMany({});
        res.json({ success: true, message: 'All reports cleared from database' });
    } catch (err) {
        console.error('Error clearing reports:', err);
        res.status(500).json({ success: false, message: 'Failed to clear reports' });
    }
};

// فك حظر الطالب من قاعدة البيانات
exports.unlock = async (req, res) => {
    try {
        const { studentPhone, videoId } = req.body;
        if (!studentPhone) {
            return res.status(400).json({ success: false, message: 'studentPhone is required' });
        }

        const filter = {
            $or: [
                { studentPhone: studentPhone },
                { userId: studentPhone }
            ]
        };
        if (videoId) {
            filter.videoId = videoId;
        }

        const result = await SecurityReport.deleteMany(filter);

        res.json({
            success: true,
            message: 'Student unlocked successfully from database',
            studentPhone,
            videoId,
            removedCount: result.deletedCount || 0
        });
    } catch (err) {
        console.error('Error unlocking student:', err);
        res.status(500).json({ success: false, message: 'Failed to unlock' });
    }
};

// التحقق مما إذا كان الطالب محظوراً
exports.checkLock = async (req, res) => {
    try {
        const studentPhone = req.query.phone || req.body.phone || '';
        const videoId = req.query.videoId || req.body.videoId || '';

        if (!studentPhone || !videoId) {
            return res.json({ locked: false });
        }

        const report = await SecurityReport.findOne({
            $or: [
                { studentPhone: studentPhone },
                { userId: studentPhone }
            ],
            videoId: videoId,
            isCritical: true
        });

        res.json({ locked: !!report });
    } catch (err) {
        console.error('Error checking lock status:', err);
        res.json({ locked: false });
    }
};
