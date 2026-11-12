const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DiscoverSection = sequelize.define('DiscoverSection', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    badge: {
        type: DataTypes.STRING,
        defaultValue: 'Elevate Your Ritual',
    },
    title: {
        type: DataTypes.STRING,
        defaultValue: 'Discover Your',
    },
    highlightText: {
        type: DataTypes.STRING,
        defaultValue: 'Ultimate Glow',
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: 'Curate a bespoke skincare routine tailored to your unique needs. Unveil skin that is visibly firmer, deeply hydrated, and luminous.',
    },
    link: {
        type: DataTypes.STRING,
        defaultValue: '/shop',
    },
    linkText: {
        type: DataTypes.STRING,
        defaultValue: 'Shop The Ritual',
    },
    _id: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.id;
        },
    },
}, {
    timestamps: true,
});

// Singleton helper static method
DiscoverSection.getSingleton = async function () {
    try {
        await this.sync();
    } catch (_) {}
    const doc = await this.findOne();
    if (doc) return doc;
    return await this.create({});
};

DiscoverSection.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    return values;
};

module.exports = DiscoverSection;

