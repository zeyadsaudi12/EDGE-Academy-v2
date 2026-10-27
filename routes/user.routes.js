const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const upload = require('../middleware/upload');
const { authenticate, allowRoles, ownUserOr } = require('../middleware/auth');

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
