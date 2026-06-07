const mongoose = require('mongoose');

const attributeSchema = mongoose.Schema(
    {
        type: {
            type: String, // 'material', 'color', 'occasion', 'subCategory'
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        value: {
            type: String, // Optional, e.g. for hex code or simple string value if name is label
        },
        img: {
            type: String, // URL to image
        }
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent duplicates
attributeSchema.index({ type: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Attribute', attributeSchema);
