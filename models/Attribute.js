const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Attribute = sequelize.define('Attribute', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    value: {
        type: DataTypes.STRING,
    },
    img: {
        type: DataTypes.STRING,
    },
    _id: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.id;
        },
    },
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['type', 'name'],
        },
    ],
});

Attribute.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    return values;
};

module.exports = Attribute;
