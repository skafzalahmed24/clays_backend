const Joi = require('joi');

const createProductSchema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().required(),
    description: Joi.string().required(),
    img: Joi.string().allow(''),
    category: Joi.string().required(),
    subCategory: Joi.string().allow(''),
    collection: Joi.string().allow(''),
    // brand: Joi.string().allow(''), 
    sku: Joi.string().allow('', null),
    tags: Joi.array().items(Joi.string()).allow(null),
    dimensions: Joi.object({
        length: Joi.number().allow('', null),
        width: Joi.number().allow('', null),
        height: Joi.number().allow('', null),
    }).allow(null),
    weight: Joi.number().allow('', null),
    meta: Joi.object({
        title: Joi.string().allow(''),
        description: Joi.string().allow(''),
    }).allow(null),

    stock: Joi.number().allow('', null),
    inStock: Joi.boolean(),
    originalPrice: Joi.number().allow('', null),

    isFeatured: Joi.boolean(),
    isNew: Joi.boolean(),
    isNewArrival: Joi.boolean(), // Keep isNewArrival for backward compat if needed, or remove? Plan said "isNew". Let's stick to "isNew" and maybe "isNewArrival" was a draft/typo in previous view? Ah, view showed isNewArrival in line 30. I'll add isNew and keep isNewArrival just in case, or replace it if it was unused. Let's just add isNew for now to be safe with Plan.
    
    // Attributes
    color: Joi.string().allow(''),
    material: Joi.string().allow(''),
    occasion: Joi.string().allow(''),
    
    images: Joi.array().items(Joi.string()).allow(null),
});

const updateProductSchema = Joi.object({
    name: Joi.string(),
    price: Joi.number(),
    description: Joi.string(),
    img: Joi.string().allow(''),
    category: Joi.string(),
    subCategory: Joi.string().allow(''),
    collection: Joi.string().allow(''),
    // brand: Joi.string(),
    sku: Joi.string().allow('', null),
    tags: Joi.array().items(Joi.string()).allow(null),
    dimensions: Joi.object({
        length: Joi.number().allow('', null),
        width: Joi.number().allow('', null),
        height: Joi.number().allow('', null),
    }).allow(null),
    weight: Joi.number().allow('', null),
    meta: Joi.object({
        title: Joi.string().allow(''),
        description: Joi.string().allow(''),
    }).allow(null),
    
    stock: Joi.number().allow('', null),
    inStock: Joi.boolean(),
    originalPrice: Joi.number().allow('', null),

    isFeatured: Joi.boolean(),
    isNewArrival: Joi.boolean(),
    
    color: Joi.string().allow(''),
    material: Joi.string().allow(''),
    occasion: Joi.string().allow(''),
    
    images: Joi.array().items(Joi.string()).allow(null),
});

const reviewSchema = Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().required(),
});

module.exports = {
    createProductSchema,
    updateProductSchema,
    reviewSchema,
};
