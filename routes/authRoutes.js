const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    logoutUser,
    refreshToken
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const { registerSchema, loginSchema } = require('../validators/authValidators');
const validate = require('../middleware/validationMiddleware');

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/logout', logoutUser);
router.post('/refresh', refreshToken);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
