const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { successResponse } = require('../utils/responseHelper');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

const sanitizeProductData = (body) => {
    const data = { ...body };
    // Convert empty strings to null for top-level fields
    Object.keys(data).forEach(key => {
        if (data[key] === '') {
            data[key] = null;
        }
    });
    // Convert empty strings to null for dimensions nested fields
    if (data.dimensions && typeof data.dimensions === 'object') {
        const dimensions = { ...data.dimensions };
        Object.keys(dimensions).forEach(key => {
            if (dimensions[key] === '') {
                dimensions[key] = null;
            }
        });
        data.dimensions = dimensions;
    }
    // Convert empty strings to null for meta nested fields
    if (data.meta && typeof data.meta === 'object') {
        const meta = { ...data.meta };
        Object.keys(meta).forEach(key => {
            if (meta[key] === '') {
                meta[key] = null;
            }
        });
        data.meta = meta;
    }
    return data;
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const whereClause = {};

    // 1. Price Range Filtering
    if (req.query.minPrice || req.query.maxPrice) {
        whereClause.price = {};
        if (req.query.minPrice) whereClause.price[Op.gte] = Number(req.query.minPrice);
        if (req.query.maxPrice) whereClause.price[Op.lte] = Number(req.query.maxPrice);
    }

    // Handle isOnOffer (Discounted Products)
    if (req.query.isOnOffer === 'true') {
        whereClause.originalPrice = { [Op.ne]: null };
        whereClause[Op.and] = sequelize.literal('"price" < "originalPrice"');
    }

    // Helper for multi-value filtering
    const addFilter = (field, value) => {
        if (!value) return;
        
        const values = Array.isArray(value) ? value : value.split(',').map(v => v.trim());

        if (values.length > 0) {
            if (field.startsWith('attributes.')) {
                const attrKey = field.split('.')[1];
                const sqlValues = values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
                const literalStr = `LOWER("Product"."attributes"->>'${attrKey}') IN (${sqlValues.toLowerCase()})`;
                if (whereClause[Op.and]) {
                    whereClause[Op.and] = [whereClause[Op.and], sequelize.literal(literalStr)];
                } else {
                    whereClause[Op.and] = sequelize.literal(literalStr);
                }
            } else {
                whereClause[field] = {
                    [Op.in]: values
                };
            }
        }
    };

    addFilter('category', req.query.category);
    addFilter('subCategory', req.query.subCategory);
    addFilter('attributes.color', req.query['attributes.color']);
    addFilter('attributes.material', req.query['attributes.material']);
    addFilter('attributes.occasion', req.query['attributes.occasion']);

    // Search (Keyword)
    if (req.query.search || req.query.keyword) {
        const keyword = req.query.search || req.query.keyword;
        whereClause[Op.or] = [
            { name: { [Op.iLike]: `%${keyword}%` } },
            { description: { [Op.iLike]: `%${keyword}%` } }
        ];
    }

    // 2. Sorting
    let orderClause = [['createdAt', 'DESC']];
    if (req.query.sort) {
        orderClause = req.query.sort.split(',').map(s => {
            if (s.startsWith('-')) {
                return [s.substring(1), 'DESC'];
            }
            return [s, 'ASC'];
        });
    }

    // 3. Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Execution
    const products = await Product.findAll({
        where: whereClause,
        order: orderClause,
        limit: limit,
        offset: skip
    });
    
    // Get total count for pagination metadata
    const total = await Product.count({ where: whereClause });

    successResponse(res, {
        products,
        page,
        pages: Math.ceil(total / limit),
        total,
    });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findByPk(req.params.id);

    if (product) {
        let productData = product.toJSON();

        if (req.user && req.user.id) {
            // Check cart status
            const user = await User.findByPk(req.user.id);
            
            if (user && user.cart) {
                const cartItem = user.cart.find(item => 
                    item.product && item.product.toString() === product.id.toString()
                );

                if (cartItem) {
                    productData.isInCart = true;
                    productData.cartQty = cartItem.qty;
                } else {
                    productData.isInCart = false;
                    productData.cartQty = 0;
                }
            }

            // Check if user has purchased this product (Delivered status)
            const order = await Order.findOne({
                where: {
                    userId: req.user.id,
                    status: 'Delivered',
                    [Op.and]: sequelize.literal(`"orderItems" @> '[{"product": "${product.id}"}]'::jsonb`)
                }
            });

            productData.hasPurchased = !!order;

            // Check if user has already reviewed
            const reviews = product.reviews || [];
            const userReview = reviews.find(
                (r) => r.user && r.user.toString() === req.user.id.toString()
            );
            productData.userReview = userReview || null;
        }

        successResponse(res, productData);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    req.body.userId = req.user.id;
    const sanitizedData = sanitizeProductData(req.body);
    console.log('CREATE PRODUCT SANITIZED DATA:', JSON.stringify(sanitizedData, null, 2));
    try {
        const product = await Product.create(sanitizedData);
        res.status(201).json(product);
    } catch (error) {
        console.error('CREATE PRODUCT ERROR ENCOUNTERED:', error);
        res.status(400);
        throw error;
    }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    const sanitizedData = sanitizeProductData(req.body);
    await Product.update(sanitizedData, { where: { id: req.params.id } });
    const updatedProduct = await Product.findByPk(req.params.id);

    res.status(200).json(updatedProduct);
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    await product.destroy();

    res.status(200).json({ id: req.params.id, message: 'Product removed' });
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body || {};

    const product = await Product.findByPk(req.params.id);

    if (product) {
        const reviews = product.reviews || [];
        const alreadyReviewed = reviews.find(
            (r) => r.user && r.user.toString() === req.user.id.toString()
        );

        if (alreadyReviewed) {
            res.status(400);
            throw new Error('Product already reviewed');
        }

        // Verify purchase
        const order = await Order.findOne({
            where: {
                userId: req.user.id,
                status: 'Delivered',
                [Op.and]: sequelize.literal(`"orderItems" @> '[{"product": "${product.id}"}]'::jsonb`)
            }
        });

        if (!order) {
            res.status(400);
            throw new Error('You must purchase and receive this item to review it');
        }

        if (!rating || !comment) {
             res.status(400);
             throw new Error('Rating and comment are required');
        }

        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user.id,
            createdAt: new Date().toISOString(),
        };

        const updatedReviews = [...reviews, review];

        product.reviews = updatedReviews;
        product.numReviews = updatedReviews.length;
        product.rating = updatedReviews.reduce((acc, item) => item.rating + acc, 0) / updatedReviews.length;

        // Since product.reviews is a JSONB field, we save it
        await product.save();
        res.status(201).json({ message: 'Review added' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Update product review
// @route   PUT /api/products/:id/reviews
// @access  Private
const updateProductReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body || {};
    const product = await Product.findByPk(req.params.id);

    if (product) {
        const reviews = product.reviews || [];
        const reviewIndex = reviews.findIndex(
            (r) => r.user && r.user.toString() === req.user.id.toString()
        );

        if (reviewIndex !== -1) {
             if (!rating || !comment) {
                 res.status(400);
                 throw new Error('Rating and comment are required');
            }
            
            reviews[reviewIndex].rating = Number(rating);
            reviews[reviewIndex].comment = comment;
            reviews[reviewIndex].updatedAt = new Date().toISOString();

            product.reviews = [...reviews]; // Trigger update
            product.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

            await product.save();
            res.status(200).json({ message: 'Review updated' });
        } else {
            res.status(404);
            throw new Error('Review not found');
        }
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    createProductReview,
    updateProductReview,
};
