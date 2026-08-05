const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { generateAccessToken } = require('../utils/generateToken');
const { successResponse } = require('../utils/responseHelper');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const crypto = require('crypto');

// Helper to populate cart
const populateUserCart = async (user) => {
    if (!user) return [];
    const cart = user.cart || [];
    const productIds = cart.map(item => item.product).filter(Boolean);
    const products = await Product.findAll({ where: { id: productIds } });
    const productMap = new Map(products.map(p => [p.id, p]));
    
    return cart.map(item => ({
        product: productMap.get(item.product) || null,
        qty: item.qty
    })).filter(item => item.product !== null);
};

// Helper to populate wishlist
const populateUserWishlist = async (user) => {
    if (!user) return [];
    const wishlist = user.wishlist || [];
    
    // Filter out invalid UUIDs to prevent Sequelize crashing on Postgres
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validWishlistIds = wishlist.filter(id => typeof id === 'string' && uuidRegex.test(id));
    
    if (validWishlistIds.length === 0) return [];
    
    const products = await Product.findAll({ where: { id: validWishlistIds } });
    return products;
};

// @desc    Get user cart
// @route   GET /api/users/cart
// @access  Private
const getCart = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const populatedCart = await populateUserCart(user);
        successResponse(res, populatedCart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add to cart or update quantity
// @route   POST /api/users/cart
// @access  Private
const addToCart = async (req, res) => {
    const { productId, qty } = req.body;

    try {
        const user = await User.findByPk(req.user.id);
        const cart = user.cart || [];
        
        // Check if item already exists in cart
        const itemIndex = cart.findIndex(item => item.product && item.product.toString() === productId);

        if (itemIndex > -1) {
            cart[itemIndex].qty += Number(qty) || 1;
        } else {
            if (cart.length >= 50) {
                 return res.status(400).json({ message: 'Cart is full (limit: 50 items). Please remove items to add more.' });
            }
            cart.push({ product: productId, qty: Number(qty) || 1 });
        }

        user.cart = [...cart]; // Trigger Sequelize change detection
        user.changed('cart', true);
        await user.save();
        
        const populatedCart = await populateUserCart(user);
        successResponse(res, populatedCart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove from cart
// @route   DELETE /api/users/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const cart = user.cart || [];
        
        user.cart = cart.filter(item => item.product && item.product.toString() !== req.params.productId);
        user.changed('cart', true);
        await user.save();
        
        const populatedCart = await populateUserCart(user);
        successResponse(res, populatedCart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const populatedWishlist = await populateUserWishlist(user);
        successResponse(res, populatedWishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add to wishlist
// @route   POST /api/users/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
    const { productId } = req.body;

    try {
        const user = await User.findByPk(req.user.id);
        const wishlist = user.wishlist || [];
        
        const isAlreadyAdded = wishlist.some(id => id.toString() === productId);

        if (!isAlreadyAdded) {
            if (wishlist.length >= 100) {
                return res.status(400).json({ message: 'Wishlist is full (limit: 100 items).' });
            }
            wishlist.push(productId);
            user.wishlist = [...wishlist];
            user.changed('wishlist', true);
            await user.save();
        }

        const populatedWishlist = await populateUserWishlist(user);
        successResponse(res, populatedWishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const wishlist = user.wishlist || [];
        
        user.wishlist = wishlist.filter(id => id && id.toString() !== req.params.productId);
        user.changed('wishlist', true);
        await user.save();
        
        const populatedWishlist = await populateUserWishlist(user);
        successResponse(res, populatedWishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (user) {
            user.name = req.body.name || user.name;
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            successResponse(res, {
                _id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                isAdmin: updatedUser.role === 'admin',
                token: generateAccessToken(updatedUser.id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (user) {
             const orders = await Order.findAll({
                 where: { userId: user.id },
                 order: [['createdAt', 'DESC']]
             });
             
             const totalOrders = orders.length;
             const totalSpent = orders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);

            res.json({
                status: 1,
                message: 'success',
                data: {
                    ...user.toJSON(),
                    orders: orders,
                    totalOrders,
                    totalSpent
                }
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users with order stats
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const whereClause = {};
        if (req.query.search) {
            const searchVal = `%${req.query.search}%`;
            whereClause[Op.or] = [
                { name: { [Op.iLike]: searchVal } },
                { email: { [Op.iLike]: searchVal } },
                sequelize.literal(`CAST("User"."addresses" AS VARCHAR) ILIKE '${searchVal}'`)
            ];
        }

        const total = await User.count({ where: whereClause });

        const users = await User.findAll({
            where: whereClause,
            attributes: [
                'id',
                'name',
                'email',
                [sequelize.literal("CASE WHEN \"User\".\"role\" = 'admin' THEN true ELSE false END"), 'isAdmin'],
                'createdAt',
                [sequelize.literal('(SELECT COUNT(*) FROM "Orders" WHERE "Orders"."userId" = "User"."id")'), 'totalOrders'],
                [sequelize.literal('(SELECT COALESCE(SUM("Orders"."totalPrice"), 0) FROM "Orders" WHERE "Orders"."userId" = "User"."id")'), 'totalSpent']
            ],
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: skip,
            raw: true
        });

        const formattedUsers = users.map(u => ({
            _id: u.id,
            id: u.id,
            name: u.name,
            email: u.email,
            isAdmin: u.isAdmin,
            createdAt: u.createdAt,
            totalOrders: parseInt(u.totalOrders || 0),
            totalSpent: parseFloat(u.totalSpent || 0)
        }));

        successResponse(res, {
            users: formattedUsers,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user addresses
// @route   GET /api/users/addresses
// @access  Private
const getUserAddresses = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: ['addresses'] });
        successResponse(res, user.addresses || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add new address
// @route   POST /api/users/addresses
// @access  Private
const addUserAddress = async (req, res) => {
    const { firstName, lastName, email, phone, address, apartment, city, postalCode, isDefault } = req.body;

    try {
        const user = await User.findByPk(req.user.id);
        const addresses = user.addresses || [];

        if (isDefault) {
            addresses.forEach(addr => addr.isDefault = false);
        }

        const makeDefault = addresses.length === 0 || isDefault;
        const addressId = crypto.randomUUID();

        addresses.push({
            id: addressId,
            _id: addressId,
            firstName,
            lastName,
            email,
            phone,
            address,
            apartment,
            city,
            postalCode,
            isDefault: makeDefault
        });

        user.addresses = [...addresses];
        user.changed('addresses', true);
        await user.save();
        successResponse(res, user.addresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
const updateUserAddress = async (req, res) => {
    const { firstName, lastName, email, phone, address, apartment, city, postalCode, isDefault } = req.body;

    try {
        const user = await User.findByPk(req.user.id);
        const addresses = user.addresses || [];
        const addressToUpdate = addresses.find(addr => addr.id === req.params.addressId || addr._id === req.params.addressId);

        if (!addressToUpdate) {
            return res.status(404).json({ message: 'Address not found' });
        }

        if (isDefault && !addressToUpdate.isDefault) {
            addresses.forEach(addr => addr.isDefault = false);
        }

        if (firstName) addressToUpdate.firstName = firstName;
        if (lastName) addressToUpdate.lastName = lastName;
        if (email) addressToUpdate.email = email;
        if (phone) addressToUpdate.phone = phone;
        if (address) addressToUpdate.address = address;
        if (apartment !== undefined) addressToUpdate.apartment = apartment;
        if (city) addressToUpdate.city = city;
        if (postalCode) addressToUpdate.postalCode = postalCode;
        if (isDefault !== undefined) addressToUpdate.isDefault = isDefault;

        user.addresses = [...addresses];
        user.changed('addresses', true);
        await user.save();
        successResponse(res, user.addresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
const deleteUserAddress = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        let addresses = user.addresses || [];
        const addressToDelete = addresses.find(addr => addr.id === req.params.addressId || addr._id === req.params.addressId);

        if (!addressToDelete) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const wasDefault = addressToDelete.isDefault;
        
        addresses = addresses.filter(addr => addr.id !== req.params.addressId && addr._id !== req.params.addressId);

        if (wasDefault && addresses.length > 0) {
            addresses[0].isDefault = true;
        }

        user.addresses = [...addresses];
        user.changed('addresses', true);
        await user.save();
        successResponse(res, user.addresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Set default address
// @route   PUT /api/users/addresses/:addressId/default
// @access  Private
const setDefaultAddress = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const addresses = user.addresses || [];
        const addressToSetDefault = addresses.find(addr => addr.id === req.params.addressId || addr._id === req.params.addressId);

        if (!addressToSetDefault) {
            return res.status(404).json({ message: 'Address not found' });
        }

        addresses.forEach(addr => addr.isDefault = false);
        addressToSetDefault.isDefault = true;

        user.addresses = [...addresses];
        user.changed('addresses', true);
        await user.save();
        successResponse(res, user.addresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCart,
    addToCart,
    removeFromCart,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    updateUserProfile,
    getUsers,
    getUserAddresses,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultAddress,
    getUserById
};
