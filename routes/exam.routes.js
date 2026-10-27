const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const upload = require('../middleware/upload');
const { authenticate, allowRoles, ownUserOr } = require('../middleware/auth');

router.get('/student/:studentId/results', authenticate, ownUserOr('admin', 'teacher', 'assistant'), examController.getStudentResults);
router.get('/', authenticate, examController.getAllExams);
router.delete('/:examId/results/:studentId', authenticate, allowRoles('admin', 'teacher', 'assistant'), examController.resetStudentExam);
router.get('/admin', authenticate, allowRoles('admin', 'teacher', 'assistant'), examController.getAllExamsForAdmin);
router.get('/:id', authenticate, examController.getExamById);
router.post('/', authenticate, allowRoles('admin', 'teacher', 'assistant'), examController.createExam);
router.put('/:id', authenticate, allowRoles('admin', 'teacher', 'assistant'), examController.updateExam);
router.delete('/:id', authenticate, allowRoles('admin', 'teacher', 'assistant'), examController.deleteExam);
router.post('/:id/submit', authenticate, examController.submitExam);
router.post('/:examId/grade-essay', authenticate, allowRoles('admin', 'teacher', 'assistant'), examController.gradeEssay);
router.post('/upload-file', authenticate, allowRoles('admin', 'teacher', 'assistant'), upload.fields([{ name: 'examFile', maxCount: 1 }, { name: 'answerFile', maxCount: 1 }]), examController.uploadFile);
router.get('/:id/results', authenticate, allowRoles('admin', 'teacher', 'assistant'), examController.getExamResults);

module.exports = router;
