const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const upload = require('../middleware/upload');

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.delete('/:id', userController.deleteUser);
router.put('/:id', userController.updateUser);

router.post('/:id/follow', userController.follow);
router.post('/:id/subscribe', userController.subscribe);
router.post('/:id/subscribe-course', userController.subscribeCourse);
router.post('/:id/buy-course', userController.buyCourseBalance);
router.post('/:id/avatar', upload.single('avatar'), userController.uploadAvatar);
router.delete('/:id/devices/:deviceId', userController.removeDevice);
router.get('/:id/attendance', userController.studentAttendance);

module.exports = router;
