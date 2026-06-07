const express = require('express');
const router = express.Router();
const {
    getBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog
} = require('../controllers/blogController');
const { admin, protectAdmin, protectPublic } = require('../middleware/authMiddleware');

router.route('/')
    .get(protectPublic, getBlogs)
    .post(protectAdmin, admin, createBlog);

router.route('/:id')
    .get(protectPublic, getBlogById)
    .put(protectAdmin, admin, updateBlog)
    .delete(protectAdmin, admin, deleteBlog);

module.exports = router;
