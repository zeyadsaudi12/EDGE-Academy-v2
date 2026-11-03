const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function test() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        const PlayStudy = require('../models/playStudy.model');
        const User = require('../models/user.model');
        const records = await PlayStudy.find()
            .populate('userId', 'firstName lastName phone grade')
            .sort({ points: -1 });

        console.log('Found records:', records.length);
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
        console.log('Mapped players count:', players.length);
        console.log('Players:', players);
        process.exit(0);
    } catch (err) {
        console.error('Error during test:', err);
        process.exit(1);
    }
}

test();
