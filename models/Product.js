const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const productSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: [true, 'Please add a product name'],
        },
        description: {
            type: String,
            required: [true, 'Please add a description'],
        },
        reviews: [reviewSchema],
        rating: {
            type: Number,
            required: true,
            default: 0,
        },
        numReviews: {
            type: Number,
            required: true,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, 'Please add a price'],
        },
        originalPrice: {
            type: Number,
        },
        category: {
            type: String,
            required: [true, 'Please add a category'],
        },
        subCategory: {
            type: String,
        },
        collection: {
            type: String,
        },
        img: {
            type: String, // Main image URL
            required: [true, 'Please add a main image'],
        },
        images: [String], // Array of additional image URLs
        sku: {
            type: String,
            // unique: true, // Removed to allow duplicates
        },
        tags: [String],
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
        },
        weight: Number, // In grams or kg
        meta: {
            title: String,
            description: String,
        },
        stock: {
            type: Number,
            default: 0,
        },
        inStock: {
            type: Boolean,
            default: true,
        },
        attributes: {
            material: String,
            gemType: String,
            color: String,
            size: String,
            occasion: String,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isNewArrival: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Product', productSchema);
