const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/', protectAdmin, upload.single('file'), (req, res) => {
    let imageUrl;

    if (req.file.location) {
        // Return S3/MinIO URL
        imageUrl = req.file.location;
        if (process.env.MINIO_PUBLIC_URL) {
            imageUrl = `${process.env.MINIO_PUBLIC_URL}/${req.file.key}`;
        }
    } else {
        // Return local static served path
        imageUrl = `/uploads/${req.file.filename}`;
    }

    res.json({
        status: 1,
        message: 'Image uploaded successfully',
        data: imageUrl
    });
});

module.exports = router;
