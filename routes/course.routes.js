const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const courseController = require('../controllers/course.controller');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => {
        const unique = Math.round(Math.random() * 1E9);
        cb(null, `${Math.floor(Date.now() / 1000)}-${unique}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

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
