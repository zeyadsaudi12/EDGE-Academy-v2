const express = require('express');
const router = express.Router();
const controller = require('../controllers/teacherApplication.controller');
const { authenticate, allowRoles } = require('../middleware/auth');

router.post('/', controller.createApplication);
router.get('/', authenticate, allowRoles('admin'), controller.listApplications);
router.put('/:id/approve', authenticate, allowRoles('admin'), controller.approveApplication);
router.put('/:id/reject', authenticate, allowRoles('admin'), controller.rejectApplication);

module.exports = router;
