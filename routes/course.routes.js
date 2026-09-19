const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const upload = require('../middleware/upload');

router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);
router.get('/:id/videos', courseController.getCourseVideosForStudent);
router.get('/:id/students', courseController.getCourseStudents);
router.post('/:id/buy', courseController.subscribeToCourse);
router.post('/', upload.single('image'), courseController.createCourse);
router.put('/:id', upload.single('image'), courseController.updateCourse);
router.post('/:id', upload.single('image'), courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
