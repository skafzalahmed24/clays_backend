const mongoose = require('mongoose');

const heritageSchema = mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true }, // e.g., "since 1985"
    description: { type: String, required: true },
    image: { type: String, required: true }, // URL path
    link: { type: String, default: '/about' },
    linkText: { type: String, default: 'Read Our Story' },
}, {
    timestamps: true,
});

// Optimization: Ensure there is only one Heritage document
heritageSchema.statics.getSingleton = async function () {
    const doc = await this.findOne();
    if (doc) return doc;
    // Default initial content
    return await this.create({
        title: "Mastery in Every Cut",
        subtitle: "Since 1985",
        description: "Our heritage is built on a foundation of uncompromised quality and artistic vision. Every piece of propert jewelry tells a story of tradition, passion, and the pursuit of perfection.",
        image: "/uploads/story.png", // specific placeholder or ensure frontend handles missing
        link: "/about"
    });
};

const Heritage = mongoose.model('Heritage', heritageSchema);

module.exports = Heritage;
