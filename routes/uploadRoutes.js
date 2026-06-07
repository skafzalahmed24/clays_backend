const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/', protectAdmin, upload.single('file'), (req, res) => {
    // Return the URL provided by multer-s3 (MinIO)
    // We can replace the localhost:9000 part with a custom domain if needed via MINIO_PUBLIC_URL
    let imageUrl = req.file.location;

    // If MINIO_PUBLIC_URL is defined (prod), use it to construct the public URL for the client.
    // Otherwise, fallback to the default location provided by multer-s3 (local dev).
    if (process.env.MINIO_PUBLIC_URL) {
        // Construct public URL using the public prefix and the unique file key
        imageUrl = `${process.env.MINIO_PUBLIC_URL}/${req.file.key}`;
    }

    res.json({
        status: 1,
        message: 'Image uploaded successfully',
        data: imageUrl
    });
});

module.exports = router;
