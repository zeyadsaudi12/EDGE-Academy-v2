const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, allowRoles } = require('../middleware/auth');

const optionalOrRequiredAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authenticate(req, res, () => allowRoles('admin', 'teacher', 'assistant')(req, res, next));
    }
    // Allow direct center session attendance registration if valid teacherId or records with teacherId is provided
    if (req.body && (req.body.teacherId || (Array.isArray(req.body.records) && req.body.records.length > 0 && req.body.records[0].teacherId))) {
        return next();
    }
    return authenticate(req, res, () => allowRoles('admin', 'teacher', 'assistant')(req, res, next));
};

router.post('/scan', optionalOrRequiredAuth, userController.registerAttendance);
router.post('/sync-offline', optionalOrRequiredAuth, userController.syncOfflineAttendance);
router.get('/pending-sessions', authenticate, allowRoles('admin', 'teacher', 'assistant'), userController.pendingSessions);

module.exports = router;
