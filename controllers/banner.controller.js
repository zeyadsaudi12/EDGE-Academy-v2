const Banner = require('../models/banner.model');
const { cloudinary } = require('../middleware/upload');

// استخراج public_id من Cloudinary URL
function extractCloudinaryPublicId(url) {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return null;
        let startIdx = uploadIndex + 1;
        if (parts[startIdx] && /^v\d+$/.test(parts[startIdx])) startIdx++;
        const fileWithExt = parts.slice(startIdx).join('/');
        return fileWithExt.replace(/\.[^/.]+$/, '');
    } catch (e) {
        return null;
    }
}

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
        // req.file.path = Cloudinary URL بعد الرفع عبر multer-storage-cloudinary
        const imagePath = req.file ? req.file.path : req.body.imagePath;
        if (!imagePath) return res.status(400).json({ success: false, message: 'الصورة مطلوبة' });
        
        const banner = new Banner({ 
            imagePath,   // Cloudinary URL مثل: https://res.cloudinary.com/...
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
        
        // حذف الصورة من Cloudinary
        const publicId = extractCloudinaryPublicId(banner.imagePath);
        if (publicId) {
            cloudinary.uploader.destroy(publicId).catch(e => console.error('خطأ في حذف صورة البانر من Cloudinary:', e));
        }

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};
