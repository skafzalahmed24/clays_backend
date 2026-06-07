const express = require('express');
const router = express.Router();
const { getDashboardStats, getSalesData } = require('../controllers/analyticsController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/dashboard', protectAdmin, getDashboardStats);
router.get('/sales', protectAdmin, getSalesData);

module.exports = router;
