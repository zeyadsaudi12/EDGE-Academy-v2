const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/banner.controller');
const upload = require('../middleware/upload');
const { authenticate, allowRoles } = require('../middleware/auth');

router.get('/', bannerController.getAllBanners);
router.post('/', authenticate, allowRoles('admin'), upload.single('image'), bannerController.createBanner);
router.delete('/:id', authenticate, allowRoles('admin'), bannerController.deleteBanner);

module.exports = router;
