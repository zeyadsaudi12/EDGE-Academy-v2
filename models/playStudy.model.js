const mongoose = require('mongoose');

const playStudySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    points: { type: Number, default: 0, min: 0 },
    // Energy: 4 attempts per day
    dailyEnergy: { type: Number, default: 4, min: 0, max: 4 },
    lastEnergyReset: { type: Date, default: Date.now },
    totalAttempts: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 }, // >= 70%
    perfectWins: { type: Number, default: 0 }, // 100%
    
    // Admin Controls & Anti-Cheat:
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: 'لقد تم حظرك من نظام Play & Study بسبب انتهاك القواعد أو محاولات الغش.' },
    bannedAt: { type: Date },

    // Robot EDGE Scavenger Hunt Feature:
    lastEdgeRobotFound: { type: Date },
    edgeRobotFindsCount: { type: Number, default: 0 },

    history: [{
        subject: { type: String, default: 'عام' },
        score: { type: Number, required: true },
        percentage: { type: Number, required: true },
        pointsEarned: { type: Number, default: 0 },
        date: { type: Date, default: Date.now }
    }],
    redeemedCoupons: [{
        code: { type: String, required: true },
        value: { type: Number, default: 100 },
        used: { type: Boolean, default: false },
        videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
        videoTitle: { type: String },
        createdAt: { type: Date, default: Date.now },
        usedAt: { type: Date }
    }]
}, { timestamps: true });

// Method to check and reset daily energy if 24 hours or new calendar day has passed
playStudySchema.methods.checkDailyEnergy = function() {
    const now = new Date();
    const last = new Date(this.lastEnergyReset || 0);
    
    // Reset if it's a different calendar day (UTC/Local day boundary) or > 24 hours
    const isNewDay = now.toDateString() !== last.toDateString();
    if (isNewDay) {
        this.dailyEnergy = 4;
        this.lastEnergyReset = now;
    }
};

module.exports = mongoose.model('PlayStudy', playStudySchema);
