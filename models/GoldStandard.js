const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GoldStandard = sequelize.define('GoldStandard', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        defaultValue: 'The Gold Standard',
    },
    subtitle: {
        type: DataTypes.STRING,
        defaultValue: '',
    },
    description: {
        type: DataTypes.TEXT,
        defaultValue: 'Experience the pinnacle of luxury skincare. Our signature serum is infused with pure 24k gold flakes, known since ancient times for its powerful anti-aging and illuminating properties.',
    },
    description2: {
        type: DataTypes.TEXT,
        defaultValue: 'Combined with ultra-hydrating hyaluronic acid and rare botanical extracts, it penetrates deep to restore your skin\'s natural elasticity, leaving you with an unmistakable, radiant glow.',
    },
    image: {
        type: DataTypes.STRING,
        defaultValue: '/assets/gold_standard.png',
    },
    link: {
        type: DataTypes.STRING,
        defaultValue: '/shop',
    },
    linkText: {
        type: DataTypes.STRING,
        defaultValue: 'Discover The Formula',
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
GoldStandard.getSingleton = async function () {
    try {
        await this.sync();
    } catch (_) {}
    let doc = await this.findOne();
    if (!doc) {
        doc = await this.create({
            title: 'The Gold Standard',
            subtitle: '',
            description: 'Experience the pinnacle of luxury skincare. Our signature serum is infused with pure 24k gold flakes, known since ancient times for its powerful anti-aging and illuminating properties.',
            description2: 'Combined with ultra-hydrating hyaluronic acid and rare botanical extracts, it penetrates deep to restore your skin\'s natural elasticity, leaving you with an unmistakable, radiant glow.',
            image: '/assets/gold_standard.png',
            link: '/shop',
            linkText: 'Discover The Formula'
        });
    }
    return doc;
};

GoldStandard.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    return values;
};

module.exports = GoldStandard;

