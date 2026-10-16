const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const User = require('../models/User');

const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { successResponse } = require('../utils/responseHelper');
const {
    validateAndFormatIndianMobile,
    sendMsg91Otp,
    verifyMsg91Otp
} = require('../utils/msg91Service');
const {
    generateOTP,
    isDynamicOtp,
    isOtpValid
} = require('../utils/otpHelper');

// Helper to locate user strictly by Indian mobile number
const findUserByPhone = async (phone) => {
    if (!phone || typeof phone !== 'string' || !phone.trim()) return null;
    const phoneValidation = validateAndFormatIndianMobile(phone);
    const conditions = [];
    if (phoneValidation.isValid) {
        conditions.push({ phone: phoneValidation.formattedNumber });
        conditions.push({ phone: phoneValidation.internationalNumber });
        conditions.push({ phone: phoneValidation.rawDigits });
        conditions.push({ phone: `+91${phoneValidation.rawDigits}` });
        conditions.push({ phone: `+91 ${phoneValidation.rawDigits}` });
    }
    conditions.push({ phone: String(phone).trim() });

    return await User.findOne({
        where: {
            [Op.or]: conditions
        }
    });
};

// @desc    Register new user (Phone number based)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, password, phone } = req.body;

    if (!name || !password || !phone) {
        res.status(400);
        throw new Error('Please add all required fields: name, mobile number (+91), and password');
    }

    // Validate Indian phone number (Strictly +91)
    const phoneValidation = validateAndFormatIndianMobile(phone);
    if (!phoneValidation.isValid) {
        res.status(400);
        throw new Error(phoneValidation.error || 'Only Indian mobile numbers with country code +91 are accepted');
    }
    const normalizedPhone = phoneValidation.internationalNumber; // e.g. 919876543210
    const formattedPhone = phoneValidation.formattedNumber;       // e.g. +91 98765 43210

    // Check if user exists with this phone number
    const existingUser = await findUserByPhone(phone);
    if (existingUser) {
        res.status(400);
        throw new Error('User with this mobile number already exists');
    }

    // Generate 6-digit OTP (static 123456 if OTP_STATUS=false, dynamic if OTP_STATUS=true)
    const otp = generateOTP();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user (email is null, phone is primary identity)
    const user = await User.create({
        name,
        email: null,
        password,
        phone: formattedPhone || normalizedPhone,
        otp,
        otpExpire,
        isVerified: false
    });

    if (user) {
        let sentSms = false;

        if (isDynamicOtp()) {
            // Send OTP ONLY to Indian Mobile via MSG91
            try {
                const sendResult = await sendMsg91Otp({
                    phone: normalizedPhone,
                    otp,
                    otpExpiry: 10,
                    otpLength: 6
                });
                console.log(`[Register MSG91 Success]: OTP sent to ${normalizedPhone}, msg: ${sendResult.message}`);
                sentSms = true;
            } catch (smsError) {
                console.error('[Register MSG91 Error]:', smsError.message);
            }
        } else {
            console.log(`[Register OTP - STATIC MODE] OTP_STATUS is false. Static OTP: ${otp}`);
        }

        let message = `Registered successfully. Verification code sent to your mobile number ${formattedPhone}.`;
        if (!isDynamicOtp()) {
            message = `Registered successfully. Static OTP for testing: ${otp}`;
        } else if (!sentSms && process.env.NODE_ENV === 'development') {
            message = `Registered successfully. Dev OTP: ${otp}`;
        }

        successResponse(res, {
            _id: user.id,
            name: user.name,
            phone: user.phone,
            isVerified: false
        }, message, 201);
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate user via mobile number & password
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        res.status(400);
        throw new Error('Please provide both mobile number and password');
    }

    const user = await findUserByPhone(phone);

    if (user && (await user.matchPassword(password))) {
        if (!user.isVerified) {
            const otp = generateOTP();
            user.otp = otp;
            user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
            await user.save();

            const phoneValidation = validateAndFormatIndianMobile(user.phone || phone);
            const targetPhone = phoneValidation.isValid ? phoneValidation.internationalNumber : (user.phone || phone);

            if (isDynamicOtp()) {
                try {
                    await sendMsg91Otp({
                        phone: targetPhone,
                        otp,
                        otpExpiry: 10,
                        otpLength: 6
                    });
                } catch (smsErr) {
                    console.warn('[Login MSG91 Warning]:', smsErr.message);
                }
            } else {
                console.log(`[Login OTP - STATIC MODE] OTP_STATUS is false. Static OTP: ${otp}`);
            }

            let loginMsg = `Please verify your account first. A verification OTP has been sent to your mobile number (${user.phone || phone}).`;
            if (!isDynamicOtp()) {
                loginMsg = `Please verify your account first. Static OTP for testing: ${otp}`;
            }

            res.status(401).json({
                status: 0,
                message: loginMsg,
                isVerified: false,
                phone: user.phone || phone
            });
            return;
        }

        // Generate Refresh Token
        const refreshToken = generateRefreshToken(res, user.id);

        successResponse(res, {
            _id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            token: generateAccessToken(user.id),
            refreshToken,
        });
    } else {
        res.status(400);
        throw new Error('Invalid mobile number or password');
    }
});

// @desc    Send OTP to Indian mobile number
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = asyncHandler(async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        res.status(400);
        throw new Error('Please provide an Indian mobile number (+91)');
    }

    const phoneValidation = validateAndFormatIndianMobile(phone);
    if (!phoneValidation.isValid) {
        res.status(400);
        throw new Error(phoneValidation.error || 'Invalid Indian mobile number');
    }

    const otp = generateOTP();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    let user = await findUserByPhone(phone);
    if (user) {
        user.otp = otp;
        user.otpExpire = otpExpire;
        await user.save();
    }

    if (isDynamicOtp()) {
        await sendMsg91Otp({
            phone: phoneValidation.internationalNumber,
            otp,
            otpExpiry: 10,
            otpLength: 6
        });
    }

    let successMsg = `OTP sent successfully to ${phoneValidation.formattedNumber}`;
    if (!isDynamicOtp()) {
        successMsg = `Static OTP active: ${otp}`;
    }

    successResponse(res, {
        phone: phoneValidation.formattedNumber
    }, successMsg);
});

// @desc    Verify OTP for mobile account
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
    const { phone, otp } = req.body;

    if (!otp) {
        res.status(400);
        throw new Error('Please provide the OTP code');
    }

    if (!phone) {
        res.status(400);
        throw new Error('Please provide your mobile number');
    }

    const user = await findUserByPhone(phone);

    if (!user) {
        res.status(400);
        throw new Error('User not found with this mobile number');
    }

    if (user.isVerified) {
        res.status(400);
        throw new Error('User already verified');
    }

    // Verify OTP against stored OTP and expiration
    const isValid = isOtpValid(otp, user.otp, user.otpExpire);

    if (isValid) {
        user.isVerified = true;
        user.otp = null;
        user.otpExpire = null;
        await user.save();

        const refreshToken = generateRefreshToken(res, user.id);

        successResponse(res, {
            _id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            token: generateAccessToken(user.id),
            refreshToken,
        }, "Account verified successfully");
        return;
    }

    // Fallback: direct verify via MSG91 API
    if (isDynamicOtp()) {
        try {
            const phoneValidation = validateAndFormatIndianMobile(user.phone || phone);
            const targetPhone = phoneValidation.isValid ? phoneValidation.internationalNumber : (user.phone || phone);
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

// @desc    Resend OTP to mobile number
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        res.status(400);
        throw new Error('Please provide your mobile number');
    }

    const user = await findUserByPhone(phone);

    if (!user) {
        res.status(404);
        throw new Error('User not found with this mobile number');
    }

    if (user.isVerified) {
        res.status(400);
        throw new Error('Account is already verified');
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    let sent = false;

    if (isDynamicOtp()) {
        const phoneValidation = validateAndFormatIndianMobile(user.phone || phone);
        const targetPhone = phoneValidation.isValid ? phoneValidation.internationalNumber : (user.phone || phone);
        try {
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
    } else {
        console.log(`[Resend OTP - STATIC MODE] OTP_STATUS is false. Static OTP: ${otp}`);
        sent = true;
    }

    if (sent || process.env.NODE_ENV === 'development' || !isDynamicOtp()) {
        const resendMsg = !isDynamicOtp() 
            ? `Static OTP active: ${otp}` 
            : `Verification OTP resent successfully to ${user.phone || phone}`;
        successResponse(res, null, resendMsg);
    } else {
        res.status(500);
        throw new Error('Failed to deliver OTP to mobile number');
    }
});

// @desc    Forgot Password (Send OTP to mobile number)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        res.status(400);
        throw new Error('Please provide your mobile number (+91)');
    }

    const user = await findUserByPhone(phone);

    if (!user) {
        res.status(404);
        throw new Error('User with this mobile number not found');
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    let sent = false;

    if (isDynamicOtp()) {
        const phoneValidation = validateAndFormatIndianMobile(user.phone || phone);
        const targetPhone = phoneValidation.isValid ? phoneValidation.internationalNumber : (user.phone || phone);
        try {
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
    } else {
        console.log(`[Forgot Password OTP - STATIC MODE] OTP_STATUS is false. Static OTP: ${otp}`);
        sent = true;
    }

    if (sent || process.env.NODE_ENV === 'development' || !isDynamicOtp()) {
        const forgotMsg = !isDynamicOtp() 
            ? `Password reset OTP generated. Static OTP: ${otp}` 
            : `Password reset OTP sent to ${user.phone || phone}`;
        successResponse(res, null, forgotMsg);
    } else {
        user.otp = null;
        user.otpExpire = null;
        await user.save();
        res.status(500);
        throw new Error('Could not send reset OTP to mobile number');
    }
});

// @desc    Reset Password via mobile OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { phone, otp, password } = req.body;

    if (!phone) {
        res.status(400);
        throw new Error('Please provide your mobile number (+91)');
    }

    const user = await findUserByPhone(phone);

    if (!user) {
        res.status(404);
        throw new Error('User with this mobile number not found');
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
