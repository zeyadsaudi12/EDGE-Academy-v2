const mongoose = require('mongoose');

const securityReportSchema = new mongoose.Schema({
    studentPhone: { type: String, default: '' },
    userId: { type: String, default: '' },
    studentName: { type: String, default: '' },
    videoId: { type: String, default: '' },
    videoTitle: { type: String, default: '' },
    reason: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    isCritical: { type: Boolean, default: false },
    ip: { type: String, default: '' },
    serverTimestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('SecurityReport', securityReportSchema);
