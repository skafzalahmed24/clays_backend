const asyncHandler = require('express-async-handler');
const Contact = require('../models/Contact');

const { sendEmail } = require('../utils/emailService');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
const submitContactForm = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, subject, message } = req.body;

    if (!firstName || !lastName || !email || !subject || !message) {
        res.status(400);
        throw new Error('Please fill in all fields');
    }

    const contact = await Contact.create({
        firstName,
        lastName,
        email,
        subject,
        message,
    });

    if (contact) {
        // Send email notification to Admin
        const emailMessage = `
            <h3>New Contact Form Submission</h3>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <br>
            <p><small>This email was sent from the Mershai website contact form.</small></p>
        `;

        try {
            await sendEmail({
                email: process.env.CONTACT_EMAIL || process.env.EMAIL_USERNAME, // Send to admin/support email
                subject: `New Inquiry: ${subject}`,
                message: emailMessage
            });
        } catch (error) {
            console.error("Failed to send contact notification email:", error);
            // Don't fail the request if email fails, just log it
        }

        res.status(201).json({
            _id: contact._id,
            message: 'Message sent successfully'
        });
    } else {
        res.status(400);
        throw new Error('Invalid data');
    }
});

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private/Admin
const getContacts = asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Contact.countDocuments({});
        const contacts = await Contact.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            contacts,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single contact message
// @route   GET /api/contact/:id
// @access  Private/Admin
const getContactById = asyncHandler(async (req, res) => {
    const contact = await Contact.findById(req.params.id);

    if (contact) {
        // Mark as read if status is New
        if (contact.status === 'New') {
            contact.status = 'Read';
            await contact.save();
        }
        res.json(contact);
    } else {
        res.status(404);
        throw new Error('Message not found');
    }
});

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
const deleteContact = asyncHandler(async (req, res) => {
    const contact = await Contact.findById(req.params.id);

    if (contact) {
        await contact.deleteOne();
        res.json({ message: 'Message removed' });
    } else {
        res.status(404);
        throw new Error('Message not found');
    }
});

module.exports = {
    submitContactForm,
    getContacts,
    getContactById,
    deleteContact
};
