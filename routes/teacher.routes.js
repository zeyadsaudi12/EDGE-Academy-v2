const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const upload = require('../middleware/upload');
const { authenticate, allowRoles } = require('../middleware/auth');

router.get('/follower-counts', teacherController.getFollowerCounts);
router.get('/dashboard/:id', authenticate, (req, _res, next) => { req.query.userId = String(req.user._id); next(); }, teacherController.getTeacherDashboard);
router.get('/', teacherController.getAllTeachers);
router.put('/:id/toggle-visibility', authenticate, allowRoles('admin'), teacherController.toggleTeacherVisibility);
router.get('/:id', teacherController.getTeacherById);
router.post('/', authenticate, allowRoles('admin'), upload.single('image'), teacherController.createTeacher);
router.put('/:id', authenticate, allowRoles('admin'), upload.single('image'), teacherController.updateTeacher);
router.post('/:id/update', authenticate, allowRoles('admin'), upload.single('image'), teacherController.updateTeacher);
router.post('/:id', authenticate, allowRoles('admin'), upload.single('image'), teacherController.updateTeacher);
router.delete('/:id', authenticate, allowRoles('admin'), teacherController.deleteTeacher);

module.exports = router;
