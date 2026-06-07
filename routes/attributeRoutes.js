const express = require('express');
const router = express.Router();
const {
    getAttributes,
    addAttribute,
    deleteAttribute,
    updateAttribute,
} = require('../controllers/attributeController');
const { protectAdmin, protectPublic } = require('../middleware/authMiddleware');

router.get('/', protectPublic, getAttributes);
router.post('/', protectAdmin, addAttribute);
router.delete('/:id', protectAdmin, deleteAttribute);
router.put('/:id', protectAdmin, updateAttribute);

module.exports = router;
