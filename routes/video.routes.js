const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');
const upload = require('../middleware/upload');
const { authenticate, allowRoles } = require('../middleware/auth');

router.put('/:id/toggle', authenticate, allowRoles('admin'), videoController.toggleVideo);
router.put('/:id/toggle-visibility', authenticate, allowRoles('admin'), videoController.toggleVisibility);
router.put('/:id', authenticate, allowRoles('admin'), videoController.updateVideo);
router.delete('/:id', authenticate, allowRoles('admin'), videoController.deleteVideo);
router.post('/:id/like', authenticate, videoController.likeVideo);
router.get('/', videoController.getAllVideos);
router.post('/', authenticate, allowRoles('admin'), upload.fields([
    { name: 'image', maxCount: 1 }, 
    { name: 'video', maxCount: 1 },
    { name: 'bookletFiles', maxCount: 10 },
    { name: 'homeworkFiles', maxCount: 5 }
]), videoController.createVideo);
router.get('/:id/watchers', authenticate, allowRoles('admin', 'teacher'), videoController.getVideoWatchers);
router.get('/:id', authenticate, videoController.getVideoById);

module.exports = router;
