const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    reviews: {
        type: DataTypes.JSONB,
        defaultValue: [],
    },
    rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
    },
    numReviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    originalPrice: {
        type: DataTypes.FLOAT,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    subCategory: {
        type: DataTypes.STRING,
    },
    img: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    images: {
        type: DataTypes.JSONB,
        defaultValue: [],
    },
    sku: {
        type: DataTypes.STRING,
    },
    tags: {
        type: DataTypes.JSONB,
        defaultValue: [],
    },
    dimensions: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },
    weight: {
        type: DataTypes.FLOAT,
    },
    meta: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    inStock: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    attributes: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },
    isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    isNewArrival: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
Product.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    values.user = values.userId; // Alias user to userId for MongoDB query compatibility
    return values;
};

module.exports = Product;
