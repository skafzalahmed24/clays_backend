const Joi = require('joi');
const { validateAndFormatIndianMobile } = require('../utils/msg91Service');

// Validator function that enforces Indian mobile (+91 strictly) and normalizes input
const indianPhoneValidator = (value, helpers) => {
    if (!value || typeof value !== 'string' || value.trim() === '') {
        return helpers.message('Mobile number (+91) is required');
    }
    const val = validateAndFormatIndianMobile(value);
    if (!val.isValid) {
        return helpers.message(val.error || 'Only Indian mobile numbers (+91) with 10 digits starting with 6, 7, 8, or 9 are accepted');
    }
    return val.formattedNumber;
};

const registerSchema = Joi.object({
    name: Joi.string().min(2).required().messages({
        'string.empty': 'Full name is required',
        'any.required': 'Full name is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.empty': 'Password is required (minimum 6 characters)',
        'any.required': 'Password is required'
    }),
    phone: Joi.string()
        .custom(indianPhoneValidator)
        .required()
        .messages({
            'string.empty': 'Mobile number is required',
            'any.required': 'Mobile number is required'
        }),
    email: Joi.string().trim().email().allow('', null).optional()
});

const loginSchema = Joi.object({
    phone: Joi.string()
        .custom(indianPhoneValidator)
        .required()
        .messages({
            'string.empty': 'Mobile number is required',
            'any.required': 'Mobile number is required'
        }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
    })
});

const sendOtpSchema = Joi.object({
    phone: Joi.string()
        .custom(indianPhoneValidator)
        .required()
        .messages({
            'string.empty': 'Mobile number is required',
            'any.required': 'Mobile number is required'
        }),
    type: Joi.string().valid('verification', 'login', 'reset').default('verification')
});

const verifyOtpSchema = Joi.object({
    otp: Joi.string().trim().min(4).max(6).required().messages({
        'string.empty': 'OTP code is required',
        'any.required': 'OTP code is required'
    }),
    phone: Joi.string()
        .custom(indianPhoneValidator)
        .required()
        .messages({
            'string.empty': 'Mobile number is required',
            'any.required': 'Mobile number is required'
        })
});

const resendOtpSchema = Joi.object({
    phone: Joi.string()
        .custom(indianPhoneValidator)
        .required()
        .messages({
            'string.empty': 'Mobile number is required',
            'any.required': 'Mobile number is required'
        })
});

const forgotPasswordSchema = Joi.object({
    phone: Joi.string()
        .custom(indianPhoneValidator)
        .required()
        .messages({
            'string.empty': 'Mobile number is required',
            'any.required': 'Mobile number is required'
        })
});

const resetPasswordSchema = Joi.object({
    otp: Joi.string().min(4).max(6).required().messages({
        'string.empty': 'OTP code is required',
        'any.required': 'OTP code is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.empty': 'New password is required (minimum 6 characters)',
        'any.required': 'New password is required'
    }),
    phone: Joi.string()
        .custom(indianPhoneValidator)
        .required()
        .messages({
            'string.empty': 'Mobile number is required',
            'any.required': 'Mobile number is required'
        })
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
