const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    orderNumber: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        unique: true,
    },
    orderItems: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    shippingAddress: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    paymentResult: {
        type: DataTypes.JSONB,
    },
    itemsPrice: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
    },
    taxPrice: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
    },
    shippingPrice: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
    },
    totalPrice: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
    },
    isPaid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    paidAt: {
        type: DataTypes.DATE,
    },
    isDelivered: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    deliveredAt: {
        type: DataTypes.DATE,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Pending',
    },
    cancelledAt: {
        type: DataTypes.DATE,
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

// Override toJSON to include _id and alias user to userId in API responses
Order.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    values.user = values.userId; // Alias user to userId for MongoDB query compatibility
    return values;
};

module.exports = Order;
