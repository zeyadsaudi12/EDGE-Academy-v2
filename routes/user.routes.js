const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const upload = require('../middleware/upload');
const { authenticate, allowRoles, ownUserOr } = require('../middleware/auth');

const optionalOrRequiredAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authenticate(req, res, () => allowRoles('admin', 'teacher', 'assistant')(req, res, next));
    }
    if (req.body && (req.body.teacherId || (Array.isArray(req.body.records) && req.body.records.length > 0 && req.body.records[0].teacherId))) {
        return next();
    }
    return authenticate(req, res, () => allowRoles('admin', 'teacher', 'assistant')(req, res, next));
};

router.post('/grant-attendance', optionalOrRequiredAuth, userController.registerAttendance);
router.post('/sync-attendance', optionalOrRequiredAuth, userController.syncOfflineAttendance);

router.get('/', authenticate, allowRoles('admin'), userController.getAllUsers);
router.get('/:id', authenticate, ownUserOr('admin'), userController.getUserById);
router.delete('/:id', authenticate, allowRoles('admin'), userController.deleteUser);
router.put('/:id', authenticate, ownUserOr('admin'), userController.updateUser);

router.post('/:id/follow', authenticate, ownUserOr('admin'), userController.follow);
router.post('/:id/subscribe', authenticate, ownUserOr('admin'), userController.subscribe);
router.post('/:id/subscribe-free', authenticate, ownUserOr('admin'), userController.subscribeFree);
router.post('/:id/subscribe-course', authenticate, ownUserOr('admin'), userController.subscribeCourse);
router.post('/:id/buy-course', authenticate, ownUserOr('admin'), userController.buyCourseBalance);
router.post('/:id/avatar', authenticate, ownUserOr('admin'), upload.single('avatar'), userController.uploadAvatar);
router.delete('/:id/devices/:deviceId', authenticate, ownUserOr('admin'), userController.removeDevice);
router.get('/:id/attendance', authenticate, ownUserOr('admin'), userController.studentAttendance);

module.exports = router;
