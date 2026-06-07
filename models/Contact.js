const mongoose = require('mongoose');

const contactSchema = mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'Please add a first name'],
        },
        lastName: {
            type: String,
            required: [true, 'Please add a last name'],
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email',
            ],
        },
        subject: {
            type: String,
            required: [true, 'Please select a subject'],
        },
        message: {
            type: String,
            required: [true, 'Please add a message'],
        },
        status: {
            type: String,
            enum: ['New', 'Read', 'Replied'],
            default: 'New',
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Contact', contactSchema);
