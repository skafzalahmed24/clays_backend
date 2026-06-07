const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/authMiddleware');
const { 
    submitContactForm,
    getContacts,
    getContactById,
    deleteContact
} = require('../controllers/contactController');

router.route('/')
    .post(submitContactForm)
    .get(protectAdmin, getContacts);

router.route('/:id')
    .get(protectAdmin, getContactById)
    .delete(protectAdmin, deleteContact);

module.exports = router;
