const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, allowRoles } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/users/ping', authenticate, authController.ping);
router.get('/users/online', authenticate, allowRoles('admin'), authController.online);

module.exports = router;
