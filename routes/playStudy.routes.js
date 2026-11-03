const express = require('express');
const router = express.Router();
const playStudyController = require('../controllers/playStudy.controller');

// Optional/Flexible auth: works with req.user if session/jwt cookie present, or userId in payload
router.get('/profile', playStudyController.getProfile);
router.post('/start', playStudyController.startQuiz);
router.post('/submit', playStudyController.submitQuiz);
router.post('/redeem', playStudyController.redeemPoints);

module.exports = router;
