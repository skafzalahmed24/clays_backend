const asyncHandler = require('express-async-handler');
const Attribute = require('../models/Attribute');

// @desc    Get all attributes
// @route   GET /api/attributes
// @access  Public
const getAttributes = asyncHandler(async (req, res) => {
    const attributes = await Attribute.find({});
    
    // Group by type for easier frontend consumption
    const grouped = attributes.reduce((acc, curr) => {
        if (!acc[curr.type]) {
            acc[curr.type] = [];
        }
        if (curr.type === 'colors') {
                acc[curr.type].push({ id: curr._id, name: curr.name, hex: curr.value });
        } else if (curr.type === 'categories') {
                acc[curr.type].push({ id: curr._id, name: curr.name, img: curr.img });
        } else if (curr.type === 'collections') {
                acc[curr.type].push({ id: curr._id, name: curr.name, description: curr.value, img: curr.img });
        } else {
                // For all other types (materials, occasions, subCategories), return object with ID
                acc[curr.type].push({ id: curr._id, name: curr.name, value: curr.value });
        }
        return acc;
    }, {});

    res.json(grouped);
});

// @desc    Add an attribute
// @route   POST /api/attributes
// @access  Private/Admin
const addAttribute = asyncHandler(async (req, res) => {
    const { type, name, value, img } = req.body;

    const attribute = await Attribute.create({
        type,
        name,
        value,
        img
    });
    res.status(201).json(attribute);
});

// @desc    Delete an attribute
// @route   DELETE /api/attributes/:id
// @access  Private/Admin
const deleteAttribute = asyncHandler(async (req, res) => {
    const attribute = await Attribute.findById(req.params.id);

    if (attribute) {
        await attribute.deleteOne();
        res.json({ message: 'Attribute removed' });
    } else {
        res.status(404);
        throw new Error('Attribute not found');
    }
});

// @desc    Update an attribute
// @route   PUT /api/attributes/:id
// @access  Private/Admin
const updateAttribute = asyncHandler(async (req, res) => {
    const attribute = await Attribute.findById(req.params.id);

    if (attribute) {
        attribute.name = req.body.name || attribute.name;
        attribute.value = req.body.value || attribute.value;
        attribute.img = req.body.img || attribute.img;
        
        const updatedAttribute = await attribute.save();
        res.json(updatedAttribute);
    } else {
        res.status(404);
        throw new Error('Attribute not found');
    }
});

module.exports = {
    getAttributes,
    addAttribute,
    deleteAttribute,
    updateAttribute,
};
