const express = require('express');
const router = express.Router();
const playStudyController = require('../controllers/playStudy.controller');
const { authenticate, allowRoles } = require('../middleware/auth');

// Student Play & Study routes. Identity always comes from the signed session;
// the browser cannot choose another student's id.
router.get('/profile', authenticate, playStudyController.getProfile);
router.post('/mark-watched', authenticate, playStudyController.markVideoWatched);
router.post('/start', authenticate, playStudyController.startQuiz);
router.post('/submit', authenticate, playStudyController.submitQuiz);
router.post('/redeem', authenticate, playStudyController.redeemPoints);
router.post('/find-edge-robot', authenticate, playStudyController.findEdgeRobot);

// Admin Management routes
router.get('/admin/players', authenticate, allowRoles('admin'), playStudyController.adminGetAllPlayers);
router.post('/admin/toggle-ban', authenticate, allowRoles('admin'), playStudyController.adminToggleBan);
router.post('/admin/adjust-points', authenticate, allowRoles('admin'), playStudyController.adminAdjustPoints);
router.post('/admin/reset-energy', authenticate, allowRoles('admin'), playStudyController.adminResetEnergy);

module.exports = router;
