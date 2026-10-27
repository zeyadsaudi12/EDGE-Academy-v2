const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const crypto = require('crypto');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// A small Multer storage engine using Cloudinary's maintained v2 SDK directly.
// multer-storage-cloudinary only supports Cloudinary v1, which makes `npm ci`
// fail on Vercel with a peer-dependency conflict.
function cloudinaryStorage() {
    return {
        _handleFile(_req, file, callback) {
            const isRaw = file.mimetype === 'application/pdf' ||
                file.mimetype.includes('word') || file.mimetype.includes('officedocument') ||
                /\.(pdf|docx)$/i.test(file.originalname);
            const resourceType = isRaw ? 'raw' : 'auto';
            const publicId = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
            const stream = cloudinary.uploader.upload_stream({
                folder: 'edge-academy',
                resource_type: resourceType,
                public_id: publicId
            }, (error, result) => {
                if (error) return callback(error);
                callback(null, {
                    path: result.secure_url || result.url,
                    filename: result.public_id,
                    public_id: result.public_id,
                    size: result.bytes,
                    resource_type: result.resource_type
                });
            });
            file.stream.pipe(stream);
        },
        _removeFile(_req, file, callback) {
            if (!file.public_id) return callback(null);
            cloudinary.uploader.destroy(file.public_id, { resource_type: file.resource_type || 'image' })
                .then(() => callback(null))
                .catch(callback);
        }
    };
}

const storage = cloudinaryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowed = /^image\/(jpeg|png|webp)$/i.test(file.mimetype) || /^video\/(mp4|webm)$/i.test(file.mimetype) ||
            ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimetype);
        cb(allowed ? null : new Error('نوع الملف غير مسموح به'), allowed);
    }
});

module.exports = upload;
module.exports.cloudinary = cloudinary;
