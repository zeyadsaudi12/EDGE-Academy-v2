const express = require('express');
const router = express.Router();
const codeController = require('../controllers/code.controller');
const { authenticate, allowRoles } = require('../middleware/auth');

router.post('/verify', authenticate, codeController.verifyCode);
router.get('/', authenticate, allowRoles('admin'), codeController.getAllCodes);
router.post('/generate', authenticate, allowRoles('admin'), codeController.generateCodes);
router.put('/:id', authenticate, allowRoles('admin'), codeController.updateCode);
router.delete('/:id', authenticate, allowRoles('admin'), codeController.deleteCode);
router.delete('/', authenticate, allowRoles('admin'), codeController.deleteAllCodes);

module.exports = router;
