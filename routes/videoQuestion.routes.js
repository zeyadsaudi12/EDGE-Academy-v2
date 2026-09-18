const express = require('express');
const router = express.Router();
const videoQuestionController = require('../controllers/videoQuestion.controller');

router.post('/', videoQuestionController.createQuestion);
router.get('/', videoQuestionController.getAllQuestions);
router.delete('/:id', videoQuestionController.deleteQuestion);

module.exports = router;
