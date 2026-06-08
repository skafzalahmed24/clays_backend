const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs');

let storage;

const isMinioConfigured = 
    process.env.MINIO_ENDPOINT && 
    process.env.MINIO_PORT && 
    process.env.MINIO_ACCESS_KEY && 
    process.env.MINIO_SECRET_KEY;

if (isMinioConfigured) {
    const s3Client = require('../utils/minioClient');
    storage = multerS3({
        s3: s3Client,
        bucket: process.env.MINIO_BUCKET || 'Clarysays-media',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
          cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
          cb(null, `media-${Date.now()}${path.extname(file.originalname)}`);
        }
    });
} else {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadsDir);
        },
        filename: function (req, file, cb) {
            cb(null, `media-${Date.now()}${path.extname(file.originalname)}`);
        }
    });
}

// 2. File Filter (Security)
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp|mp4|webm|mov|ogg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images and Videos only!');
    }
}

// 3. Centralized Upload Middleware
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for videos
});

module.exports = upload;
