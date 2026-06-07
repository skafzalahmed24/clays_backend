const mongoose = require('mongoose');

const trustBadgeSchema = mongoose.Schema({
    text: { type: String, required: true },
    icon: { type: String, required: true }, // Can be icon component name (e.g., "FaShippingFast") or image URL
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});

const TrustBadge = mongoose.model('TrustBadge', trustBadgeSchema);

module.exports = TrustBadge;
