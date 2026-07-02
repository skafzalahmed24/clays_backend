const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const HeroSlide = sequelize.define('HeroSlide', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    subtitle: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    media: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    link: {
        type: DataTypes.STRING,
        defaultValue: '/shop',
    },
    showButton: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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

HeroSlide.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    return values;
};

module.exports = HeroSlide;
