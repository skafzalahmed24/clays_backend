const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    createProductReview,
} = require('../controllers/productController');
const { protect, protectAdmin, protectPublic } = require('../middleware/authMiddleware');

const { createProductSchema, updateProductSchema, reviewSchema } = require('../validators/productValidators');
const validate = require('../middleware/validationMiddleware');

router.get('/', protectPublic, getProducts);
router.get('/:id', protectPublic, getProductById);
router.post('/', protectAdmin, validate(createProductSchema), createProduct);
router.put('/:id', protectAdmin, validate(updateProductSchema), updateProduct);
router.delete('/:id', protectAdmin, deleteProduct);
router.route('/:id/reviews')
    .post(protect, validate(reviewSchema), createProductReview)
    .put(protect, validate(reviewSchema), require('../controllers/productController').updateProductReview);

module.exports = router;
