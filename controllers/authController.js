const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { successResponse } = require('../utils/responseHelper');
const sendEmail = require('../utils/emailService');

// Helper to generate 6 digit OTP
const generateOTP = () => {
    return "123456"; //Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ where: { email: email ? email.toLowerCase() : '' } });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Create user
    const otp = generateOTP();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
        name,
        email,
        password,
        otp,
        otpExpire,
        isVerified: false
    });

    if (user) {
        // Send OTP Email
        const message = `Your confirmation code is: ${otp}\n\nThis code will expire in 10 minutes.`;
        try {
            await sendEmail({
                email: user.email,
                subject: 'Clarysays - Account Verification',
                message
            });
            
            successResponse(res, {
                _id: user.id,
                name: user.name,
                email: user.email,
                isVerified: false
            }, "Registered successfully. Please check your email for verification code.", 201);
        } catch {
            // If email fails, return success but warn
            successResponse(res, {
                _id: user.id,
                name: user.name,
                email: user.email,
                isVerified: false
            }, "Registered, but failed to send email. Please try logging in to resend code.", 201);
        }
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ where: { email: email ? email.toLowerCase() : '' } });

    if (user && (await user.matchPassword(password))) {
        if (!user.isVerified) {
             const otp = generateOTP();
             user.otp = otp;
             user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
             await user.save();

             const message = `Your confirmation code is: ${otp}\n\nThis code will expire in 10 minutes.`;
             try {
                await sendEmail({
                    email: user.email,
                    subject: 'Clarysays - Account Verification',
                    message
                });
             } catch {
                  console.log("Failed to send verification email on login");
             }

             res.status(401).json({
                 status: 0,
                 message: 'Please verify your email first. A new code has been sent.',
                 isVerified: false
             });
             return;
        }

        // Generate Refresh Token
        const refreshToken = generateRefreshToken(res, user.id);

        successResponse(res, {
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateAccessToken(user.id),
            refreshToken,
        });
    } else {
        res.status(400);
        throw new Error('Invalid credentials');
    }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email: email ? email.toLowerCase() : '' } });

    if (!user) {
        res.status(400);
        throw new Error('User not found');
    }

    if (user.isVerified) {
         res.status(400);
         throw new Error('User already verified');
    }

    if (user.otp === otp && user.otpExpire > Date.now()) {
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
            role: user.role,
            token: generateAccessToken(user.id),
            refreshToken,
        }, "Email verified successfully");
    } else {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ where: { email: email ? email.toLowerCase() : '' } });

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

    const message = `Your new confirmation code is: ${otp}`;
    try {
        await sendEmail({
             email: user.email,
             subject: 'Clarysays - Resend Verification Code',
             message
        });
        successResponse(res, null, "OTP resent successfully");
    } catch {
        res.status(500);
        throw new Error('Email could not be sent');
    }
});

// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ where: { email: email ? email.toLowerCase() : '' } });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); 
    await user.save();

    const message = `Your password reset code is: ${otp}`;
    try {
        await sendEmail({
             email: user.email,
             subject: 'Clarysays - Password Reset Code',
             message
        });
        successResponse(res, null, "Reset code sent to email");
    } catch {
        if (process.env.NODE_ENV !== 'production') {
             console.log("Email failed in Dev (ignoring)");
             successResponse(res, null, "Reset code generated (check console)");
             return; 
        }

        user.otp = null;
        user.otpExpire = null;
        await user.save();
        res.status(500);
        throw new Error('Email could not be sent');
    }
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;
    const user = await User.findOne({ where: { email: email ? email.toLowerCase() : '' } });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.otp === otp && user.otpExpire > Date.now()) {
        user.password = password;
        user.otp = null;
        user.otpExpire = null;
        await user.save();

        successResponse(res, null, "Password reset successful");
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
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    logoutUser,
    refreshToken
};
