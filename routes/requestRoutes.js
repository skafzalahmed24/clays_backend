const express = require('express');
const router = express.Router();
const {
    createRequest,
    getRequests,
    deleteRequest,
    updateRequest,
} = require('../controllers/requestController');
const { admin, protectAdmin } = require('../middleware/authMiddleware');

router.post('/', createRequest);
router.get('/', protectAdmin, admin, getRequests);
router.delete('/:id', protectAdmin, admin, deleteRequest);
router.put('/:id', protectAdmin, admin, updateRequest);

module.exports = router;
