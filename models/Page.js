const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Page = sequelize.define('Page', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    modules: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },
    seo: {
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
    indexes: [
        {
            unique: true,
            fields: ['slug'],
        },
    ],
});

Page.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    return values;
};

module.exports = Page;
