const express = require('express');
const router = express.Router();
const { loginAdmin, registerAdmin, logoutAdmin } = require('../controllers/adminAuthController');

router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);
router.post('/refresh', require('../controllers/adminAuthController').refreshToken);
router.post('/forgot-password', require('../controllers/adminAuthController').forgotPasswordAdmin);
router.post('/reset-password', require('../controllers/adminAuthController').resetPasswordAdmin);
router.post('/', registerAdmin); 

module.exports = router;
