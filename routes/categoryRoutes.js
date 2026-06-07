const express = require('express');
const router = express.Router();
const {
    getCategories,
    createCategory,
    deleteCategory,
    updateCategory
} = require('../controllers/categoryController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/', getCategories);
router.post('/', protectAdmin, createCategory);
router.delete('/:id', protectAdmin, deleteCategory);
router.put('/:id', protectAdmin, updateCategory);

module.exports = router;
