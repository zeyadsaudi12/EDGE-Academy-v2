const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

router.post('/scan', userController.registerAttendance);
router.get('/pending-sessions', userController.pendingSessions);

module.exports = router;
