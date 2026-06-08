const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Coupon = sequelize.define('Coupon', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'percentage',
        validate: {
            isIn: [['percentage', 'fixed']],
        },
    },
    value: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    minOrderAmount: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    usageLimit: {
        type: DataTypes.INTEGER,
        defaultValue: null,
    },
    usedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    _id: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.id;
        },
    },
}, {
    timestamps: true,
    hooks: {
        beforeSave: (coupon) => {
            if (coupon.code) {
                coupon.code = coupon.code.toUpperCase().trim();
            }
        },
    },
});

Coupon.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    return values;
};

module.exports = Coupon;
