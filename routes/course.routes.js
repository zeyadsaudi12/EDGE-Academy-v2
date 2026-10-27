const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const upload = require('../middleware/upload');
const { authenticate, allowRoles } = require('../middleware/auth');

router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);
router.get('/:id/videos', authenticate, courseController.getCourseVideosForStudent);
router.get('/:id/students', authenticate, allowRoles('admin', 'teacher'), courseController.getCourseStudents);
router.post('/:id/buy', authenticate, courseController.subscribeToCourse);
router.post('/', authenticate, allowRoles('admin'), upload.single('image'), courseController.createCourse);
router.put('/:id', authenticate, allowRoles('admin'), upload.single('image'), courseController.updateCourse);
router.post('/:id', authenticate, allowRoles('admin'), upload.single('image'), courseController.updateCourse);
router.delete('/:id', authenticate, allowRoles('admin'), courseController.deleteCourse);

module.exports = router;
