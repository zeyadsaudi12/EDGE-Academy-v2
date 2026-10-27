const express = require('express');
const router = express.Router();
const videoQuestionController = require('../controllers/videoQuestion.controller');
const { authenticate, allowRoles } = require('../middleware/auth');

router.post('/', authenticate, videoQuestionController.createQuestion);
router.get('/', authenticate, allowRoles('admin', 'teacher', 'assistant'), videoQuestionController.getAllQuestions);
router.delete('/:id', authenticate, allowRoles('admin', 'teacher', 'assistant'), videoQuestionController.deleteQuestion);

module.exports = router;
