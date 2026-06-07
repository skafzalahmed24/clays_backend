const mongoose = require('mongoose');

const stockRequestSchema = mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Product',
        },
        productName: {
            type: String,
            required: true,
        },
        productImg: {
            type: String,
            required: true,
        },
        userEmail: {
            type: String,
            required: [true, 'Please add an email'],
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email',
            ],
        },
        status: {
            type: String,
            default: 'Pending',
            enum: ['Pending', 'Notified'],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('StockRequest', stockRequestSchema);
