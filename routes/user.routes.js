const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => {
        const unique = Math.round(Math.random() * 1E9);
        cb(null, `avatar-${Date.now()}-${unique}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

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
