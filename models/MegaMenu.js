const mongoose = require('mongoose');

const megaMenuSchema = mongoose.Schema({
    menuId: {
        type: String,
        required: true,
        unique: true,
        // Enum optional, but adhering to known keys is good practice:
        // 'New Arrivals', 'Earrings', 'Rings', 'Necklaces', 'Bracelets', 
        // 'Pendants', 'Wedding Collections', 'More Jewellery', 'Gifting', 'Diamond Jewellery'
    },
    categories: [{
        title: { type: String, required: true },
        items: [{ type: String }]
    }],
    featured: {
        title: { type: String },
        link: { type: String },
        img: { type: String }
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('MegaMenu', megaMenuSchema);
