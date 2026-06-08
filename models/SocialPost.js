const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SocialPost = sequelize.define('SocialPost', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    media: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    platform: {
        type: DataTypes.STRING,
        defaultValue: 'Instagram',
    },
    link: {
        type: DataTypes.STRING,
        defaultValue: '#',
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

SocialPost.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    return values;
};

module.exports = SocialPost;
