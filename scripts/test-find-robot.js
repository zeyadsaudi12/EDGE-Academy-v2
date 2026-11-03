const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const PlayStudy = require('../models/playStudy.model');
        const User = require('../models/user.model');

        const user = await User.findOne({ phone: '01000000000' });
        const ps = await PlayStudy.findOne({ userId: user._id });

        // Unban and reset lastEdgeRobotFound to test
        ps.isBanned = false;
        ps.lastEdgeRobotFound = new Date(Date.now() - 25 * 3600 * 1000); // yesterday
        await ps.save();

        console.log('Unbanned! Initial Points:', ps.points);

        const controller = require('../controllers/playStudy.controller');
        const req = { body: { userId: user._id } };
        const res = {
            status: function(code) { this.statusCode = code; return this; },
            json: function(data) {
                console.log('Response status:', this.statusCode || 200);
                console.log('Response data:', data);
            }
        };

        await controller.findEdgeRobot(req, res);

        const updatedPs = await PlayStudy.findOne({ userId: user._id });
        console.log('Points after find:', updatedPs.points);
        console.log('Robot Finds Count:', updatedPs.edgeRobotFindsCount);
        console.log('Last history entry:', updatedPs.history[updatedPs.history.length - 1]);

        // Test second attempt on same day (should be rejected by daily cooldown)
        console.log('\n--- Testing second attempt on same day ---');
        await controller.findEdgeRobot(req, res);

        process.exit(0);
    } catch (err) {
        console.error('Test error:', err);
        process.exit(1);
    }
}

test();
