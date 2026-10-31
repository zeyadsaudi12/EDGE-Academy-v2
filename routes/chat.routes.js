const express = require('express');
const rateLimit = require('express-rate-limit');
const chatController = require('../controllers/chat.controller');
const { optionalAuthenticate } = require('../middleware/auth');

const router = express.Router();
router.post('/', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'أرسلت رسائل كثيرة، جرّب مرة أخرى بعد قليل.' }
}), optionalAuthenticate, chatController.reply);

module.exports = router;
