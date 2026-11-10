const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Heritage = sequelize.define('Heritage', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    subtitle: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    description2: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '',
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    link: {
        type: DataTypes.STRING,
        defaultValue: '/about',
    },
    linkText: {
        type: DataTypes.STRING,
        defaultValue: 'Read Our Story',
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
Heritage.getSingleton = async function () {
    try {
        await this.sync({ alter: false });
    } catch (_) {}
    const doc = await this.findOne();
    if (doc) return doc;
    return await this.create({
        title: "Mastery in Every Cut",
        subtitle: "Since 1985",
        description: "Our heritage is built on a foundation of uncompromised quality and artistic vision. Every piece of Clays jewelry tells a story of tradition, passion, and the pursuit of perfection.",
        description2: "Every gem is hand-selected, cut with mathematical precision, and set in responsibly sourced precious metals designed to endure for generations.",
        image: "/uploads/story.png",
        link: "/about",
        linkText: "Read Our Story"
    });
};

Heritage.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    return values;
};

module.exports = Heritage;
