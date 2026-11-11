const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OurVision = sequelize.define('OurVision', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        defaultValue: 'Our Vision',
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: 'Crafted with intention. We believe true luxury lies in the purity of ingredients and the efficacy of nature.',
    },
    // Pillar / Item 1
    item1Title: {
        type: DataTypes.STRING,
        defaultValue: 'Clean Ingredients',
    },
    item1Description: {
        type: DataTypes.TEXT,
        defaultValue: 'Formulated without harmful toxins, sulfates, or parabens. Pure, safe, and effective.',
    },
    item1Icon: {
        type: DataTypes.STRING,
        defaultValue: 'sparkles',
    },
    // Pillar / Item 2
    item2Title: {
        type: DataTypes.STRING,
        defaultValue: 'Cruelty-Free',
    },
    item2Description: {
        type: DataTypes.TEXT,
        defaultValue: 'Never tested on animals. We are committed to ethical beauty that respects all life.',
    },
    item2Icon: {
        type: DataTypes.STRING,
        defaultValue: 'heart',
    },
    // Pillar / Item 3
    item3Title: {
        type: DataTypes.STRING,
        defaultValue: 'Dermatologist Tested',
    },
    item3Description: {
        type: DataTypes.TEXT,
        defaultValue: 'Rigorously tested to ensure optimal safety and performance for even the most sensitive skin.',
    },
    item3Icon: {
        type: DataTypes.STRING,
        defaultValue: 'shield',
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
OurVision.getSingleton = async function () {
    try {
        await this.sync();
    } catch (_) {}
    const doc = await this.findOne();
    if (doc) return doc;
    return await this.create({});
};

OurVision.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    return values;
};

module.exports = OurVision;

