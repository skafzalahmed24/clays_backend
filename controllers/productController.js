const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { successResponse } = require('../utils/responseHelper');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    // 1. Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'keyword', 'category', 'collection', 'minPrice', 'maxPrice', 'isOnOffer'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Handle Price Range manually
    if (req.query.minPrice || req.query.maxPrice) {
        queryObj.price = {};
        if (req.query.minPrice) queryObj.price.gte = Number(req.query.minPrice);
        if (req.query.maxPrice) queryObj.price.lte = Number(req.query.maxPrice);
    }

    // Advanced filtering for price, etc.
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let mongooseQueryObj = JSON.parse(queryStr);

    // Handle isOnOffer (Discounted Products)
    if (req.query.isOnOffer === 'true') {
        // We need to filter where price < originalPrice
        // reliable way in Mongo is $expr
        mongooseQueryObj = {
            ...mongooseQueryObj,
            originalPrice: { $exists: true, $ne: null }, // ensure originalPrice exists
            $expr: { $lt: ["$price", "$originalPrice"] }
        };
    }

    let query = Product.find(mongooseQueryObj);

    // Helper for multi-value filtering
    const addFilter = (field, value) => {
        if (!value) return;
        
        let values = [];
        if (Array.isArray(value)) {
            values = value;
        } else {
            // Handle comma-separated string (e.g. from basic search params)
            values = value.split(',').map(v => v.trim());
        }

        if (values.length > 0) {
            query = query.find({
                [field]: { $in: values.map(v => new RegExp(`^${v}$`, 'i')) }
            });
        }
    };

    addFilter('category', req.query.category);
    addFilter('subCategory', req.query.subCategory); // Add subCategory support
    addFilter('collection', req.query.collection);
    addFilter('attributes.color', req.query['attributes.color']);
    addFilter('attributes.material', req.query['attributes.material']);
    addFilter('attributes.occasion', req.query['attributes.occasion']);

    // Search (Keyword)
    if (req.query.search || req.query.keyword) {
        const keyword = req.query.search || req.query.keyword;
        const searchRegex = { $regex: keyword, $options: 'i' };
        query = query.find({
            $or: [{ name: searchRegex }, { description: searchRegex }],
        });
    }

    // 2. Sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt'); // Default sort by newest
    }

    // 3. Field Limiting
    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        query = query.select(fields);
    } else {
        query = query.select('-__v');
    }

    // 4. Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    // Execution
    const products = await query;
    
    // Get total count for pagination metadata
    // We need to replicate the count query with same filters but without pagination
    const countQueryObj = { ...JSON.parse(queryStr) };
    let countQuery = Product.countDocuments(countQueryObj);
    
    // Add back the regex filters for count query
    if (req.query.category) {
        countQuery = countQuery.find({ 
            category: { $regex: new RegExp(`^${req.query.category}$`, 'i') } 
        });
    }
    if (req.query.collection) {
        countQuery = countQuery.find({ 
            collection: { $regex: new RegExp(`^${req.query.collection}$`, 'i') } 
        });
    }

    if (req.query.search || req.query.keyword) {
        const keyword = req.query.search || req.query.keyword;
        const searchRegex = { $regex: keyword, $options: 'i' };
        countQuery = countQuery.find({
            $or: [{ name: searchRegex }, { description: searchRegex }],
        });
    }
    const total = await countQuery;

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
    const product = await Product.findById(req.params.id);

    if (product) {
        let productData = product.toObject();

        if (req.user && req.user._id) {
            // Check cart status
            const user = await User.findById(req.user._id).select('cart');
            
            if (user && user.cart) {
                const cartItem = user.cart.find(item => 
                    item.product.toString() === product._id.toString()
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
                user: req.user._id,
                'orderItems.product': product._id,
                status: 'Delivered'
            });

            productData.hasPurchased = !!order;

            // Check if user has already reviewed
            const userReview = product.reviews.find(
                (r) => r.user.toString() === req.user._id.toString()
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
    // Assign the logged-in user (Admin or User) to the user field
    // Mongoose will store the ObjectId regardless of whether it refers to 'User' or 'Admin' collection
    req.body.user = req.user._id;
    
    const product = await Product.create(req.body);
    res.status(201).json(product);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json(updatedProduct);
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    await product.deleteOne();

    res.status(200).json({ id: req.params.id, message: 'Product removed' });
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body || {};

    const product = await Product.findById(req.params.id);

    if (product) {
        const alreadyReviewed = product.reviews.find(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            res.status(400);
            throw new Error('Product already reviewed');
        }

        // Verify purchase
        const order = await Order.findOne({
            user: req.user._id,
            'orderItems.product': product._id,
            status: 'Delivered'
        });

        if (!order) {
            res.status(400);
            throw new Error('You must purchase and receive this item to review it');
        }

        // Additional check if body was missing but middleware passed (should not happen)
        if (!rating || !comment) {
             res.status(400);
             throw new Error('Rating and comment are required');
        }

        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
        };

        product.reviews.push(review);

        product.numReviews = product.reviews.length;

        product.rating =
            product.reviews.reduce((acc, item) => item.rating + acc, 0) /
            product.reviews.length;

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
    const product = await Product.findById(req.params.id);

    if (product) {
        const review = product.reviews.find(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (review) {
             if (!rating || !comment) {
                 res.status(400);
                 throw new Error('Rating and comment are required');
            }
            review.rating = Number(rating);
            review.comment = comment;

            product.rating =
                product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                product.reviews.length;

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
