const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MegaMenu = sequelize.define('MegaMenu', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    menuId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    categories: {
        type: DataTypes.JSONB,
        defaultValue: [],
    },
    featured: {
        type: DataTypes.JSONB,
        defaultValue: {},
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

MegaMenu.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    return values;
};

module.exports = MegaMenu;
