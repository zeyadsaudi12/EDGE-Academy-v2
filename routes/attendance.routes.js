const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, allowRoles } = require('../middleware/auth');

router.post('/scan', authenticate, allowRoles('admin', 'teacher', 'assistant'), userController.registerAttendance);
router.get('/pending-sessions', authenticate, allowRoles('admin', 'teacher', 'assistant'), userController.pendingSessions);

module.exports = router;
