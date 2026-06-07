const User = require('../models/User');
const { generateAccessToken } = require('../utils/generateToken');
const { successResponse } = require('../utils/responseHelper');

// @desc    Get user cart
// @route   GET /api/users/cart
// @access  Private
const getCart = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('cart.product');
        successResponse(res, user.cart);
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
        const user = await User.findById(req.user._id);
        
        // Check if item already exists in cart
        const itemIndex = user.cart.findIndex(item => item.product && item.product.toString() === productId);

        if (itemIndex > -1) {
            // Update quantity
            user.cart[itemIndex].qty += Number(qty) || 1;
        } else {
            // Check if cart limit exceeded
            if (user.cart.length >= 50) {
                 return res.status(400).json({ message: 'Cart is full (limit: 50 items). Please remove items to add more.' });
            }
            // Add new item
            user.cart.push({ product: productId, qty: Number(qty) || 1 });
        }

        await user.save();
        
        // Return full cart with product details
        const updatedUser = await User.findById(req.user._id).populate('cart.product');
        successResponse(res, updatedUser.cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove from cart
// @route   DELETE /api/users/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        user.cart = user.cart.filter(item => item.product && item.product.toString() !== req.params.productId);
        
        await user.save();
        
        const updatedUser = await User.findById(req.user._id).populate('cart.product');
        successResponse(res, updatedUser.cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist');
        successResponse(res, user.wishlist);
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
        const user = await User.findById(req.user._id);
        
        // Check if already in wishlist (convert ObjectId to string for comparison)
        const isAlreadyAdded = user.wishlist.some(id => id.toString() === productId);

        if (!isAlreadyAdded) {
            // Check if wishlist limit exceeded
            if (user.wishlist.length >= 100) {
                return res.status(400).json({ message: 'Wishlist is full (limit: 100 items).' });
            }
            user.wishlist.push(productId);
            await user.save();
        }

        const updatedUser = await User.findById(req.user._id).populate('wishlist');
        successResponse(res, updatedUser.wishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        user.wishlist = user.wishlist.filter(id => id && id.toString() !== req.params.productId);
        
        await user.save();
        
        const updatedUser = await User.findById(req.user._id).populate('wishlist');
        successResponse(res, updatedUser.wishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            successResponse(res, {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                isAdmin: updatedUser.isAdmin,
                token: generateAccessToken(updatedUser._id),
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
        const user = await User.findById(req.params.id).select('-password');
        
        if (user) {
            // Also fetch basic order stats
             const orders = await require('../models/Order').find({ user: user._id }).sort({ createdAt: -1 });
             
             const totalOrders = orders.length;
             const totalSpent = orders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);

            successResponse(res, {
                ...user.toObject(),
                orders: orders,
                totalOrders,
                totalSpent
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

        const keyword = req.query.search
            ? {
                $or: [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { email: { $regex: req.query.search, $options: 'i' } },
                    { 'addresses.phone': { $regex: req.query.search, $options: 'i' } },
                ],
            }
            : {};

        // 1. Get total count first (for pagination)
        const total = await User.countDocuments({ ...keyword });

        // 2. Aggregation Pipeline
        const users = await User.aggregate([
            { $match: { ...keyword } }, // Apply search filter
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'orders'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    isAdmin: 1,
                    createdAt: 1,
                    totalOrders: { $size: '$orders' },
                    totalSpent: { $sum: '$orders.totalPrice' }
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        successResponse(res, {
            users,
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
        const user = await User.findById(req.user._id).select('addresses');
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
        const user = await User.findById(req.user._id);

        // If this is set as default, unset other default addresses
        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        // If this is the first address, make it default
        const makeDefault = user.addresses.length === 0 || isDefault;

        user.addresses.push({
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
        const user = await User.findById(req.user._id);
        const addressToUpdate = user.addresses.id(req.params.addressId);

        if (!addressToUpdate) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // If setting this as default, unset others
        if (isDefault && !addressToUpdate.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        // Update fields
        if (firstName) addressToUpdate.firstName = firstName;
        if (lastName) addressToUpdate.lastName = lastName;
        if (email) addressToUpdate.email = email;
        if (phone) addressToUpdate.phone = phone;
        if (address) addressToUpdate.address = address;
        if (apartment !== undefined) addressToUpdate.apartment = apartment;
        if (city) addressToUpdate.city = city;
        if (postalCode) addressToUpdate.postalCode = postalCode;
        if (isDefault !== undefined) addressToUpdate.isDefault = isDefault;

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
        const user = await User.findById(req.user._id);
        const addressToDelete = user.addresses.id(req.params.addressId);

        if (!addressToDelete) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const wasDefault = addressToDelete.isDefault;
        
        // Use pull() instead of remove()
        user.addresses.pull(req.params.addressId);

        // If deleted address was default and there are other addresses, make the first one default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

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
        const user = await User.findById(req.user._id);
        const addressToSetDefault = user.addresses.id(req.params.addressId);

        if (!addressToSetDefault) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Unset all defaults, then set this one
        user.addresses.forEach(addr => addr.isDefault = false);
        addressToSetDefault.isDefault = true;

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
