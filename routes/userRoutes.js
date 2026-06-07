const express = require('express');
const router = express.Router();
const {
    getCart,
    addToCart,
    removeFromCart,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    updateUserProfile,
    getUsers,
    getUserAddresses,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultAddress,
    getUserById
} = require('../controllers/userController');
const { protect, admin, protectAdmin } = require('../middleware/authMiddleware');

router.put('/profile', protect, updateUserProfile);

// Address routes
router.get('/addresses', protect, getUserAddresses);
router.post('/addresses', protect, addUserAddress);
router.put('/addresses/:addressId', protect, updateUserAddress);
router.delete('/addresses/:addressId', protect, deleteUserAddress);
router.put('/addresses/:addressId/default', protect, setDefaultAddress);

// Cart routes
router.get('/cart', protect, getCart);
router.post('/cart', protect, addToCart);
router.delete('/cart/:productId', protect, removeFromCart);

// Wishlist routes
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist', protect, addToWishlist);
router.delete('/wishlist/:productId', protect, removeFromWishlist);

// Admin Routes (must be at the bottom to avoid conflicting with specific paths like /cart or /profile)
router.get('/', protectAdmin, admin, getUsers);
router.get('/:id', protectAdmin, admin, getUserById);

module.exports = router;
