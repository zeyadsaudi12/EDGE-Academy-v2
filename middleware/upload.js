const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage engine for multer
// Handles images and general files
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isRaw = file.mimetype === 'application/pdf' || 
                      file.mimetype.includes('word') || 
                      file.mimetype.includes('officedocument') ||
                      file.originalname.endsWith('.pdf') ||
                      file.originalname.endsWith('.docx');

        return {
            folder: 'edge-academy',
            resource_type: isRaw ? 'raw' : 'auto',
            public_id: Date.now() + '-' + Math.round(Math.random() * 1E9),
        };
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = upload;
module.exports.cloudinary = cloudinary;
