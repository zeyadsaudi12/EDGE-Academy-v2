const express = require('express');
const router = express.Router();
const securityController = require('../controllers/security.controller');
const { authenticate, allowRoles } = require('../middleware/auth');

router.post('/report', authenticate, securityController.report);
router.get('/reports', authenticate, allowRoles('admin'), securityController.reports);
router.delete('/reports', authenticate, allowRoles('admin'), securityController.deleteAll);
router.post('/unlock', authenticate, allowRoles('admin'), securityController.unlock);
router.get('/check-lock', authenticate, securityController.checkLock);

module.exports = router;
