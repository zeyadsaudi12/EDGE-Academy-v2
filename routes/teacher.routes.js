const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const upload = require('../middleware/upload');

router.get('/follower-counts', teacherController.getFollowerCounts);
router.get('/', teacherController.getAllTeachers);
router.put('/:id/toggle-visibility', teacherController.toggleTeacherVisibility);
router.get('/:id', teacherController.getTeacherById);
router.post('/', upload.single('image'), teacherController.createTeacher);
router.put('/:id', upload.single('image'), teacherController.updateTeacher);
router.post('/:id/update', upload.single('image'), teacherController.updateTeacher);
router.post('/:id', upload.single('image'), teacherController.updateTeacher);
router.delete('/:id', teacherController.deleteTeacher);

module.exports = router;
