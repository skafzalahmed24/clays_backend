const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StockRequest = sequelize.define('StockRequest', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    productId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    productImg: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    pincode: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Pending',
        validate: {
            isIn: [['Pending', 'Notified']],
        },
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

StockRequest.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    return values;
};

// Safe idempotent self-migration to ensure phone and pincode columns exist in PostgreSQL
(async () => {
    try {
        await sequelize.query('ALTER TABLE "StockRequests" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(255);');
        await sequelize.query('ALTER TABLE "StockRequests" ADD COLUMN IF NOT EXISTS "pincode" VARCHAR(255);');
    } catch (err) {
        // Ignored if table does not exist yet before initial sync
    }
})();

module.exports = StockRequest;
