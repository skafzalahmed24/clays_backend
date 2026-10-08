const Joi = require('joi');

// Indian phone regex: Accepts 10 digits starting with 6-9, or prefixed with +91 / 91 / 0
const indianPhoneRegex = /^(\+91[\s-]?)?[6-9]\d{9}$|^91[6-9]\d{9}$|^0[6-9]\d{9}$/;

const registerSchema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string()
        .pattern(indianPhoneRegex)
        .optional()
        .messages({
            'string.pattern.base': 'Phone number must be a valid Indian mobile number (+91) with 10 digits starting with 6, 7, 8, or 9'
        })
});

const loginSchema = Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(indianPhoneRegex).optional(),
    password: Joi.string().required(),
}).or('email', 'phone').messages({
    'object.missing': 'Please provide either email or phone number to login'
});

const sendOtpSchema = Joi.object({
    phone: Joi.string().pattern(indianPhoneRegex).optional(),
    email: Joi.string().email().optional(),
    type: Joi.string().valid('verification', 'login', 'reset').default('verification')
}).or('phone', 'email').messages({
    'object.missing': 'Please provide either a phone number (+91) or email address'
});

const verifyOtpSchema = Joi.object({
    otp: Joi.string().min(4).max(6).required().messages({
        'string.empty': 'OTP code is required',
        'any.required': 'OTP code is required'
    }),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(indianPhoneRegex).optional(),
}).or('email', 'phone').messages({
    'object.missing': 'Please provide either email or phone number along with OTP'
});

const resendOtpSchema = Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(indianPhoneRegex).optional(),
}).or('email', 'phone').messages({
    'object.missing': 'Please provide either email or phone number to resend OTP'
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(indianPhoneRegex).optional(),
}).or('email', 'phone').messages({
    'object.missing': 'Please provide either email or phone number'
});

const resetPasswordSchema = Joi.object({
    otp: Joi.string().min(4).max(6).required(),
    password: Joi.string().min(6).required(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(indianPhoneRegex).optional(),
}).or('email', 'phone').messages({
    'object.missing': 'Please provide either email or phone number'
});

module.exports = {
    registerSchema,
    loginSchema,
    sendOtpSchema,
    verifyOtpSchema,
    resendOtpSchema,
    forgotPasswordSchema,
    resetPasswordSchema
};
