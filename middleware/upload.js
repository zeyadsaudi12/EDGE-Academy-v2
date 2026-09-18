const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists (use /tmp on Vercel or read-only environments)
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
const uploadsDir = isVercel
    ? path.join('/tmp', 'uploads')
    : path.join(__dirname, '..', 'uploads');

try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
} catch (e) {
    console.warn('Could not create uploads directory:', e.message);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 }
});

module.exports = upload;
