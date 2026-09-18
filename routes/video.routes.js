const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');
const upload = require('../middleware/upload');

router.put('/:id/toggle', videoController.toggleVideo);
router.put('/:id/toggle-visibility', videoController.toggleVisibility);
router.put('/:id', videoController.updateVideo);
router.delete('/:id', videoController.deleteVideo);
router.post('/:id/like', videoController.likeVideo);
router.get('/', videoController.getAllVideos);
router.post('/', upload.fields([
    { name: 'image', maxCount: 1 }, 
    { name: 'video', maxCount: 1 },
    { name: 'bookletFiles', maxCount: 10 },
    { name: 'homeworkFiles', maxCount: 5 }
]), videoController.createVideo);
router.get('/:id/watchers', videoController.getVideoWatchers);
router.get('/:id', videoController.getVideoById);

module.exports = router;
