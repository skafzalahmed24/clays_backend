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
    const doc = await this.findOne();
    if (doc) return doc;
    return await this.create({
        title: "Mastery in Every Cut",
        subtitle: "Since 1985",
        description: "Our heritage is built on a foundation of uncompromised quality and artistic vision. Every piece of propert jewelry tells a story of tradition, passion, and the pursuit of perfection.",
        image: "/uploads/story.png",
        link: "/about"
    });
};

Heritage.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    return values;
};

module.exports = Heritage;
