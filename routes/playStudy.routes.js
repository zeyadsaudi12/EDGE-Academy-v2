const express = require('express');
const router = express.Router();
const playStudyController = require('../controllers/playStudy.controller');

// Student Play & Study routes
router.get('/profile', playStudyController.getProfile);
router.post('/mark-watched', playStudyController.markVideoWatched);
router.post('/start', playStudyController.startQuiz);
router.post('/submit', playStudyController.submitQuiz);
router.post('/redeem', playStudyController.redeemPoints);
router.post('/find-edge-robot', playStudyController.findEdgeRobot);

// Admin Management routes
router.get('/admin/players', playStudyController.adminGetAllPlayers);
router.post('/admin/toggle-ban', playStudyController.adminToggleBan);
router.post('/admin/adjust-points', playStudyController.adminAdjustPoints);
router.post('/admin/reset-energy', playStudyController.adminResetEnergy);

module.exports = router;
