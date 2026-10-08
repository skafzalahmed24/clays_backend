const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const User = require('../models/User');

const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { successResponse } = require('../utils/responseHelper');
const { sendEmail } = require('../utils/emailService');
const {
    validateAndFormatIndianMobile,
    sendMsg91Otp,
    verifyMsg91Otp
} = require('../utils/msg91Service');
const {
    generateOTP,
    isDynamicOtp,
    isOtpValid,
    getStaticOtp
} = require('../utils/otpHelper');

// Helper to locate user by email or Indian mobile number
const findUserByEmailOrPhone = async ({ email, phone }) => {
    const conditions = [];

    if (email) {
        conditions.push({ email: email.toLowerCase() });
    }

    if (phone) {
        const phoneValidation = validateAndFormatIndianMobile(phone);
        if (phoneValidation.isValid) {
            conditions.push({ phone: phoneValidation.formattedNumber });
            conditions.push({ phone: phoneValidation.internationalNumber });
            conditions.push({ phone: phoneValidation.rawDigits });
        }
    }

    if (conditions.length === 0) return null;

    return await User.findOne({
        where: {
            [Op.or]: conditions
        }
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please add all required fields (name, email, password)');
    }

    // Validate Indian phone number if provided
    let normalizedPhone = null;
    let formattedPhone = null;
    if (phone) {
        const phoneValidation = validateAndFormatIndianMobile(phone);
        if (!phoneValidation.isValid) {
            res.status(400);
            throw new Error(phoneValidation.error);
        }
        normalizedPhone = phoneValidation.internationalNumber; // e.g. 919876543210
        formattedPhone = phoneValidation.formattedNumber;       // e.g. +91 98765 43210
    }

    // Check if user exists with this email or phone
    const existingUser = await findUserByEmailOrPhone({ email, phone });
    if (existingUser) {
        res.status(400);
        throw new Error('User with this email or phone number already exists');
    }

    // Generate 6-digit OTP (static 123456 if OTP_STATUS=false, dynamic if OTP_STATUS=true)
    const otp = generateOTP();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        phone: formattedPhone || normalizedPhone || null,
        otp,
        otpExpire,
        isVerified: false
    });

    if (user) {
        let sentSms = false;
        let sentEmail = false;

        if (isDynamicOtp()) {
            // 1. Send OTP to Indian Mobile via MSG91 (if phone provided)
            if (normalizedPhone) {
                try {
                    await sendMsg91Otp({
                        phone: normalizedPhone,
                        otp,
                        otpExpiry: 10,
                        otpLength: 6
                    });
                    sentSms = true;
                } catch (smsError) {
                    console.warn('[Register MSG91 Error]:', smsError.message);
                }
            }

            // 2. Send OTP to Email
            try {
                const message = `Your confirmation code is: ${otp}\n\nThis code will expire in 10 minutes.`;
                await sendEmail({
                    email: user.email,
                    subject: 'Clarysays - Account Verification',
                    message
                });
                sentEmail = true;
            } catch (emailError) {
                console.warn('[Register Email Error]:', emailError.message);
            }
        } else {
            console.log(`[Register OTP - STATIC MODE] OTP_STATUS is false. Static OTP: ${otp}`);
        }

        let message = 'Registered successfully. Please check your email/SMS for verification code.';
        if (!isDynamicOtp()) {
            message = `Registered successfully. Static OTP for testing: ${otp}`;
        } else if (!sentEmail && !sentSms && process.env.NODE_ENV === 'development') {
            message = `Registered successfully. Dev OTP: ${otp}`;
        }

        successResponse(res, {
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isVerified: false
        }, message, 201);
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, phone, password } = req.body;

    const user = await findUserByEmailOrPhone({ email, phone });

    if (user && (await user.matchPassword(password))) {
        if (!user.isVerified) {
            const otp = generateOTP();
            user.otp = otp;
            user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
            await user.save();

            if (isDynamicOtp()) {
                // Send via MSG91 if phone exists
                if (user.phone) {
                    try {
                        await sendMsg91Otp({
                            phone: user.phone,
                            otp,
                            otpExpiry: 10,
                            otpLength: 6
                        });
                    } catch (smsErr) {
                        console.warn('[Login MSG91 Warning]:', smsErr.message);
                    }
                }

                // Send via Email
                try {
                    const message = `Your confirmation code is: ${otp}\n\nThis code will expire in 10 minutes.`;
                    await sendEmail({
                        email: user.email,
                        subject: 'Clarysays - Account Verification',
                        message
                    });
                } catch (emailErr) {
                    console.warn('[Login Email Warning]:', emailErr.message);
                }
            } else {
                console.log(`[Login OTP - STATIC MODE] OTP_STATUS is false. Static OTP: ${otp}`);
            }

            let loginMsg = 'Please verify your account first. A new OTP has been sent.';
            if (!isDynamicOtp()) {
                loginMsg = `Please verify your account first. Static OTP for testing: ${otp}`;
            }

            res.status(401).json({
                status: 0,
                message: loginMsg,
                isVerified: false,
                email: user.email,
                phone: user.phone
            });
            return;
        }

        // Generate Refresh Token
        const refreshToken = generateRefreshToken(res, user.id);

        successResponse(res, {
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateAccessToken(user.id),
            refreshToken,
        });
    } else {
        res.status(400);
        throw new Error('Invalid credentials');
    }
});

// @desc    Send OTP to Indian mobile number or email
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = asyncHandler(async (req, res) => {
    const { phone, email } = req.body;

    if (!phone && !email) {
        res.status(400);
        throw new Error('Please provide either an Indian mobile number (+91) or email address');
    }

    const otp = generateOTP();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    let user = await findUserByEmailOrPhone({ email, phone });
    if (user) {
        user.otp = otp;
        user.otpExpire = otpExpire;
        await user.save();
    }

    let phoneSent = false;
    let emailSent = false;
    let formattedNumber = null;

    if (phone) {
        const phoneValidation = validateAndFormatIndianMobile(phone);
        if (!phoneValidation.isValid) {
            res.status(400);
            throw new Error(phoneValidation.error);
        }
        formattedNumber = phoneValidation.formattedNumber;

        if (isDynamicOtp()) {
            await sendMsg91Otp({
                phone: phoneValidation.internationalNumber,
                otp,
                otpExpiry: 10,
                otpLength: 6
            });
            phoneSent = true;
        }
    }

    if (email && isDynamicOtp()) {
        await sendEmail({
            email,
            subject: 'Clarysays - One-Time Password (OTP)',
            message: `Your verification code is: ${otp}\n\nThis code is valid for 10 minutes.`
        });
        emailSent = true;
    }

    let successMsg = `OTP sent successfully${phoneSent ? ` to ${formattedNumber}` : ''}${emailSent ? ' to your email' : ''}`;
    if (!isDynamicOtp()) {
        successMsg = `Static OTP active: ${otp}`;
    }

    successResponse(res, {
        phone: formattedNumber,
        email: email || (user ? user.email : null)
    }, successMsg);
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
    const { email, phone, otp } = req.body;

    if (!otp) {
        res.status(400);
        throw new Error('Please provide the OTP code');
    }

    const user = await findUserByEmailOrPhone({ email, phone });

    if (!user) {
        res.status(400);
        throw new Error('User not found');
    }

    if (user.isVerified) {
        res.status(400);
        throw new Error('User already verified');
    }

    // Verify OTP against stored OTP and expiration, or static OTP check if OTP_STATUS=false
    const isValid = isOtpValid(otp, user.otp, user.otpExpire);

    if (isValid) {
        user.isVerified = true;
        user.otp = null;
        user.otpExpire = null;
        await user.save();

        // Generate Refresh Token
        const refreshToken = generateRefreshToken(res, user.id);

        successResponse(res, {
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateAccessToken(user.id),
            refreshToken,
        }, "Account verified successfully");
        return;
    }

    // Try verifying via MSG91 API directly if dynamic mode and phone is available
    if (isDynamicOtp() && (phone || user.phone)) {
        try {
            const targetPhone = phone || user.phone;
            const msg91Result = await verifyMsg91Otp({ phone: targetPhone, otp });
            if (msg91Result.success) {
                user.isVerified = true;
                user.otp = null;
                user.otpExpire = null;
                await user.save();

                const refreshToken = generateRefreshToken(res, user.id);
                successResponse(res, {
                    _id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    token: generateAccessToken(user.id),
                    refreshToken,
                }, "Account verified successfully via mobile OTP");
                return;
            }
        } catch (msg91Err) {
            console.warn('[MSG91 Verify Fallback Error]:', msg91Err.message);
        }
    }

    res.status(400);
    throw new Error('Invalid or expired OTP');
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
    const { email, phone } = req.body;
    const user = await findUserByEmailOrPhone({ email, phone });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.isVerified) {
        res.status(400);
        throw new Error('User already verified');
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    let sent = false;

    if (isDynamicOtp()) {
        // Send via MSG91 if phone exists
        if (user.phone || phone) {
            try {
                const targetPhone = user.phone || phone;
                await sendMsg91Otp({
                    phone: targetPhone,
                    otp,
                    otpExpiry: 10,
                    otpLength: 6
                });
                sent = true;
            } catch (smsErr) {
                console.warn('[Resend MSG91 Warning]:', smsErr.message);
            }
        }

        // Send via Email
        if (user.email) {
            try {
                const message = `Your new confirmation code is: ${otp}\n\nThis code will expire in 10 minutes.`;
                await sendEmail({
                    email: user.email,
                    subject: 'Clarysays - Resend Verification Code',
                    message
                });
                sent = true;
            } catch (emailErr) {
                console.warn('[Resend Email Warning]:', emailErr.message);
            }
        }
    } else {
        console.log(`[Resend OTP - STATIC MODE] OTP_STATUS is false. Static OTP: ${otp}`);
        sent = true;
    }

    if (sent || process.env.NODE_ENV === 'development' || !isDynamicOtp()) {
        const resendMsg = !isDynamicOtp() ? `Static OTP active: ${otp}` : "OTP resent successfully";
        successResponse(res, null, resendMsg);
    } else {
        res.status(500);
        throw new Error('Failed to deliver OTP code');
    }
});

// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email, phone } = req.body;
    const user = await findUserByEmailOrPhone({ email, phone });

    if (!user) {
        res.status(404);
        throw new Error('User with this email or phone number not found');
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    let sent = false;

    if (isDynamicOtp()) {
        // Send OTP via MSG91 if phone exists
        if (user.phone || phone) {
            try {
                const targetPhone = user.phone || phone;
                await sendMsg91Otp({
                    phone: targetPhone,
                    otp,
                    otpExpiry: 10,
                    otpLength: 6
                });
                sent = true;
            } catch (smsErr) {
                console.warn('[Forgot Password MSG91 Warning]:', smsErr.message);
            }
        }

        // Send OTP via Email
        if (user.email) {
            try {
                const message = `Your password reset code is: ${otp}\n\nThis code will expire in 10 minutes.`;
                await sendEmail({
                    email: user.email,
                    subject: 'Clarysays - Password Reset Code',
                    message
                });
                sent = true;
            } catch (emailErr) {
                console.warn('[Forgot Password Email Warning]:', emailErr.message);
            }
        }
    } else {
        console.log(`[Forgot Password OTP - STATIC MODE] OTP_STATUS is false. Static OTP: ${otp}`);
        sent = true;
    }

    if (sent || process.env.NODE_ENV === 'development' || !isDynamicOtp()) {
        const forgotMsg = !isDynamicOtp() ? `Password reset OTP generated. Static OTP: ${otp}` : "Password reset OTP sent successfully";
        successResponse(res, null, forgotMsg);
    } else {
        user.otp = null;
        user.otpExpire = null;
        await user.save();
        res.status(500);
        throw new Error('Could not send reset OTP');
    }
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { email, phone, otp, password } = req.body;
    const user = await findUserByEmailOrPhone({ email, phone });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const isValid = isOtpValid(otp, user.otp, user.otpExpire);

    if (isValid) {
        user.password = password;
        user.otp = null;
        user.otpExpire = null;
        await user.save();

        successResponse(res, null, "Password reset successful. You can now login with your new password.");
    } else {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    successResponse(res, req.user);
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
    successResponse(res, null, 'Logged out successfully');
});

// @desc    Get new access token using refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        res.status(401);
        throw new Error('Not authorized, no refresh token');
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const accessToken = generateAccessToken(decoded.id);

        successResponse(res, { token: accessToken });
    } catch {
        res.status(401);
        throw new Error('Not authorized, token failed');
    }
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
    sendOTP,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    logoutUser,
    refreshToken
};
