const Banner = require('../models/banner.model');
const fs = require('fs');
const path = require('path');

exports.getAllBanners = async (req, res, next) => {
    try {
        const banners = await Banner.find().sort({ order: 1, createdAt: 1 });
        res.json({ success: true, banners });
    } catch (err) {
        next(err);
    }
};

exports.createBanner = async (req, res, next) => {
    try {
        const { title, link, order } = req.body;
        const imagePath = req.file ? req.file.path : req.body.imagePath;
        if (!imagePath) return res.status(400).json({ success: false, message: 'الصورة مطلوبة' });
        
        const banner = new Banner({ 
            imagePath, 
            title: title || '', 
            link: link || '', 
            order: parseInt(order) || 0 
        });
        await banner.save();
        res.status(201).json({ success: true, banner });
    } catch (err) {
        next(err);
    }
};

exports.deleteBanner = async (req, res, next) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);
        if (!banner) return res.status(404).json({ success: false, message: 'الإعلان غير موجود' });
        
        // Delete image file from disk
        const filePath = path.join(__dirname, '..', banner.imagePath);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                console.error("Error deleting banner image file:", e);
            }
        }
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};
